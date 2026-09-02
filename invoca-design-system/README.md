# Titan design system documentation

First-pass scaffold for the Titan documentation site on Mintlify.

> **2026-09-01 migration note:** Now living at `invoca-design-system/` in the main Invoca
> docs repo (public `docs.invoca.com`), not a standalone site — see PLAN.md's note at the
> top. References below to `docs/` mean this directory, and the "internal" framing in
> §"Agent entry points" and open question 2 no longer holds — see `skill.md`/`AGENTS.md`
> for the current state.

- **[PLAN.md](./PLAN.md)** — the strategy. Read this first.
- **`docs/`** — the Mintlify site.

## Layout

```
docs/
  docs.json                  Site config. Full IA — 84 pages.
  index.mdx                  Landing page.
  .mintignore                Excludes _templates/ from build and indexing.
  _templates/                Page templates: component, foundation, pattern, view.
  foundations/               Tokens.
  components/                By job: actions, forms, data-display, navigation,
                             feedback, containment.
  patterns/                  Named compositions.
  views/                     Full-page archetypes.
  content/                   UX writing.
  contribute/                Governance, token workflow, drift.
  snippets/
    StorybookFrame.jsx       Live component embeds via iframed Storybook.
    generated/               CI-emitted reference content. Never hand-edit.
```

## Written so far

Five pages plus the landing page. Three are exemplars pressure-testing the content model;
two are transcribed from real source.

| Page | Type | Source | Proves |
|---|---|---|---|
| `components/actions/button.mdx` | Component | Proposed | Decision grammar, constraint IDs, declared-vs-effective geometry |
| `foundations/color.mdx` | Foundation | Proposed | Intent-to-token mapping, mode behavior |
| `patterns/destructive-confirmation.mdx` | Pattern | Proposed | Decision tree, friction tiers, anti-patterns |
| `content/numbers.mdx` | Content | **zeroheight** `verified` | Real rules, with four internal contradictions flagged |
| `content/dates-and-times.mdx` | Content | **zeroheight** `verified` | Real rules, with the timestamp table's ambiguity flagged |

The other 80 pages are stubs carrying a visible `<Warning>`. The warning stays until the
Decision layer is written. A stub that looks finished is worse than one that admits it —
neither a reader nor an agent can distinguish a considered omission from an unwritten page.

## Agent entry points

The site is **public** (see the migration note above) — Mintlify's automatic `skill.md`
generation applies to public sites, but both files below stay hand-maintained anyway, since
they carry more than the tier model alone (constraint IDs, direction-of-truth, authoring
rules):

| File | Purpose |
|---|---|
| `docs/skill.md` | The agent entry point. Tier model, resolution order, constraint IDs, global rules, direction of truth. |
| `docs/AGENTS.md` | Behavior specific to working with these docs — citation, markers, platform limits, authoring rules. |

Update both whenever the tier model, marker conventions, or global constraints change.

Everything else agent-facing is automatic: `/llms.txt`, `/llms-full.txt`, markdown export,
`markdown.instructions`, and the MCP server (use the authed variant at `/authed/mcp`).

## Local development

```bash
npm i -g mint          # requires Node 20.17+; the package is `mint`, not `mintlify`
cd docs
mint dev               # http://localhost:3000
mint validate          # schema check — run in CI, exits nonzero on any warning
mint broken-links --check-anchors
mint a11y              # contrast + alt text
```

## Verification status

A local validator (structure, nav resolution, link integrity, Mintlify component
validity, JSX snippet constraints) passes clean on all 84 nav pages. `mint validate`
has **not** been run — the sandbox has no npm registry access. Run it before first deploy.

## Before this can ship

1. **Storybook story index** — resolved. The internal `internal-docs.invocadev.com/Titan/core/index.json` remains unreachable from this environment, but `StorybookFrame` actually embeds the public Chromatic deployment, and that deployment's own `/index.json` (311 entries) is reachable and authoritative. Verify any new story ID against it before shipping — see `snippets/StorybookFrame.jsx`'s header.
2. **Titan checkout** — resolved for local work. A checkout exists at `~/invoca/Titan` (verify per environment). `tools/emit-components.mjs` and `tools/emit-tokens.mjs` both run against it for real. Reference tables are placeholders only for concepts with no `component-concepts.json` entry yet, not because the checkout is unreachable.
3. **Figma and GitHub URLs** — `REPLACE_ME` in `docs.json`.
4. **Brand color** — `colors.primary` is a placeholder; replace from the Invoca brand palette.
5. **Storybook toolbar globals** — the parameter names for color scheme and density are unknown, so `StorybookFrame` omits them. Storybook ignores unrecognized globals silently, which would make every mode-specific embed render the default while appearing correct.
6. **Review the decision content.** The constraints in the three exemplar pages are proposals, not policy. They carry real opinions and need sign-off before anyone cites them. `TITAN-NUM-06` in particular resolves a genuine contradiction in the legacy rules and is currently my inference.
