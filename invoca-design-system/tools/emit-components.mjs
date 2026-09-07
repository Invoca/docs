#!/usr/bin/env node
/**
 * emit-components.mjs — generates the Reference layer of component pages.
 *
 * Sibling to emit-tokens.mjs, same conventions (--titan, --check, GENERATED header).
 * Separate script because the inputs are different: component source, Storybook
 * stories, the package manifest, and CI-refreshed utilization data.
 *
 * Documentation groups by concept; the package exports by unit. `component-concepts.json`
 * records which exports a page covers, so one page can describe "button" while an
 * engineer still learns exactly what to import. See TITAN-DIV-10.
 *
 * Emits per concept:
 *   props/<slug>.mdx        what the component declares vs inherits, and what is themed
 *   matrix/<slug>.mdx       the variants Storybook actually publishes
 *   status/<slug>.mdx       package version and stability
 *   utilization/<slug>.mdx  adoption, from the CI-refreshed utilization.md
 *
 * Usage:
 *   node tools/emit-components.mjs [--titan <path>] [--check]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, "..");
const SNIPPETS = join(DOCS, "snippets", "generated");

const argv = process.argv.slice(2);
const CHECK = argv.includes("--check");
const ti = argv.indexOf("--titan");
const TITAN = ti !== -1 && argv[ti + 1] ? argv[ti + 1] : join(homedir(), "invoca", "Titan");

const CORE = join(TITAN, "components", "core");
const COMPONENTS = join(CORE, "src", "components");
const SRC = join(CORE, "src");

// A concept may span source roots — page-structure exports live under templates/,
// controls under components/. `dir` on a cover entry overrides the concept default.
const resolveDir = (c, x) => join(SRC, x.dir ?? c.sourceRoot ?? "components", x.subdir ?? c.sourceDir ?? "");
if (!existsSync(COMPONENTS)) {
  console.error(`Cannot find ${COMPONENTS}\nPass --titan <path to Titan checkout>.`);
  process.exit(2);
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const CONCEPTS = readJson(join(HERE, "component-concepts.json")).concepts;
const pkg = readJson(join(CORE, "package.json"));

const HEADER = `{/* GENERATED — do not hand-edit. Produced by tools/emit-components.mjs from Titan source. */}\n`;
const files = new Map();
const emit = (rel, body) =>
  files.set(rel, HEADER + body.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");

const table = (h, rows) =>
  [`| ${h.join(" | ")} |`, `|${h.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const code = (s) => "`" + s + "`";
const slugOf = (page) => page.split("/").pop();

// ---------------------------------------------------------------- analysis

/**
 * Does this export declare props of its own, or pass the framework's through?
 *
 * A props interface that extends the base type with an empty body means the accepted
 * surface is entirely inherited — the single most important fact a component page can
 * state, because the accepted surface is wider than the decided one.
 *
 * NOTE: reader-facing output never names the underlying library. Columns report what the
 * system DECIDES, not which upstream component a value maps to. A header naming the
 * substrate propagates to every page this emitter touches.
 */
// `[propName: string]: any` is an index signature: it means the component accepts any
// further prop, not that it declares one called `propName`. Matching bare `(\w+)\??:`
// captures the placeholder name and publishes a prop that does not exist.
const INDEX_SIGNATURE = /\[\s*\w+\s*:\s*string\s*\]\s*:/;
const stripIndexSignature = (body) => body.replace(new RegExp(INDEX_SIGNATURE.source + ".*", "g"), "");

function analyseProps(dirAbs, exportName) {
  const file = join(dirAbs, `${exportName}.tsx`);
  if (!existsSync(file)) return { kind: "no-source" };
  const src = readFileSync(file, "utf8");
  const iface = src.match(
    new RegExp(`export interface ${exportName}Props\\s+extends\\s+(\\w+)\\s*\\{([\\s\\S]*?)\\}`)
  );
  if (!iface) {
    // A plain `interface XProps { ... }` — no base type, so everything is declared.
    const plain = src.match(new RegExp(`interface ${exportName}Props\\s*\\{([\\s\\S]*?)\\n\\}`));
    const plainBody = plain ? plain[1] : null;
    const own = plainBody
      ? [...stripIndexSignature(plainBody).matchAll(/^\s*(\w+)\??:/gm)].map((m) => m[1])
      : [...src.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1]).filter((n) => !INDEX_SIGNATURE.test(n));
    const rest = plainBody ? INDEX_SIGNATURE.test(plainBody) : false;
    return { kind: own.length ? "declares" : "unknown", own: [...new Set(own)], rest };
  }
  const body = iface[2].trim();
  const own = [...stripIndexSignature(body).matchAll(/^\s*(\w+)\??:/gm)].map((m) => m[1]);
  return {
    kind: own.length ? "extends-and-declares" : "passthrough",
    extendsFrom: iface[1],
    own: [...new Set(own)],
    rest: INDEX_SIGNATURE.test(body),
  };
}

/** Which style overrides exist, and which size variants were themed. */
function analyseOverrides(dir) {
  const file = join(COMPONENTS, dir, `${dir}.overrides.ts`);
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  return {
    controlTypes: new Set([...src.matchAll(/^\s{2}Mui([A-Za-z]+):/gm)].map((m) => m[1])).size,
    sizes: [...new Set([...src.matchAll(/size(Small|Medium|Large)/g)].map((m) => m[1].toLowerCase()))],
    colors: [...new Set([...src.matchAll(/(?:contained|outlined|text|color)(Primary|Error|Success|Warning|Info|Secondary)/g)].map((m) => m[1].toLowerCase()))],
    // Variant keys appear bare (`contained:`) and colour-suffixed (`containedPrimary:`).
    // Capture the variant prefix from both, or a variant looks undecided when it is not.
    variants: [...new Set([...src.matchAll(/^\s{6}(contained|outlined|text)(?:[A-Z]\w+)?:/gm)].map((m) => m[1]))],
  };
}

/** The variants Storybook actually publishes — the shipped matrix, not the accepted one. */
function analyseStories(dir, storyFile) {
  const file = join(COMPONENTS, dir, storyFile ?? `${dir}.stories.js`);
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  return [...src.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
}

/** Adoption, from the CI-refreshed utilization.md. */
function analyseUtilization(dir) {
  const file = join(COMPONENTS, dir, "utilization.md");
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const apps = [...src.matchAll(/^-\s+(\d+)\s+within\s+\*\*([^*]+)\*\*/gm)].map((m) => ({
    app: m[2],
    count: Number(m[1]),
  }));
  const files = (src.match(/^\s+-\s+\d+ in /gm) || []).length;
  return { apps, files, total: apps.reduce((n, a) => n + a.count, 0) };
}

// ---------------------------------------------------------------- emit

for (const [page, c] of Object.entries(CONCEPTS)) {
  const slug = slugOf(page);
  const ov = c.sourceDir ? analyseOverrides(c.sourceDir) : null;
  const stories = analyseStories(c.sourceDir, c.stories);
  const utilDirs = c.utilizationFrom ?? (c.sourceDir ? [c.sourceDir] : []);
  const parts = utilDirs.map(analyseUtilization).filter(Boolean);
  const util = parts.length
    ? parts.reduce((acc, u) => {
        for (const a of u.apps) {
          const hit = acc.apps.find((x) => x.app === a.app);
          if (hit) hit.count += a.count;
          else acc.apps.push({ ...a });
        }
        acc.files += u.files;
        acc.total += u.total;
        return acc;
      }, { apps: [], files: 0, total: 0 })
    : null;

  // ---- props -------------------------------------------------------------
  const rows = c.covers.map((x) => {
    const a = analyseProps(resolveDir(c, x), x.export);
    const declared =
      a.kind === "passthrough"
        ? "**None** — inherited in full"
        : a.kind === "no-source"
          ? "— re-exported, no local source"
          : a.own?.length
            ? a.own.map(code).join(" ") + (a.rest ? " · plus any other prop" : "")
            : "—";
    const impl = {
      passthrough: "Wrapper, adds nothing",
      "extends-and-declares": "Wrapper, extends the base",
      "re-export": "Re-exported directly",
      "no-source": "Re-exported directly",
      declares: "Titan implementation",
      unknown: "Titan implementation",
    }[x.implementation === "re-export" ? "re-export" : a.kind] ?? a.kind;
    return [code(x.export), impl, declared, x.decides ?? "—"];
  });

  const anyPassthrough = c.covers.some(
    (x) => analyseProps(resolveDir(c, x), x.export).kind === "passthrough" || x.implementation === "re-export"
  );

  emit(
    `props/${slug}.mdx`,
    `
This page covers ${c.covers.length} ${c.covers.length === 1 ? "export" : "exports"}. What each one declares, and what it inherits:

${table(["Export", "Implementation", "Props it declares", "What the system decides"], rows)}

${
  anyPassthrough
    ? `<Warning>
  **The accepted surface is wider than the decided one.** Where an export declares no props of
  its own, it accepts everything its base accepts — including options the system never decided
  and never gave a value. That something renders is not evidence the system offers it.

  Use the props the pages document. Do not reach for inherited API this documentation does
  not list.
</Warning>`
    : ""
}

${
  ov && (ov.sizes.length || ov.colors.length || ov.variants.length)
    ? `### What the system decides

${table(
  ["", "Decided", "Reader's takeaway"],
  [
    [
      "Sizes",
      ov.sizes.length ? ov.sizes.map(code).join(" · ") : "—",
      ov.sizes.includes("large")
        ? "All accepted sizes are decided."
        : `Only these carry a decision. A \`large\` renders at a size no token defines.`,
    ],
    [
      "Colour intents",
      ov.colors.length ? ov.colors.map(code).join(" · ") : "—",
      "Any other colour value renders with no decision behind it." +
        (ov.colors.includes("primary") && c.prominence
          ? " Note `primary` here is a *colour*, not the prominence level of the same name."
          : ""),
    ],
    [
      "Prominence",
      ov.variants.length
        ? ov.variants
            .map((v) => {
              // Lead with the design term; the code value is the implementation detail.
              const lvl = c.prominence?.levels?.find((l) => l.codeValue === v);
              return lvl ? `**${lvl.term}**` : code(v);
            })
            .join(" · ")
        : "—",
      c.prominence
        ? "Design terms. In code these are `" +
          c.prominence.levels.map((l) => l.codeValue).join("`, `") +
          "`."
        : "Weight treatments the system defines.",
    ],
  ].filter((r) => r[1] !== "—")
)}

<Warning>
  **Decided is narrower than accepted.** The table above is the surface that carries values and
  rules. Everything else the props accept still renders — with no token behind it, and no
  decision recorded.
</Warning>`
    : ""
}
`
  );

  // ---- matrix ------------------------------------------------------------
  emit(
    `matrix/${slug}.mdx`,
    stories
      ? `
The variants Storybook publishes for this concept — what is demonstrated, not what the API
accepts.

${table(
  ["Story", "Shows"],
  stories.map((s) => [
    code(s),
    s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/ Story$/, ""),
  ])
)}

${stories.length} ${stories.length === 1 ? "story" : "stories"}. A variant with no story is a variant nobody has demonstrated —
which is not the same as one that does not work, but is where undocumented behaviour lives.
`
      : `
<Note>
  **No stories found** for this concept in Titan source. Nothing is published to demonstrate
  its variants.
</Note>
`
  );

  // ---- status ------------------------------------------------------------
  emit(
    `status/${slug}.mdx`,
    `
${table(
  ["", ""],
  [
    ["Package", code(pkg.name)],
    ["Version", code(pkg.version)],
    ["Exports covered", c.covers.map((x) => code(x.export)).join(" · ")],
  ]
)}

<Note>
  **No lifecycle metadata exists.** There is no \`status\`, \`since\`, \`deprecated\`, or
  \`replacedBy\` field on a Titan token or component, so this table cannot report when an export
  arrived or whether it is on the way out.
</Note>
`
  );

  // ---- utilization -------------------------------------------------------
  emit(
    `utilization/${slug}.mdx`,
    util && util.apps.length
      ? `
Adoption across Invoca applications, refreshed by CI.

${table(
  ["Application", "Usages"],
  util.apps.sort((a, b) => b.count - a.count).map((a) => [code(a.app), String(a.count)])
)}

**${util.total} usages across ${util.apps.length} application${util.apps.length === 1 ? "" : "s"}**, in ${util.files} files.

<Note>
  Adoption is a fact about the codebase, not a recommendation. A high count does not make a
  component correct for a new case, and a low one does not make it wrong — see
  **Choose something else when** above.
</Note>
`
      : `
<Note>
  **No adoption data** is published for this concept.
</Note>
`
  );
}

// ---------------------------------------------------------------- write

let changed = 0;
for (const [rel, body] of files) {
  const path = join(SNIPPETS, rel);
  mkdirSync(dirname(path), { recursive: true });
  const prev = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (prev === body) continue;
  changed++;
  if (CHECK) console.error(`drift: ${rel}`);
  else {
    writeFileSync(path, body, "utf8");
    console.log(`wrote ${rel}`);
  }
}

console.log(
  `\n${Object.keys(CONCEPTS).length} concept(s) · ${files.size} snippets · ${changed} changed`
);

if (CHECK && changed) {
  console.error(`\n${changed} file(s) differ from disk. Re-run without --check.`);
  process.exit(1);
}
