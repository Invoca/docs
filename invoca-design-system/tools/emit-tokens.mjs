#!/usr/bin/env node
/**
 * emit-tokens.mjs — generates the Reference layer of the Titan documentation.
 *
 * Reads Titan's DTCG token sources and the generated token manifest, and writes
 * MDX snippets into docs/snippets/generated/tokens/.
 *
 * Contract (docs/snippets/generated/README.md):
 *   1. Emit effective values, not declared ones.
 *   2. Classify every value: token-bound, or shipped without a token behind it.
 *   3. Emit per-mode values. Density-constant is a deliberate property — say so.
 *   4. Read source DTCG JSON, never the flat .ts outputs. The .ts files are resolved
 *      for createTheme() and have lost their alias chains.
 *   5. Mark what the system does not ship.
 *
 * Resolved values come from token-manifest.json, which the Style Dictionary build
 * produces and is therefore authoritative for what ships. Alias chains come from the
 * DTCG sources, which the manifest has flattened away. Where this script can resolve
 * a value itself it cross-checks against the manifest and reports any disagreement
 * rather than silently preferring one.
 *
 * Usage:
 *   node tools/emit-tokens.mjs [--titan <path>] [--check]
 *
 *   --titan <path>   Titan checkout (default ~/invoca/Titan)
 *   --check          Re-emit to memory; exit 1 if any output differs from disk.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, "..");
const OUT_DIR = join(DOCS, "snippets", "generated", "tokens");

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2);
const CHECK = argv.includes("--check");
const titanFlag = argv.indexOf("--titan");
const TITAN =
  titanFlag !== -1 && argv[titanFlag + 1]
    ? argv[titanFlag + 1]
    : join(homedir(), "invoca", "Titan");

const THEME = join(TITAN, "components", "core", "src", "theme");
const TOKENS_DIR = join(THEME, "tokens");
const MANIFEST = join(THEME, "generated", "token-manifest.json");

for (const p of [TOKENS_DIR, MANIFEST]) {
  if (!existsSync(p)) {
    console.error(`Cannot find ${p}\nPass --titan <path to Titan checkout>.`);
    process.exit(2);
  }
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

// ---------------------------------------------------------------- load

const SOURCES = {
  primitives: readJson(join(TOKENS_DIR, "primitives.tokens.json")),
  semantic: readJson(join(TOKENS_DIR, "semantic.tokens.json")),
  component: readJson(join(TOKENS_DIR, "component.tokens.json")),
  typography: readJson(join(TOKENS_DIR, "typography.tokens.json")),
};
const manifest = readJson(MANIFEST);

// The naming specification, transcribed and committed. Diffable and gated by --check;
// deliberately NOT a live dependency on the source spreadsheet.
const SPEC = readJson(join(HERE, "spec-vocabulary.json"));

/**
 * Walk a DTCG tree into flat records keyed by dot path.
 * cssName mirrors the build's `titan/name` transform: --titan- + segments joined
 * by "-", with no kebab-casing of segments (so palette.primary.contrastText stays
 * camelCase, matching MUI's runtime naming).
 */
const registry = new Map();
function walk(node, path, file) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (!value || typeof value !== "object") continue;
    const next = [...path, key];
    if ("$value" in value) {
      const dotted = next.join(".");
      registry.set(dotted, {
        path: dotted,
        segments: next,
        cssName: `--titan-${next.join("-")}`,
        type: value.$type,
        raw: value.$value,
        dark: value.$extensions?.["com.invoca.dark"],
        compact: value.$extensions?.["com.invoca.density.compact"],
        description: value.$description,
        file,
      });
    } else {
      walk(value, next, file);
    }
  }
}
for (const [file, tree] of Object.entries(SOURCES)) walk(tree, [], file);

const byCssName = new Map();
for (const rec of registry.values()) byCssName.set(rec.cssName, rec);

const manifestByName = new Map(manifest.tokens.map((t) => [t.name, t]));
for (const rec of registry.values()) {
  const m = manifestByName.get(rec.cssName);
  if (m) {
    rec.tier = m.tier;
    rec.axis = m.axis;
    rec.values = m.values;
  }
}

// ---------------------------------------------------------------- resolution

const REF = /^\{([^}]+)\}$/;
const REF_INLINE = /\{([^}]+)\}/g;

/** Raw value for a record in a given mode, falling back to light. */
function rawFor(rec, mode) {
  if (mode === "dark" && rec.dark !== undefined) return rec.dark;
  if (mode === "compact" && rec.compact !== undefined) return rec.compact;
  return rec.raw;
}

/**
 * Resolve a raw value to a leaf. Handles three shapes the sources actually use:
 * a bare reference "{color.blue.50}", an interpolated string
 * "0 0 0.25rem {color.blue.50}", and a composite object (shadow, typography).
 */
function resolve(raw, mode, seen = new Set()) {
  if (raw && typeof raw === "object") {
    const out = {};
    for (const [k, v] of Object.entries(raw)) out[k] = resolve(v, mode, seen);
    return out;
  }
  if (typeof raw !== "string") return raw;

  const bare = raw.match(REF);
  if (bare) {
    const target = bare[1];
    if (seen.has(target)) return raw; // cycle guard
    const rec = registry.get(target);
    if (!rec) return raw;
    return resolve(rawFor(rec, mode), mode, new Set([...seen, target]));
  }
  if (REF_INLINE.test(raw)) {
    return raw.replace(REF_INLINE, (m, target) => {
      const rec = registry.get(target);
      if (!rec) return m;
      const v = resolve(rawFor(rec, mode), mode, new Set([...seen, target]));
      return typeof v === "string" ? v : m;
    });
  }
  return raw;
}

/** The alias chain for a record, from itself down to the leaf. */
function chain(rec, mode) {
  const out = [rec.path];
  let raw = rawFor(rec, mode);
  const seen = new Set([rec.path]);
  while (typeof raw === "string") {
    const bare = raw.match(REF);
    if (!bare) break;
    const target = bare[1];
    if (seen.has(target)) break;
    seen.add(target);
    out.push(target);
    const next = registry.get(target);
    if (!next) break;
    raw = rawFor(next, mode);
  }
  return out;
}

/**
 * Human-readable alias chain, e.g. "tokens.background-info → color.blue.50".
 * Composite and interpolated values ("0 0 0.25rem {color.blue.50}") carry their
 * reference inside the value rather than as a bare alias, so pull those out too —
 * otherwise a token that clearly points at a primitive reports no chain at all.
 */
function chainStr(rec, mode) {
  const c = chain(rec, mode);
  if (c.length > 1) return c.slice(1).join(" → ");

  const raw = rawFor(rec, mode);
  const embedded = new Set();
  const scan = (v) => {
    if (typeof v === "string") {
      for (const m of v.matchAll(REF_INLINE)) embedded.add(m[1]);
    } else if (v && typeof v === "object") {
      Object.values(v).forEach(scan);
    }
  };
  scan(raw);
  return embedded.size ? [...embedded].join(", ") : "—";
}

/** Where a token's alias lands: the semantic tier, a primitive, or nowhere. */
function aliasTier(rec, mode) {
  const targets = chainStr(rec, mode);
  if (targets === "—") return "literal";
  return targets.split(/[,→]/).some((t) => t.trim().startsWith("tokens.")) ? "semantic" : "primitive";
}

/** Rendered value for display. Prefers the manifest (authoritative for what ships). */
function value(rec, mode = "light") {
  if (rec.values && rec.values[mode] !== undefined) return rec.values[mode];
  const r = resolve(rawFor(rec, mode), mode);
  if (r && typeof r === "object") {
    if (rec.type === "shadow") {
      return `${r.offsetX} ${r.offsetY} ${r.blur} ${r.spread} ${r.color}`;
    }
    return JSON.stringify(r);
  }
  return r;
}

/** Does this token actually differ between two modes? */
function flips(rec, mode) {
  if (!rec.values) return false;
  return rec.values[mode] !== undefined && rec.values[mode] !== rec.values.light;
}

// ---------------------------------------------------------------- selection

const tokensOnly = [...registry.values()].filter((r) => r.segments[0] === "tokens");
const primitives = [...registry.values()].filter((r) => r.tier === "primitive");

/** Natural sort, so spacing-10 follows spacing-9 rather than spacing-1. */
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const byName = (a, b) => collator.compare(a.path, b.path);

const named = (prefix) =>
  tokensOnly.filter((r) => r.segments[1].startsWith(prefix)).sort(byName);
const shortName = (r) => r.segments.slice(1).join(".");

// ---------------------------------------------------------------- contrast

function hexToRgb(hex) {
  const h = String(hex).trim().replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(h)) return null;
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG 2.x relative luminance. https://www.w3.org/WAI/GL/wiki/Relative_luminance */
function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  if (l1 === null || l2 === null) return null;
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const fmt = (r) => (r === null ? "n/a" : r.toFixed(2) + ":1");

/** AA verdict for body text (4.5:1), large text (3:1). */
function verdictText(r) {
  if (r === null) return "n/a";
  if (r >= 4.5) return `${fmt(r)} ✅`;
  if (r >= 3) return `${fmt(r)} ⚠️ large only`;
  return `${fmt(r)} ❌`;
}

/** AA verdict for non-text (3:1). */
function verdictNonText(r) {
  if (r === null) return "n/a";
  return r >= 3 ? `${fmt(r)} ✅` : `${fmt(r)} ❌`;
}

const tokenValue = (name, mode) => {
  const rec = registry.get(`tokens.${name}`);
  return rec ? value(rec, mode) : null;
};

// ---------------------------------------------------------------- emit helpers

const HEADER = `{/* GENERATED — do not hand-edit. Produced by tools/emit-tokens.mjs from Titan DTCG source. */}\n`;

const files = new Map();
const emit = (name, body) => files.set(name, HEADER + body.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");

const table = (headers, rows) =>
  [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

const code = (s) => "`" + s + "`";

/**
 * The recorded definition for a token, from its $description in source.
 *
 * Three honest states, because the source fields are engineering notes written for
 * engineers — not authored design definitions:
 *
 *   "—"                     no description at all (64% of consumable tokens)
 *   "*implementation note*" a description exists but only describes mechanism —
 *                           build extensions, mode plumbing, ticket references
 *   the text                a description that actually says what the token is for
 *
 * Collapsing the middle case into the third would publish mode and build detail as
 * though it were design intent. Collapsing it into the first would claim nothing was
 * recorded when something was.
 */
const MECHANISM = /\$extensions|data-density|density|compact|dark scheme|re-point|locked table/i;

const clean = (s) =>
  s
    // Parentheticals carry ticket refs and "e.g." asides. Strip before splitting
    // sentences, or the abbreviation truncates the line mid-word.
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*TRI-\d+/g, "")
    // Framework names are archaeology for this audience.
    .replace(/\bUA\/MUI\b|\bMUI's\b|\bMUI\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .split(/\.\s+/)[0]
    .replace(/\|/g, "\\|")
    .replace(/[.\s]+$/, "")
    .trim();

/**
 * Two sources of truth for what a token is *for*, in precedence order:
 *
 *   1. `$description` in Titan source — closest to the code, but written by engineers,
 *      so it often describes mechanism rather than purpose.
 *   2. The naming specification (`spec-vocabulary.json`) — authored by design, and the
 *      baseline the design language is being built on.
 *
 * Source wins when it states intent. Where source says nothing, or says only how the
 * build works, the spec fills in. Every definition is marked with where it came from,
 * because "the engineer wrote this" and "design decided this" are different claims.
 */
const definition = (r) => {
  const name = r.segments[0] === "tokens" ? r.segments.slice(1).join("-") : null;
  const fromCode = r.description ? clean(r.description) : "";
  if (fromCode && !MECHANISM.test(fromCode)) return { text: fromCode, from: "code" };

  const fromSpec = name && SPEC.definitions[name] ? clean(SPEC.definitions[name]) : "";
  if (fromSpec) return { text: fromSpec, from: "spec" };

  if (fromCode) return { text: "*implementation note*", from: "code" };
  return { text: "—", from: "—" };
};

const defText = (r) => definition(r).text;
const defFrom = (r) => definition(r).from;

/** How many of a set carry a definition that actually states intent, from either source. */
const definedCount = (recs) =>
  recs.filter((r) => !["—", "*implementation note*"].includes(defText(r))).length;

/**
 * Titan ships a dark color scheme and a compact density. Neither carries a design
 * decision yet, so this documentation defines the default mode only.
 *
 * Omitting the other modes silently would make the docs lie about the package, so
 * every affected table states how many tokens move and points at the open decision.
 * One line, not a table — the values are deliberately not published here.
 */
const modeNote = (recs) => {
  const d = recs.filter((r) => flips(r, "dark")).length;
  const c = recs.filter((r) => flips(r, "compact")).length;
  const parts = [];
  if (d) parts.push(`**${d}** hold a different value in the dark color scheme`);
  if (c) parts.push(`**${c}** hold a different value at compact density`);
  if (!parts.length) return "";
  return `
<Note>
  **Default mode only.** Values above are the light color scheme at comfortable density.
  Of these tokens, ${parts.join(" and ")}. Those modes ship in code but carry no
  design decision, so this documentation does not define them — see
  [TITAN-GAP-01](/foundations/open-decisions#titan-gap-01).
</Note>
`;
};

// ---------------------------------------------------------------- color

const COLOR_ROLES = [
  ["background", "Surfaces and fills"],
  ["text", "Type"],
  ["border", "Strokes and dividers"],
  ["icon", "Icon glyphs"],
  ["link", "Links"],
  ["overlay", "Scrims"],
];

{
  const rows = COLOR_ROLES.map(([prefix, label]) => {
    const items = named(prefix)
      .filter((r) => r.type === "color")
      .map((r) => {
        const light = value(r, "light");
        // Both keys carry the light value: this documents the light scheme, so the
        // swatch must not change with the reader's docs theme.
        return `    <Color.Item name="tokens.${shortName(r)}" value={{ light: "${light}", dark: "${light}" }} />`;
      });
    if (!items.length) return "";
    return `  <Color.Row title="${label}">\n${items.join("\n")}\n  </Color.Row>`;
  }).filter(Boolean);

  const colors = tokensOnly.filter((r) => r.type === "color");

  emit(
    "color.mdx",
    `
The semantic color surface — ${colors.length} color tokens on \`theme.tokens\`. Every one is
token-bound; none is an untokenised literal. Swatches are click-to-copy.

<Color variant="table">
${rows.join("\n")}
</Color>
${modeNote(colors)}`
  );
}

{
  const ramps = new Map();
  for (const r of primitives.filter((p) => p.segments[0] === "color")) {
    const ramp = r.segments[1];
    if (!ramps.has(ramp)) ramps.set(ramp, []);
    ramps.get(ramp).push(r);
  }
  const rows = [...ramps.entries()].map(([ramp, recs]) => {
    const sorted = recs.sort((a, b) => {
      const na = Number(a.segments[2]);
      const nb = Number(b.segments[2]);
      return Number.isNaN(na) || Number.isNaN(nb)
        ? collator.compare(a.segments[2], b.segments[2])
        : na - nb;
    });
    const items = sorted
      .map(
        (r) =>
          `    <Color.Item name="color.${r.segments.slice(1).join(".")}" value={{ light: "${value(r, "light")}", dark: "${value(r, "light")}" }} />`
      )
      .join("\n");
    return `  <Color.Row title="${ramp}">\n${items}\n  </Color.Row>`;
  });

  emit(
    "color-primitive.mdx",
    `
Tier 1. The raw ramps, ${primitives.filter((p) => p.segments[0] === "color").length} values across ${ramps.size} groups.

<Warning>
  **Primitives never appear in component code.** They exist to be aliased by semantic
  tokens, which is where meaning is attached. A primitive carries a value and no intent —
  reaching for one directly means the reason you chose it is recorded nowhere. See
  [TITAN-FND-01](/foundations/overview#constraints).
</Warning>

<Color variant="table">
${rows.join("\n")}
</Color>
`
  );
}

{
  const semanticColors = tokensOnly
    .filter((r) => r.type === "color" && r.tier === "semantic")
    .sort(byName);
  const rows = semanticColors.map((r) => [
    code(shortName(r)),
    code(String(value(r, "light"))),
    code(chainStr(r, "light")),
    defText(r),
    defFrom(r),
  ]);
  const definedC = definedCount(semanticColors);
  emit(
    "color-semantic.mdx",
    `
Tier 2. Every semantic color token, the primitive it aliases, and the definition recorded
for it in source.

Two columns do the work. **Aliases** shows *why* a token holds the value it holds, which the
resolved hex cannot tell you. **Definition** is the recorded intent — what the token is for.

${table(["Token", "Value", "Aliases", "Definition", "From"], rows)}

<Warning>
  **Definition coverage: ${definedC} of ${semanticColors.length} semantic color tokens.**
  An em-dash means nothing was recorded; *implementation note* means something was recorded but
  it describes build mechanism rather than purpose. In both cases the only real guide is the name. See [TITAN-GAP-02](/foundations/open-decisions#titan-gap-02).
</Warning>
${modeNote(semanticColors)}`
  );
}

// ---------------------------------------------------------------- interaction states

{
  const STATES = [
    ["Hover", "hover"],
    ["Pressed", "pressed"],
    ["Selected", "selected"],
    ["Disabled", "disabled"],
  ];
  const sections = STATES.map(([label, needle]) => {
    const recs = tokensOnly
      .filter((r) => r.type === "color" && r.segments[1].includes(needle))
      .sort(byName);
    const rows = recs.map((r) => [
      code(shortName(r)),
      r.tier ?? "—",
      code(String(value(r, "light"))),
      code(chainStr(r, "light")),
      defText(r),
    defFrom(r),
    ]);
    return `### ${label}\n\n${table(
      ["Token", "Tier", "Value", "Aliases", "Definition", "From"],
      rows
    )}`;
  });

  emit(
    "interaction-states.mdx",
    `
${sections.join("\n\n")}

### Focus

<Warning>
  **No semantic focus token exists.** Three component-scoped focus rings ship —
  \`form-field-focus-ring\`, \`form-field-focus-ring-error\`, and \`data-grid-focus-ring\` —
  each authored independently against a primitive. There is no token a new component can
  reach for. See [TITAN-DIV-02](/foundations/divergences#titan-div-02).
</Warning>

${table(
  ["Token", "Tier", "Value", "Aliases", "Definition", "From"],
  ["form-field-focus-ring", "form-field-focus-ring-error", "data-grid-focus-ring"].map((n) => {
    const r = registry.get(`tokens.${n}`);
    return [
      code(n),
      r.tier ?? "—",
      code(String(value(r, "light"))),
      code(chainStr(r, "light")),
      defText(r),
    defFrom(r),
    ];
  })
)}

Two further focus-related values ship outside the token layer and carry no design decision.
Do not reach for them.
`
  );
}

// ---------------------------------------------------------------- spacing

{
  const rem = (v) => {
    const m = String(v).match(/^([\d.]+)rem$/);
    return m ? `${parseFloat(m[1]) * 16}px` : String(v);
  };
  const recs = named("spacing");
  const rows = recs.map((r) => {
    const light = value(r, "light");
    return [
      code(shortName(r)),
      code(String(light)),
      rem(light),
      defText(r),
    defFrom(r),
    ];
  });
  const definedS = definedCount(recs);

  emit(
    "spacing.mdx",
    `
${table(["Token", "Value", "px", "Definition", "From"], rows)}

<Warning>
  **The number is a position on the scale, not a multiplier.** \`spacing-5\` is 16px, not 20px.
  Pick by role using the table on this page, never by arithmetic.
</Warning>

<Warning>
  **Definition coverage: ${definedS} of ${recs.length} spacing tokens.** Nothing records which gap each
  step is for. See [TITAN-GAP-02](/foundations/open-decisions#titan-gap-02).
</Warning>

<Warning>
  **A second, older spacing helper also exists**, based on an 8px multiplier. It is not the
  scale above and does not resolve to these steps. Anything spacing-related should use a
  \`spacing-*\` token.
</Warning>
${modeNote(recs)}`
  );
}

// ---------------------------------------------------------------- typography

{
  const variants = [...registry.values()]
    .filter((r) => r.file === "typography")
    .sort(byName);
  const rows = variants.map((r) => {
    const v = resolve(r.raw, "light");
    const tf = v.textTransform ? v.textTransform : "—";
    const fs = v.fontStyle ? v.fontStyle : "—";
    return [
      code(r.segments.slice(1).join(".")),
      code(String(v.fontSize)),
      code(String(v.lineHeight)),
      code(String(v.fontWeight)),
      code(String(v.letterSpacing)),
      tf === "—" && fs === "—" ? "—" : [tf, fs].filter((x) => x !== "—").join(", "),
    ];
  });

  emit(
    "typography.mdx",
    `
${table(["Variant", "Size", "Line height", "Weight", "Letter spacing", "Other"], rows)}

<Note>
  **${variants.length} variants are defined, but only eleven are the design vocabulary.**
  \`<Typography>\` exposes eleven names; the rest exist in the scale without being reachable
  through it. Choose from the eleven. See
  [TITAN-DIV-04](/foundations/divergences#titan-div-04).
</Note>

Type is mode-independent — it does not vary with color scheme or density.
`
  );
}

// ---------------------------------------------------------------- elevation

{
  const shadows = named("shadow");
  const shadowRows = shadows.map((r) => [
    code(shortName(r)),
    code(String(value(r, "light"))),
    defText(r),
    defFrom(r),
  ]);
  const z = named("z").sort((a, b) => Number(value(a)) - Number(value(b)));
  const zRows = z.map((r) => [
    code(shortName(r)),
    code(String(value(r, "light"))),
    defText(r),
    defFrom(r),
  ]);
  const definedSh = definedCount(shadows);

  emit(
    "elevation.mdx",
    `
### Shadows

${table(["Token", "Value", "Definition", "From"], shadowRows)}

Each \`-main\` token aliases its \`-1\` sibling.

<Warning>
  **Definition coverage: ${definedSh} of ${shadows.length} shadow tokens.** Nothing
  records which surface each level is for, so the mapping on the elevation page is a proposal. See
  [TITAN-GAP-02](/foundations/open-decisions#titan-gap-02).
</Warning>

### Z-index

${table(["Token", "Value", "Definition", "From"], zRows)}

<Warning>
  **This ladder does not cover every layer that stacks.** Drawers and toasts take their
  stacking from the underlying component library, not from a token, so a Titan surface at
  \`z-overlay\` can sit *below* them. See
  [Elevation](/foundations/elevation#the-ladder-has-holes).
</Warning>
${modeNote(shadows.concat(z))}`
  );
}

// ---------------------------------------------------------------- radius

{
  const radii = named("radius");
  const rows = radii.map((r) => [
    code(shortName(r)),
    code(String(value(r, "light"))),
    code(chainStr(r, "light")),
    defText(r),
    defFrom(r),
  ]);
  const definedR = definedCount(radii);
  emit(
    "radius.mdx",
    `
${table(["Token", "Value", "Aliases", "Definition", "From"], rows)}

Radius is mode-independent.

${
  definedR === 0
    ? `<Warning>
  **None of the ${radii.length} radius tokens carries a definition that states intent.** Nothing records
  which surface gets which value, so the mapping on this page is a proposal. See
  [TITAN-GAP-02](/foundations/open-decisions#titan-gap-02).
</Warning>`
    : ""
}
`
  );
}

// ---------------------------------------------------------------- motion

{
  const easings = named("motion-easing").map((r) => [
    code(shortName(r)),
    code(String(value(r, "light"))),
  ]);
  const durations = named("motion-duration")
    .sort((a, b) => parseInt(value(a)) - parseInt(value(b)))
    .map((r) => [code(shortName(r)), code(String(value(r, "light")))]);

  emit(
    "motion.mdx",
    `
### Easings

${table(["Token", "Value"], easings)}

### Durations

${table(["Token", "Value"], durations)}

<Note>
  **These values are named for their length, not for their purpose.** Nothing records which
  interaction each duration is meant for, so the mapping on the motion page is a proposal
  rather than a transcription.
</Note>

Motion is mode-independent. No token expresses a reduced-motion variant.
`
  );
}

// ---------------------------------------------------------------- iconography

{
  const sizes = named("icon-").filter((r) => r.type === "dimension");
  const colors = tokensOnly
    .filter((r) => r.segments[1].startsWith("icon-") && r.type === "color")
    .sort(byName);

  let iconCount = "unknown";
  const iconIndex = join(TITAN, "components", "core", "src", "icons", "index.js");
  if (existsSync(iconIndex)) {
    const src = readFileSync(iconIndex, "utf8");
    const block = src.match(/export\s*\{([\s\S]*?)\}/);
    if (block) {
      iconCount = String(
        block[1]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean).length
      );
    }
  }

  emit(
    "iconography.mdx",
    `
### Sizes

${table(
  ["Token", "Value", "Definition", "From"],
  sizes.map((r) => [code(shortName(r)), code(String(value(r, "light"))), defText(r), defFrom(r)])
)}

### Colors

${table(
  ["Token", "Value", "Aliases", "Definition", "From"],
  colors.map((r) => [
    code(shortName(r)),
    code(String(value(r, "light"))),
    code(chainStr(r, "light")),
    defText(r),
    defFrom(r),
  ])
)}

**The library ships ${iconCount} icons**, exported from \`components/core/src/icons/index.js\`.
Only icons in that index may be used.

<Warning>
  Icon colors carry the same values as their \`text-*\` counterparts, so they inherit the
  same contrast results. \`icon-success\` and \`icon-warning\` fall below the 3:1 non-text
  minimum — see [contrast](/foundations/accessibility#contrast).
</Warning>
${modeNote(sizes.concat(colors))}`
  );
}

// ---------------------------------------------------------------- layout

{
  // Breakpoints are not Titan tokens — they come from the underlying component library.
  // Read them from the installed package rather than asserting them; if not resolvable,
  // say so instead of publishing a remembered number.
  let bpRows = null;
  let bpSource = null;
  const candidates = [
    join(TITAN, "node_modules", "@mui", "system", "createBreakpoints", "createBreakpoints.js"),
  ];
  // pnpm keeps the real package under .pnpm/<name>@<version>/node_modules/...
  const pnpmRoot = join(TITAN, "node_modules", ".pnpm");
  if (existsSync(pnpmRoot)) {
    for (const dir of readdirSync(pnpmRoot)) {
      if (!dir.startsWith("@mui+system@")) continue;
      candidates.push(
        join(pnpmRoot, dir, "node_modules", "@mui", "system", "createBreakpoints", "createBreakpoints.js")
      );
    }
  }
  for (const c of candidates) {
    if (!existsSync(c)) continue;
    const src = readFileSync(c, "utf8");
    // The defaults carry inline device comments; capture them as the label column.
    const block = src.match(/values\s*=\s*\{([\s\S]*?)\n\s*\}/);
    if (!block) continue;
    const found = [...block[1].matchAll(/(\w+)\s*:\s*(\d+),?\s*(?:\/\/\s*(.+))?/g)].map((m) => [
      m[1],
      m[2],
      (m[3] || "").trim(),
    ]);
    if (found.length) {
      bpRows = found.map(([k, v, label]) => [code(k), `${v}px`, label || "—"]);
      bpSource = c.slice(c.indexOf("node_modules"));
      break;
    }
  }

  const breakpointSection = bpRows
    ? table(["Breakpoint", "Min width", "Typical device"], bpRows)
    : `<Warning>
  **Not emitted.** The breakpoint values could not be read from the Titan checkout, and this
  emitter does not publish remembered values. Install dependencies and re-run.
</Warning>`;

  emit(
    "layout.mdx",
    `
### Breakpoints

${breakpointSection}

<Note>
  **Breakpoints are not tokens.** They emit no custom property and appear nowhere in the
  token manifest, so they cannot be reached the way a color or a space can. They are also
  the one foundation with no recorded Invoca decision behind the values.
</Note>

### Grid

The grid is 12 columns.

<Warning>
  **The grid's own \`spacing\` prop is not the Titan spacing scale.** It resolves through a
  separate 8px multiplier that maps to no step on this system's scale. Set gaps from a
  \`spacing-*\` token instead.
</Warning>

<Warning>
  **Titan defines no grid specification.** There is no columns-per-breakpoint table, no
  gutter scale, and no page margin scale. This is a gap rather than an omission from this
  page: the values do not exist to emit. See
  [TITAN-DIV-08](/foundations/divergences#titan-div-08).
</Warning>
`
  );
}

// ---------------------------------------------------------------- tier audit

{
  const tier3 = tokensOnly.filter((r) => r.tier === "component").sort(byName);
  const referencing = tier3.filter((r) => aliasTier(r, "light") !== "literal");
  const viaSemantic = referencing.filter((r) => aliasTier(r, "light") === "semantic");
  const viaPrimitive = referencing.filter((r) => aliasTier(r, "light") === "primitive");
  const literals = tier3.filter((r) => aliasTier(r, "light") === "literal");

  const rows = viaPrimitive.map((r) => [
    code(shortName(r)),
    code(chainStr(r, "light")),
    defText(r),
    defFrom(r),
  ]);

  emit(
    "tier-audit.mdx",
    `
Titan's stated token model is three tiers: a component token aliases a semantic token,
which aliases a primitive. This table audits Tier 3 against that model.

${table(
  ["", "Count"],
  [
    ["Tier-3 tokens total", String(tier3.length)],
    ["Carrying a reference", String(referencing.length)],
    ["→ referencing a **semantic** token", `**${viaSemantic.length}**`],
    ["→ referencing a **primitive** directly", `**${viaPrimitive.length}**`],
    ["Literal values — geometry, durations, no reference", String(literals.length)],
  ]
)}

${
  viaSemantic.length === 0
    ? `Every Tier-3 token that carries a reference points at a primitive. None routes through the semantic tier.`
    : `${viaSemantic.length} route through the semantic tier; ${viaPrimitive.length} do not.`
}

<Note>
  **This does not break anything today.** Each of these tokens resolves correctly and every
  one carries a recorded reason for existing. The cost is that its relationship to the
  semantic token it was derived from exists only in prose — \`chip-success-tint\` is described
  as "one ramp step deeper than \`background-success-alt\`", and nothing in the token graph
  encodes that, so retuning \`background-success-alt\` will not move the chip.
</Note>

Each row carries the definition recorded in source. These were deliberate choices with
stated reasoning, not oversights.

${table(["Token", "Aliases", "Recorded definition", "From"], rows)}

<Warning>
  **This is invisible in the resolved output.** \`theme.tokens\` and the token manifest
  publish leaf values, so a token that skipped the semantic tier looks identical to one that
  did not. It shows only in the DTCG source. See
  [TITAN-DIV-01](/foundations/divergences#titan-div-01).
</Warning>
`
  );
}

// ---------------------------------------------------------------- contrast

{
  const TEXT = [
    "text-primary",
    "text-strong",
    "text-secondary",
    "text-selected",
    "text-info-alt",
    "text-error-alt",
    "text-success-alt",
    "text-warning-alt",
    "text-info",
    "text-error",
    "text-warning",
    "text-success",
    "text-disabled",
  ];

  const textTable = (mode) => {
    const bgDefault = tokenValue("background-default", mode);
    const bgView = tokenValue("background-view-background", mode);
    const rows = TEXT.map((n) => {
      const fg = tokenValue(n, mode);
      const exempt = n === "text-disabled";
      const r1 = ratio(fg, bgDefault);
      const r2 = ratio(fg, bgView);
      return [
        code(n),
        code(String(fg)),
        exempt ? `${fmt(r1)} — exempt` : verdictText(r1),
        exempt ? `${fmt(r2)} — exempt` : verdictText(r2),
      ];
    });
    return table(
      [
        "Token",
        "Hex",
        `On \`background-default\` (${bgDefault})`,
        `On \`background-view-background\` (${bgView})`,
      ],
      rows
    );
  };

  const pairTable = (pairs, verdict) =>
    table(
      ["Pairing", "Ratio"],
      pairs.map(([fg, bg]) => [
        `${code(fg)} on ${code(bg)}`,
        verdict(ratio(tokenValue(fg, "light"), tokenValue(bg, "light"))),
      ])
    );

  const tinted = ["info", "success", "error", "warning"].map((s) => [
    `text-${s}-alt`,
    `background-${s}-alt`,
  ]);
  const bold = ["info", "error", "warning", "success"].map((s) => ["text-invert", `background-${s}`]);
  const inverted = [
    ["text-primary-invert", "background-strong"],
    ["text-error-invert", "background-error"],
  ];

  const ICONS = [
    "icon-default",
    "icon-info",
    "icon-success",
    "icon-warning",
    "icon-error",
    "icon-selected",
  ];
  const iconRows = ICONS.map((n) => {
    const fg = tokenValue(n, "light");
    return [
      code(n),
      code(String(fg)),
      verdictNonText(ratio(fg, tokenValue("background-default", "light"))),
      verdictNonText(ratio(fg, tokenValue("background-view-background", "light"))),
    ];
  });

  // Target Size (Minimum, AA) is 24x24. Compare the real value rather than asserting.
  const AA_TARGET = 24;
  const AAA_TARGET = 44;
  const controls = named("control-height").map((r) => {
    const px = parseFloat(String(value(r, "light")));
    return [
      code(shortName(r)),
      code(String(value(r, "light"))),
      px >= AA_TARGET ? `✅ clears ${AA_TARGET}px` : `❌ under ${AA_TARGET}px`,
      px >= AAA_TARGET ? "✅" : `❌ under ${AAA_TARGET}px`,
      defText(r),
    defFrom(r),
    ];
  });

  emit(
    "contrast.mdx",
    `
Ratios below are computed from the live token values using the
[WCAG 2.x relative luminance formula](https://www.w3.org/WAI/GL/wiki/Relative_luminance).
They are arithmetic on what ships, not estimates. AA requires **4.5:1** for body text,
**3:1** for large text (≥18.66px bold or ≥24px regular) and for non-text.

### Text on surfaces

${textTable("light")}

### Tinted surface + \`-alt\` text

${pairTable(tinted, verdictText)}

### Bold fill + \`text-invert\`

${pairTable(bold, verdictText)}

### Inverted surfaces

${pairTable(inverted, verdictText)}

### Non-text contrast — icons

${table(
  ["Token", "Hex", "On `background-default`", "On `background-view-background`"],
  iconRows
)}

### Target size

${table(["Token", "Height", "AA (24×24)", "AAA (44×44)", "Definition", "From"], controls)}

Height is one dimension — an icon-only control must also meet 24px in width.
`
  );
}

// ---------------------------------------------------------------- definition coverage

{
  // Groups by the leading segment of the token name, so the table matches how a
  // reader browses the system rather than how the build files are split.
  const groups = new Map();
  for (const r of tokensOnly) {
    const g = r.segments[1].split("-")[0];
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(r);
  }

  const rows = [...groups.entries()]
    .map(([g, recs]) => {
      const stated = definedCount(recs);
      const mech = recs.filter((r) => defText(r) === "*implementation note*").length;
      const none = recs.filter((r) => defText(r) === "—").length;
      return { g, n: recs.length, stated, mech, none };
    })
    .sort((a, b) => b.none + b.mech - (a.none + a.mech) || b.n - a.n);

  const T = tokensOnly.length;
  const S = definedCount(tokensOnly);
  const M = tokensOnly.filter((r) => defText(r) === "*implementation note*").length;
  const N = tokensOnly.filter((r) => defText(r) === "—").length;
  const fromCode = tokensOnly.filter((r) => defFrom(r) === "code" && defText(r) !== "*implementation note*").length;
  const fromSpec = tokensOnly.filter((r) => defFrom(r) === "spec").length;

  emit(
    "definition-coverage.mdx",
    `
Every consumable token, grouped by prefix, against whether anything in source records what
it is *for*.

${table(
  ["Group", "Tokens", "States intent", "Implementation note only", "Nothing recorded"],
  rows.map((r) => [
    code(r.g + "-*"),
    String(r.n),
    r.stated ? `**${r.stated}**` : "**0**",
    String(r.mech),
    r.none ? `**${r.none}**` : "0",
  ])
)}

${table(
  ["", "Count", "Share"],
  [
    ["**States intent**", String(S), `${Math.round((S / T) * 100)}%`],
    ["  → from Titan source", String(fromCode), `${Math.round((fromCode / T) * 100)}%`],
    ["  → from the naming specification", String(fromSpec), `${Math.round((fromSpec / T) * 100)}%`],
    ["Implementation note only", String(M), `${Math.round((M / T) * 100)}%`],
    ["**Nothing recorded**", String(N), `${Math.round((N / T) * 100)}%`],
    ["Total consumable tokens", String(T), "100%"],
  ]
)}

<Note>
  **Two sources, and the difference matters.** A definition marked \`code\` comes from a
  \`$description\` in Titan source, written alongside the implementation. One marked \`spec\`
  comes from the naming specification, authored by design and confirmed as the baseline.
  Where both exist, source wins — it is closer to what ships.

  **${fromSpec} tokens are defined only by the specification**, meaning the intent exists but
  was never carried into the code. Contributing those back into \`$description\` would make
  them survive independently of this transcription.
</Note>

<Note>
  **Three states, not two.** *States intent* means one of the two sources records what the
  token is for. *Implementation note* means something was recorded, but it describes build
  mechanism rather than purpose. *Nothing recorded* means the name is the only guide.

  Counting the middle group as documented would overstate coverage by
  ${Math.round((M / T) * 100)} points.
</Note>
`
  );
}

// ---------------------------------------------------------------- self-check

const mismatches = [];
for (const rec of registry.values()) {
  if (!rec.values) continue;
  for (const mode of ["light", "dark", "compact"]) {
    if (rec.values[mode] === undefined) continue;
    let mine = resolve(rawFor(rec, mode), mode);
    if (mine && typeof mine === "object" && rec.type === "shadow") {
      mine = `${mine.offsetX} ${mine.offsetY} ${mine.blur} ${mine.spread} ${mine.color}`;
    }
    if (typeof mine !== "object" && String(mine) !== String(rec.values[mode])) {
      mismatches.push(`${rec.cssName} [${mode}] source=${mine} manifest=${rec.values[mode]}`);
    }
  }
}

// ---------------------------------------------------------------- write

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

let changed = 0;
for (const [name, body] of files) {
  const path = join(OUT_DIR, name);
  const prev = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (prev === body) continue;
  changed++;
  if (CHECK) {
    console.error(`drift: ${name}`);
  } else {
    writeFileSync(path, body, "utf8");
    console.log(`wrote ${name}`);
  }
}

console.log(
  `\n${registry.size} DTCG records · ${manifest.tokens.length} manifest entries · ` +
    `${files.size} snippets · ${changed} changed`
);

if (mismatches.length) {
  console.log(`\n${mismatches.length} source/manifest disagreement(s):`);
  for (const m of mismatches.slice(0, 20)) console.log(`  ${m}`);
  if (mismatches.length > 20) console.log(`  … ${mismatches.length - 20} more`);
}

if (CHECK && changed) {
  console.error(`\n${changed} file(s) differ from disk. Re-run without --check.`);
  process.exit(1);
}
