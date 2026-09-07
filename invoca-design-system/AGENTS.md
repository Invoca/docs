# Agent guidance — Titan documentation

Read `skill.md` first. It carries the tier model, the constraint conventions, and the
global rules. This file covers behavior specific to working *with these docs*.

## Answering from this documentation

**Cite constraint IDs.** When a rule drives an answer, name it: "Cancel comes first and is
styled `text` per TITAN-BTN-02." A cited answer is checkable against the system. An
uncited one is checkable only against taste.

**Distinguish the three layers when you answer.** Reference content is fact. Decision
content is policy. Rationale is context. Conflating them makes a policy sound like a
physical constraint, or a constraint sound like a suggestion.

**Where intent and code disagree, say which you are following.** Divergences are recorded in
[`foundations/divergences`](/invoca-design-system/foundations/divergences) as `TITAN-DIV-<NN>`, each naming what
ships, what design intends, and which to follow today. Build to intent, cite the ID, and
never silently follow the code because it is what exists. If a disagreement is not recorded
there, report it rather than resolving it.

**Never name the underlying library.** Titan is built on one; it is not the subject. Not in
prose, not in a rationale, not in a table header, not in anything you generate. Answer the
reader's real question — *is this the system's decision, or did it just come with the box?* —
by stating what **is decided**, not where it came from. See `skill.md` for the substitutions.

**Modes are out of scope.** Every documented value is the light color scheme at comfortable
density. Titan ships a dark scheme and a compact density; neither is designed, and this
documentation does not define them (`TITAN-GAP-01`). A mode value found in code is not a
design decision.

**Do not fill gaps.** Several pages carry a **Gaps in the current rules** section listing
what is genuinely undecided. Those are open questions, not omissions to be helpfully
resolved. Answer "Titan does not specify this" and point at the gap. A confident invented
answer in the system's voice is the most expensive failure available here, because it
propagates and nobody can trace where it came from.

**Stubs mean unwritten, not unconstrained.** A page carrying a `Stub` warning has not been
authored. Do not infer its rules from neighboring pages.

## Markers you will encounter

| Marker | Means |
|---|---|
| `verified` | Traced to Titan source or the prior IDS documentation |
| `pending` | Placeholder awaiting a `component-concepts.json` entry and an emitter run — not a checkout problem: a working Titan checkout exists locally (`~/invoca/Titan`), so this now means the concept map or emitter hasn't caught up, not that source is unreachable |
| **Proposed** | Written as policy but not yet signed off. Say so when citing. |
| `REPLACE_ME` | Unset configuration. Not a real value. |
| `TITAN-GAP-<NN>` | An explicitly undecided question, listed at [open decisions](/invoca-design-system/foundations/open-decisions). Cite it; never resolve it. |
| `TITAN-DIV-<NN>` | Code and design intent disagree, recorded at [divergences](/invoca-design-system/foundations/divergences). |

## Generated content

Anything under `snippets/generated/` is emitted from Titan source. Never suggest hand-editing
it — a hand-edit does not fix anything, it creates a value that disagrees with the package and
survives until someone notices. Fix the source and re-emit:

```bash
node tools/emit-tokens.mjs --titan /path/to/Titan      # tokens, contrast, coverage
node tools/emit-components.mjs --titan /path/to/Titan  # exports, variants, status, adoption
```

`--check` re-emits to memory and exits non-zero if any file on disk differs. That is the
drift gate; run it before proposing a change to any generated table.

**Never hand-author a "Pending generation" placeholder.** If a concept has no
`component-concepts.json` entry yet, either add one and run the real emitter against an actual
checkout, or state the gap in authored prose (never inside a hand-typed imitation of the
emitter's own output). A hand-written placeholder that merely *looks* generated is exactly the
kind of thing this rule exists to prevent, and it will read as real content to the next person
— several component pages shipped exactly this mistake before it was caught and removed.

**Before adding a new component concept, check whether a Titan checkout is actually available**
(commonly `~/invoca/Titan` — verify per-environment, since this is a local path, not a
guaranteed one) before assuming source is unreachable. If it is, add the concept to
`tools/component-concepts.json` and run the emitter for real; do not simulate its output by
hand on the assumption that no checkout exists.

**A story ID is not real until it's checked against the live deployment, not just the internal
checkout.** The internal Titan checkout's local Storybook `title` field, and a component's own
`utilization.md` self-link, can both name a slug that the public Chromatic deployment does not
actually use — pluralization and hyphenation differ in practice. Before shipping a
`<StorybookFrame story="...">` value, fetch
`https://main--64e4dc66838839c721332d22.chromatic.com/index.json` and confirm the id is
present, or load the iframe URL directly and confirm it doesn't return "Couldn't find story
matching". See `snippets/StorybookFrame.jsx`'s header for the exact method.

## Writing new documentation

Use the templates in `_templates/`: `component.mdx`, `foundation.mdx`, `pattern.mdx`,
`view.mdx`. Section order is fixed — it makes an omission visible, which is the point.

When authoring Decision content:

- **"Choose something else when" must name a specific alternative and link to it.** "Don't use this for the wrong thing" is not an entry.
- **Constraints must be falsifiable.** Someone looks at a screen and says yes or no. "Use buttons consistently" is not a constraint.
- **One rule per ID. Rationale required.** A constraint without a reason gets deleted by the next person who has a reason.
- **Do/Don't captions state the rule, not the image.** "Two buttons side by side" describes what is already visible. "Give the destructive action the recessive treatment" transfers.

## Figma access

A live connection to the real Figma file exists via the official Figma Dev Mode MCP server —
tool names are namespaced with a connection-specific ID that can change between sessions, so
search for them (e.g. a tool search for "figma design context screenshot") rather than
hard-coding one. The file is `jh6AQcOATYpxshCcRVOQ6U` ("IDS – Core Components"); a confirmed
real page within it is `node-id=22525-6240` ("Form Elements - Form Input - Text Field"). Check
tool availability at the start of a session rather than assuming it based on a past one.

**Do not use Code Connect for anything.** It has been confirmed inaccurate. That means: do not
call a `get_context_for_code_connect`-style tool, do not read `*.figma.tsx` Code Connect files
in the Titan checkout as evidence of the design library's structure, and do not treat a
component's Code Connect mapping as confirmation of anything about the Figma side. Get
evidence directly instead — `get_screenshot` and `get_design_context` against a real node ID,
never inferred from a Code Connect file.

**Page discovery is unreliable; direct node access is not.** Calling the metadata tool with no
node ID to enumerate the file's pages returned only one page ("STYLES & TOKENS") even though
the file demonstrably has many more — the component page above resolved immediately by its own
node ID despite not appearing in that listing. **If a broad discovery call comes back thin,
that means try a specific node ID next, not that the content isn't there.** Node IDs come from
a Figma URL (the user's, or one found in this session) — `?node-id=22525-6240` in a URL is
`22525:6240` as a tool argument. When you have one from a prior successful call or a URL,
reuse it directly rather than re-discovering it through the unreliable broad listing.

**What Figma evidence is for, restated from `skill.md`'s direction-of-truth section:** Figma
is authoritative for *composition intent* where code is silent (layout, regions, slots), never
for *values* where code gives an answer — code always wins a values disagreement. A screenshot
or a live `get_design_context` call against a real node is verified evidence; a recollection of
file layout, or anything sourced from Code Connect, is not. See PLAN.md §5a's adjudication
table for how to weigh what you find against what code says before promoting it into a
Constraint.

## Platform constraints

This site runs on Mintlify. Relevant limits when suggesting changes:

- **No npm imports in MDX.** Titan components cannot render natively; live demos are iframed Storybook.
- **No JSON imports.** Token data must be emitted as MDX by CI, not read at runtime.
- **Callouts are `Note`, `Warning`, `Info`, `Tip`, `Check`, `Danger`.** No `Caution`, `Success`, or `Error`.
- **`CardGroup` is deprecated.** Use `<Columns>`.
- **No custom icon library is set for this section.** The site-wide `docs.json` doesn't declare `icons.library` (that setting is global, shared with the Support/Developer Portal, and changing it isn't in scope here) — new `icon` props must resolve against Mintlify's default library, matching the names already used elsewhere in `docs.json` (e.g. `house`, `book-open`, `palette`).
- **Tailwind v3, no arbitrary values.** `w-[347px]` will not work.
- **JSX snippets:** named exports only, arrow functions, no imports of any kind.

Run `mint validate` before proposing a `docs.json` change — the "one child type per
navigation level" rule is easy to violate in a nested IA.

## This site is public

Hosted at docs.invoca.com, alongside Invoca's Support and Developer Portal content.
Storybook embeds point at the public Chromatic deployment
(`main--64e4dc66838839c721332d22.chromatic.com`), so they render for any reader. Do not
reintroduce a dependency on an internal-only host.
