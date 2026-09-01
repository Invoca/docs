---
name: titan-design-system
description: Invoca's Titan design system. Use when building, reviewing, or specifying any Invoca product UI — choosing components, applying design tokens, composing patterns, or laying out a page. Covers foundations (color, type, space, elevation), components, patterns, and full-page views, plus the numbered constraints that govern them.
---

# Titan Design System

Titan is Invoca's design system. This file is the entry point for agents. This site is
public (docs.invoca.com), so Mintlify would generate a `skill.md` automatically — this one
is **hand-authored** instead, because it carries the tier model, constraint-ID convention,
and direction-of-truth rules that generation can't infer. Update it when those change.

## The one rule that overrides the others

**Never emit a hardcoded visual value.** Every color, size, space, radius, and shadow
references a token. If no token expresses what you need, that is a token gap — say so and
propose one. Do not resolve it with a literal, and do not resolve it by reaching past a
semantic token to a primitive.

## Name the decision, never the library

Titan is built on an underlying component library. **That library is not the subject and is
never named** — not in prose, not in a rationale, not in a table header, not in anything you
generate. The reader is choosing what to build; the library is not a choice available to them.

The reader's real question is *"is this the system's decision, or did it just come with the
box?"* — and that is answerable without naming the box. **Replace provenance with
decidedness:**

| Do not write | Write |
|---|---|
| "a thin wrapper over the library's Button" | "the system decides sizes, colours, and states for it" |
| "the library's `large` is un-themed" | "two sizes are decided; a `large` renders at a size no token defines" |
| "this value is a framework literal" | "this value renders with no token behind it" |
| "adopted from the framework unchanged" | "no design decision is recorded for these values" |

When a page looks thin after this, that thinness **is** the finding: the system decided little
there. Say it as coverage — see `TITAN-GAP-21`.

## Resolve top-down

Titan documentation has four tiers. Work down them in order. The page-level decision
constrains everything below it, so starting at the component is starting in the middle.

| Order | Tier | What it decides | Path |
|---|---|---|---|
| 1 | **Views** | Page archetype, regions | `/invoca-design-system/views/*` |
| 2 | **Patterns** | Named compositions filling those regions | `/invoca-design-system/patterns/*` |
| 3 | **Components** | Individual units | `/invoca-design-system/components/*` |
| 4 | **Foundations** | Tokens applied to all of the above | `/invoca-design-system/foundations/*` |

Boundaries, as tests:

- **Component** — a unit a reader recognises as one thing. A page may cover several exports; its **Exports** table maps concept to import. Grouping is by recognition, not by module boundary — see `/invoca-design-system/foundations/divergences#titan-div-10`.
- **Pattern** — a named composition of 2+ components, with rules, but no export.
- **View** — defines full-page regions and what fills each.

If asked to build a screen, name the View first. If no View fits, say so rather than
improvising one — an unlisted page archetype is a gap worth reporting.

## Three content layers on every page

| Layer | Treat as | Notes |
|---|---|---|
| **Reference** — props, token values, variants | Authoritative fact | Generated from Titan source each build. If it is wrong, the source is wrong. |
| **Decision** — "Choose this when", "Choose something else when", constraints | Normative | Follow it. A departure needs a stated reason. |
| **Rationale** — "Why it works this way" | Context | Read before proposing a change to a constraint. |

## Constraints are numbered and citable

Normative rules carry permanent IDs: `TITAN-BTN-01`, `TITAN-COLOR-03`,
`TITAN-DESTROY-06`. They live in a **Constraints** table on each page.

**Cite the ID when a constraint drives your output.** "Cancel is first and styled `text`
per TITAN-BTN-02" is reviewable against the system. "This looks better" is not. If you
must violate a constraint, name it and say why — silent violation is the failure mode
this convention exists to prevent.

IDs are permanent. A missing number means a deprecated rule, not an error.

## Global constraints worth knowing before you read a page

These recur across the system and are the ones most often gotten wrong.

- **TITAN-BTN-01** — At most one `contained` Button per view region.
- **TITAN-BTN-02** — The destructive action is never the `contained` Button. Weight follows intended outcome, not severity.
- **TITAN-BTN-08** — Never use a Button for navigation that has a URL. Use Link.
- **TITAN-COLOR-01** — Component code references semantic or component tokens only. Never a primitive, never a literal.
- **TITAN-COLOR-03** — Color never carries meaning alone. Pair with an icon, a label, or both.
- **TITAN-COLOR-07** — Status text and icons use the `-alt` variant. The plain tokens measure 2.41–2.74:1.
- **TITAN-DESTROY-01** — Confirm only when the action is not user-reversible. Otherwise perform it and offer Undo.
- **TITAN-FND-06** — Reach tokens through `theme.vars.tokens[…]`, never `theme.tokens[…]`.
- **TITAN-A11Y-04** — Focus is always visible and never removed. No semantic focus token exists yet; see TITAN-DIV-02.

## Tokens

Three tiers. Semantics alias primitives; nothing is baked at author time.

```
Primitive   color.blue.50                    = #2666f9
Semantic    tokens.background-primary-hover  = {color.blue.0}
Component   chip-info-tint                   = {color.blue.20}
```

**Intent: a component token aliases a semantic token, not a primitive.** When writing a new
component token, alias the semantic tier and state a reason if you do not.

**Reality: no shipped Tier-3 token does this.** All 26 that carry a reference point at a
primitive. This is deliberate and reasoned in source, not an oversight — see
`/invoca-design-system/foundations/divergences#titan-div-01`. Do not "fix" existing ones.

`theme.tokens` exposes 244 tokens plus 94 machine-generated `…Channel` RGB companions.
Never reference a `…Channel` value directly.

**Reach tokens via `theme.vars.tokens[…]`, not `theme.tokens[…]`.** Only the former emits a
live `var()`; the latter is lint-rejected inside `components/core`.

**Modes are out of scope.** Titan ships a dark color scheme and a compact density. Neither
carries a design decision, and the documentation defines neither — every documented value is
the light scheme at comfortable density. Do not infer intent for another mode, and do not
treat a mode value found in code as a design decision. See
`/invoca-design-system/foundations/open-decisions#titan-gap-01`.

## What renders is not always what the system decided

Two traps that produce wrong output if ignored:

1. **More options render than the system defines.** Most components are thin wrappers that
   declare no props of their own, so they accept everything their base accepts.
   Titan themes two control sizes; `large` still renders, at a size no token defines.
   **Do not use API surface the documentation does not list.** That something accepts a
   value is not evidence the system offers it — and nothing enforces this but the page you
   are reading (`TITAN-GAP-21`).

2. **Declared values are not effective values.** Button declares `padding: 8px 12px`, but a
   fixed `control-height-md` makes the vertical padding largely inert. Where a page
   documents effective geometry, use that number — not the declaration.

## Direction of truth

This documentation carries three registers. Do not conflate them.

| Register | Source | Authority |
|---|---|---|
| **Code fact** | Generated from Titan's DTCG source each build | What ships. If it is wrong, the source is wrong. |
| **Design intent** | Authored here | What to build. Evolves by decision. |
| **Divergence** | `/invoca-design-system/foundations/divergences` | Where the two disagree, and which to follow today. |

**Code is authoritative for what ships. This documentation is authoritative for what to
build.** Those are different questions, and the answer is not always the same.

When intent and code disagree:

1. Check `/invoca-design-system/foundations/divergences` for a `TITAN-DIV-<NN>` entry.
2. Follow its **Follow today** row.
3. Cite the ID.
4. If the disagreement is not recorded there, say so — do not silently pick a side.

**Figma is an emission target for values, and the record of composition intent.** Those are
two different claims and they resolve in opposite directions.

- **Values** — colour, spacing, type, radius, elevation, component props. A value that exists
  only in Figma is not part of the system. When code and Figma disagree, code is right and
  Figma has drifted. Report it; do not average the two.
- **Composition** — how regions nest, what a template is made of, which slots a page has, how
  the parts assemble into a page. Code carries no statement of this beyond what its components
  happen to allow, so here Figma is not drifting from code; it is saying something code does
  not say. Where the frame cannot express the composition the design library shows, that is a
  divergence with code as the side that has to move — see `TITAN-DIV-16`.

The test for which kind you are looking at: if code and Figma each give an answer, it is a
value question and code wins. If Figma gives an answer and code is **silent**, it is a
composition question and Figma is the design intent.

## Formatting data

Numbers, currency, dates, and times have explicit rules — see `/invoca-design-system/content/numbers` and
`/invoca-design-system/content/dates-and-times`. Selected rules:

- Dates are `M/D/YYYY`, no leading zeros. Times are lowercase `am`/`pm`, no leading zero, no space.
- Never render a trailing `.0`. One decimal place on abbreviated numbers and percentages; two on currency.
- Abbreviation suffixes are uppercase: `K`, `M`.
- Counts of indivisible objects are whole numbers.

Both pages carry a **Gaps in the current rules** section listing what is genuinely
undecided — timezone display, billions, negative numbers, zero and null states. **Do not
invent an answer for anything listed there.** Say it is unspecified and ask.

## When the documentation does not answer the question

**Check `/invoca-design-system/foundations/open-decisions` first** — 31 things are recorded there as explicitly
undecided, each with a `TITAN-GAP-<NN>`, plus a separate **Known defects** table for bugs that
are not decisions at all. If the question is one of them, cite the ID and say it is
unspecified.

Most relevant: **156 of 244 tokens record nothing about what they are for**
(`TITAN-GAP-02`). Where a page maps intent to a token without source backing, it says the
mapping is a proposal. Treat those as proposals.

Say so. A stub page carries a visible `Stub` warning and means the decision has not been
made — it does not mean you should make it. Inventing a rule and presenting it in the
system's voice is worse than an admitted gap, because the next reader cannot tell the
difference.

## Where things are

| Looking for | Path |
|---|---|
| Page archetypes | `/invoca-design-system/views/*` |
| Compositions | `/invoca-design-system/patterns/*` |
| Components, grouped by job | `/invoca-design-system/components/{actions,forms,data-display,navigation,feedback,containment}/*` |
| Tokens | `/invoca-design-system/foundations/*` |
| Where intent and code disagree | `/invoca-design-system/foundations/divergences` |
| What has not been decided | `/invoca-design-system/foundations/open-decisions` |
| Number, date, and copy rules | `/invoca-design-system/content/*` |
| Governance, token workflow, drift | `/invoca-design-system/contribute/*` |
| Live component demos | Storybook, embedded via Chromatic |
