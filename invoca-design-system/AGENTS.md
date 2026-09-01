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
| `pending` | Placeholder awaiting the Titan checkout or the CI emitter |
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

## Writing new documentation

Use the templates in `_templates/`: `component.mdx`, `foundation.mdx`, `pattern.mdx`,
`view.mdx`. Section order is fixed — it makes an omission visible, which is the point.

When authoring Decision content:

- **"Choose something else when" must name a specific alternative and link to it.** "Don't use this for the wrong thing" is not an entry.
- **Constraints must be falsifiable.** Someone looks at a screen and says yes or no. "Use buttons consistently" is not a constraint.
- **One rule per ID. Rationale required.** A constraint without a reason gets deleted by the next person who has a reason.
- **Do/Don't captions state the rule, not the image.** "Two buttons side by side" describes what is already visible. "Give the destructive action the recessive treatment" transfers.

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
