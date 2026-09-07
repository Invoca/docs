# Titan Design System Documentation — Plan

**Status:** First pass, v0.1
**Platform:** Mintlify (decided)
**Date:** 2026-08-11

> **2026-09-01 migration note:** This content was moved from a standalone authoring
> checkout into `invoca-design-system/` in the main Invoca docs repo, which serves the
> public `docs.invoca.com`. Everything below assuming an **internal** audience (§8's
> capability table, the `internal-docs.invocadev.com` Storybook origin, the "Audience —
> internal" line in §11) is superseded: the site is public, Storybook embeds now go
> through the already-live Chromatic deployment, and `skill.md`/`AGENTS.md` have been
> updated accordingly. Left as-is here for provenance. The six previously-published,
> code-grounded component pages (`alert`, `button`, `chip`, `modal`, `tooltip`,
> `typography`) were moved to `temp/` pending manual reconciliation with this IA, rather
> than being overwritten by it.

---

## 1. The problem this solves

Most design system documentation is *implementation-complete* and *decision-incomplete*. It tells you what props a Button accepts. It does not tell you, unambiguously, whether this screen should use a Button at all.

That gap is tolerable when the reader is a designer who absorbed the system's judgment through osmosis and code review. It is not tolerable when the reader is an AI agent generating a screen, because an agent has no osmosis. It has only what is written down.

So the organizing goal is: **every choice a builder must make should be answerable from the documentation alone, without asking a human.**

This does not mean writing for machines. It means writing the things good designers already know but rarely write down — and writing them as rules rather than as vibes. Humans benefit at least as much; the rules are what a new hire is missing too.

---

## 2. The three-layer content model

Every page is composed of three layers with different authorship, different lifecycles, and different failure modes. Keeping them separate is the single most important structural decision here.

| Layer | What it is | Authored by | Regenerated | Fails by |
|---|---|---|---|---|
| **Reference** | Props, token values, variants, sizes, states. Facts derived from Titan source. | CI, from DTCG JSON + component source | Every build | Drifting silently from code |
| **Decision** | When to use, when not to, what to use instead, testable constraints, composition rules. | Human, in a constrained grammar | Never — reviewed on change | Being vague enough to be unfalsifiable |
| **Rationale** | Why the decision is what it is. History, tradeoffs, what was ruled out. | Human, free prose | Never | Being absent |

**Reference is never hand-written.** It is emitted into `snippets/generated/` by a build step and imported. If a token table is wrong, you fix the source and re-emit. This mirrors the Titan stance that code is the source of truth and every other surface is an emission target — the docs site becomes a third emission target alongside CSS and Figma.

**Decision is never generated.** No model can infer that Invoca has decided there is at most one contained button per view region. That is a judgment, and it has to be made by a person and written down once.

**Rationale is the part that makes the other two survive.** A rule without a reason gets deleted by the next person who finds it inconvenient.

---

## 3. The four-tier composition model

The IA mirrors the token tiering the system already uses. Tokens go `primitive → semantic → component`; the documentation goes:

```
Foundations  →  Components  →  Patterns  →  Views
  (tokens)      (units)        (compositions)  (page archetypes)
```

Boundaries stated as tests, so the placement of a new page is never a debate:

| Tier | Test | Example |
|---|---|---|
| **Foundation** | Is it a token, or a rule about how tokens are applied? | Color, type scale, spacing & density, elevation, motion, iconography |
| **Component** | Does it ship as an export from the Titan package with a props API? | Button, Select, DataTable, Dialog |
| **Pattern** | Is it a named composition of 2+ components with rules, but no export? | Destructive confirmation, form validation, empty state, filtering |
| **View** | Does it define full-page region layout and what fills each region? | List view, detail view, settings, wizard, dashboard |

If it ships in the package it is a Component. If it is a recurring composition with rules but no export it is a Pattern. If it defines page-level regions it is a View. Nothing lives in two tiers.

**Views are the tier almost every design system omits**, and they are the tier an agent most needs. An agent asked to "build the campaign settings page" is making a View-level decision first and a Component-level decision last. Documenting only components means the agent improvises the most consequential layer.

---

## 4. The decision grammar

Decision-layer content follows a fixed grammar so it is scannable by humans and parseable by agents. Three constructs.

### 4.1 Choose this when / choose otherwise

Every Component, Pattern, and View page carries both. The negative half is mandatory and must name a specific alternative with a link — "don't use this for the wrong thing" is not an entry.

```
Choose Button when
- The action changes application state or navigates as the result of a submission.
- The action is the primary intent of its region.

Choose something else when
| If you need to… | Use | Why |
| Navigate to another page or resource | Link | Preserves right-click, middle-click, and copy-URL affordances |
| Trigger a non-primary action inline in a row | IconButton | Keeps row height at the density token |
```

### 4.2 Constraints with IDs

Normative rules are numbered, testable, and citable. An ID makes a rule referenceable in review ("this violates TITAN-BTN-02"), lintable later, and quotable by an agent explaining its own output.

```
| ID | Constraint | Rationale |
| TITAN-BTN-01 | At most one `contained` Button per view region. | Two competing primaries means the primary action was never decided. |
| TITAN-BTN-02 | Button labels are verb-first and ≤ 3 words. | Labels longer than 3 words are describing a task, not an action. |
```

Rules for writing constraints:

- **Falsifiable.** Someone must be able to look at a screen and say yes or no. "Use buttons consistently" is not a constraint.
- **One rule per ID.** Compound rules cannot be checked.
- **Rationale is required.** A constraint without a reason will be violated by someone who has a reason.
- **IDs are permanent.** Deprecate, never renumber.

### 4.3 Do / Don't with rule-stating captions

The convention that most systems get wrong: the caption describes the image instead of stating the rule. The image is the evidence; the caption is the claim.

- ❌ "Two buttons side by side" — describes what you can already see
- ✅ "Give the destructive action the recessive treatment. Weight follows intended outcome, not severity." — states the transferable rule

---

## 5. Page anatomy

Fixed section order per page type. Fixed order matters more than perfect order: it lets a reader — human or agent — jump to the section they need without scanning, and it makes an omission visible.

### Component page

1. **Frontmatter** — title, description, status, `since`, Storybook and Figma links
2. **What it is** — 1–2 sentences. No hedging.
3. **Live example** — iframed Storybook (see §6)
4. **Choose this when / Choose something else when** *(decision)*
5. **Anatomy** — labeled parts, named as the code names them
6. **Variants, sizes, states** *(reference, generated)* — with a note on which combinations are un-themed. Titan overrides `sizeSmall`/`sizeMedium` only, so MUI's `large` exists in the framework and not in the system. The docs must say so; an agent will otherwise assume the framework's surface is the system's surface.
7. **Constraints** *(decision)* — the numbered table
8. **Composition** — which components this appears with, and in what order
9. **Content** — labels, capitalization, length, voice
10. **Accessibility** — keyboard map, ARIA, focus, contrast, screen-reader behavior. Stated as behavior, not as a checklist.
11. **Props** *(reference, generated)*
12. **Tokens** *(reference, generated)* — with declared-vs-effective noted where they diverge
13. **Rationale** — why it is this way *(narrative)*
14. **Changelog**

### Foundation page

1. What it is · 2. The model (primitive → semantic → component) · 3. **Choosing a semantic token** *(decision — the most valuable section)* · 4. Token reference *(generated)* · 5. Modes (light/dark, comfortable/compact) · 6. Constraints · 7. Accessibility · 8. Rationale

Point 3 deserves emphasis. Publishing a swatch grid of every color is table stakes and near-useless: it tells a reader what exists, not what to reach for. The useful artifact is a mapping from *intent* to *token* — "a surface that sits above the page background" → `tokens.background-raised`. Written that way it serves an agent directly and a designer better than a grid does.

### Pattern page

1. The problem · 2. The solution — annotated composition · 3. When this applies / when it doesn't · 4. Structure — components in order, with the tokens between them · 5. Behavior — states, transitions, error and edge cases · 6. Constraints · 7. Content · 8. Accessibility · 9. Variations · 10. Anti-patterns — what people do instead and why it fails

### View page

1. Purpose · 2. Regions — the layout skeleton · 3. What fills each region — patterns and components per region · 4. Responsive and density behavior · 5. Constraints · 6. Composed example · 7. Related views

---

## 5a. What code-as-source-of-truth actually changes

Code is the source of truth; Figma is an emission target. That is settled. What is worth
being explicit about is what it changes in the *documentation*, because most of it is not
obvious and some of it cuts against design-system convention.

### It collapses the design/code split

The default structure in this category — Carbon, Polaris, Spectrum — gives a component a
**Design** tab and a **Code** tab, sometimes maintained by different people. That
structure presupposes two authorities and then works to keep them agreeing.

Under a single source of truth there is one spec, and the designer and the engineer read
the same page. **No design/code tabs. No "for designers" version of a component page.**
Expect this to be requested anyway, because it is what people are used to; the answer is
that a second surface is a second thing to drift.

The `/invoca-design-system/get-started/for-designers` and `/invoca-design-system/get-started/for-engineers` pages are the exception,
and they are about *workflow* — how you work with the system — not about what the
components are.

### It gives drift a direction

Drift is not "the design and the code disagree." It is **"Figma has drifted from code."**
The resolution is always to re-emit, never to change the token to match the Figma file.

That has to be stated plainly in the docs, because the instinct when two things disagree
is to look at both and pick the better-looking one. See `/invoca-design-system/contribute/reporting-drift`.

### It makes every static image a liability

This is the consequence with the most teeth, and it applies to artifacts design systems
publish by default: anatomy diagrams, redline specs, Do/Don't visuals, variant grids.

Each is a Figma-authored picture of a code fact. None of them break when the code changes
— they just quietly become wrong, and they carry the system's authority while doing it.

Two rules follow:

**1. Anatomy diagrams may label parts. They may not carry measurements.**
Part names are stable — a Button has a label and an optional leading icon for years at a
time. Measurements change every release. Put the parts in the diagram and every number in
the generated token table, and the diagram stops being a drift surface.

**2. A Do/Don't that turns on appearance must be a live story, not an image.**
If the point is *which variant, which token, which size*, a stale screenshot teaches a
wrong value with full confidence. Render it from the real component.

If the point is *ordering, composition, or copy* — "Cancel goes first," "labels are
verb-first" — an image or plain text is fine, because those do not drift when a token
changes. This is why the exemplar pages express most Do/Don't guidance as tables: they
are almost all composition and copy rules, and a table cannot go stale.

### It ends redlining

If measurements are generated from source, a designer annotating spacing in Figma is
asserting a value the system already knows. Worse, they are asserting a **declared** value
when what renders is the effective one — Button's `padding: 8px 12px` under a fixed
control height is the standing example.

Designers read the token table instead of producing redlines. This is a genuine workflow
change and should be said out loud rather than discovered.

### What Figma is still for

Worth stating positively, because everything above reads as demotion.

Figma is where exploration happens and where designers compose screens. The library
mirrors code precisely so that composition starts from what actually exists — which is
what makes design-to-code generation produce something that already agrees with the
source. That is a real job, and it is the reason the mirror has to be kept faithful.

### Adjudicating code vs Figma while authoring — scaffolding for this pass

This is authoring procedure, not published documentation, and it expires when the design
library is rebuilt from code. It exists because the current library is **hand-built**, which
makes it independent evidence of intent, and because "code is the source of truth" is a rule
about values that gets misapplied to composition. Kept here rather than in `docs/` because a
reader of the site never needs it.

Applied in order:

| # | Ask | Verdict |
|---|---|---|
| 1 | Can code even express this? | If no, code is **silent**, not disagreeing. The library carries the intent; record a divergence where code has to grow. |
| 2 | Does code give one answer and the library a different one? | Value question. Code wins; the library has drifted. |
| 3 | Does code give several answers and the library one? | The library breaks the tie as **evidence**, not as decision. Needs sign-off before it becomes a rule. |
| 4 | Does neither state a rule? | Gap. The library's rendering is practice, not policy. Do not promote it. |
| 5 | Was the artifact generated from code? | Then it is not independent evidence about values. Agreement is circular; disagreement means stale emission. |
| 6 | Is the structure load-bearing, or an artifact? | The design tool has limits and parts of the library are unmaintained. A structure that exists because of how variants must be modelled, or because nobody has revisited a component, is not a decision. Ask before promoting it. |

**Case 6 is the one that bites**, because an artifact and a decision look identical in the file.
Two heuristics:

- **Presence is stronger evidence than absence.** A state that has been drawn — a tab's error
  display — was decided by someone. A combination that is *missing* from a variant set may have
  been ruled out, or may never have been built: five axes with 180 combinations get pruned. Never
  turn an absence into a prohibition without asking.
- **An enumerated property may be a modelling choice.** "One property with three values" and "two
  independent toggles" express different rules — exclusive versus combinable — and which one a
  component uses can be down to what is maintainable in the tool. Treat exclusivity read from a
  variant property as a question, not a finding.

Where a rule rests on case-6 evidence, mark it **Needs confirmation** in the constraint table and
say in prose what would settle it. `TITAN-VIEW-17`, `TITAN-BTN-11`, and `TITAN-BTN-12` are the
three currently in that position.

Two qualifiers:

- **Repetition separates intent from example**, and it is also the best defence against a stale
  component: a treatment repeated across variants and templates has been revisited, while a single
  instance may not have been touched in a year. A single instance is an example. The 24px inset recurs on the header row, the tab bar, and the
  body; pagination sits inside the grid in every table template. One published code story
  rendering a tab bar full-bleed is not a decision about gutters.
- **A naming difference is not a conflict.** `Header Info` / `Header Options` versus `Left` /
  `Right` is the friendly term and the identifier, and both belong in the docs — the library wins
  the word, code wins the import. See the prominence precedent on the Button page.

**Why it matters on a deadline.** A rebuild that reads today's code emits a library with no
tab-bar slot in the header, because the code has none. Composition intent that exists only in
the current file and nowhere in code does not get overruled by the rebuild — it disappears,
with no record that it was ever decided. Extracting it into the docs as design intent with
constraint IDs is what carries it across. `TITAN-DIV-16` is the worked case.

### The part that is a people problem, not a tooling problem

"Code is the source of truth" is a statement about **where values live**. It is not a
statement about **who decides**. Those get conflated immediately, and when they do,
designers correctly hear that their work is downstream and non-authoritative, and they
stop engaging with the system.

The documentation is where that gets prevented, and it costs one page: an explicit,
named path for proposing a change, ending in code. Design proposes → the decision is
made → it lands in source → Figma re-emits. A designer changing a value in Figma is not
authoring, but a designer *deciding* a value absolutely is.

If `/invoca-design-system/contribute/reporting-drift` and `/invoca-design-system/contribute/propose-a-component` do not make that
distinction obvious, the model will be read as a demotion no matter how the tooling works.

## 6. Component demos: iframed Storybook

**Constraint driving this:** Mintlify cannot import npm packages into MDX. Verbatim from their docs — *"You cannot import third-party packages."* There is no bundler escape hatch. `import { Button } from "@invoca/titan"` is impossible. Mintlify also cannot import JSON, so Style Dictionary output cannot be read directly either.

**Decision: Titan Storybook deploys separately; docs embed it via iframe.**

Rejected alternatives, and why:

- **Port components into `/invoca-design-system/snippets/*.jsx`** — Produces the best-looking result and creates a second implementation of every component, maintained by hand, guaranteed to drift. This is precisely the failure the generated-to-merged delta metric exists to detect. Rejected on principle.
- **Static images** — Cannot go stale loudly. A screenshot of last quarter's Button looks exactly as authoritative as a correct one.
- **Different platform** — Fumadocs and Docusaurus can import the real package. Deferred, not dismissed; revisit if iframe fidelity proves unacceptable.

Implementation: a `<StorybookFrame>` snippet taking a story ID, wrapping an iframe pointed at the Storybook deployment's `iframe.html`. Accepts a `height` and a theme parameter so light/dark and comfortable/compact demos are the same mechanism.

Known costs, accepted:
- Two deploy targets to keep alive
- Demos will not inherit Mintlify's page theming
- Iframes need explicit height management
- The docs site is only as fresh as the Storybook deploy — so Storybook deploy must be part of the same release, not a manual step

---

## 7. Generated reference content

A CI step reads Titan source and emits MDX partials into `snippets/generated/`. Never hand-edited; the directory carries a header saying so.

| Emitted | From | Into |
|---|---|---|
| Token tables (primitive, semantic, component) | DTCG JSON | `snippets/generated/tokens/*.mdx` |
| Color swatches with light/dark values | DTCG JSON | `<Color>` markup (native Mintlify, theme-aware, click-to-copy) |
| Props tables | Component TS types | `snippets/generated/props/*.mdx` |
| Variant/size/state matrices | Stories | `snippets/generated/matrix/*.mdx` |
| Version and status badges | package.json + manifest | `snippets/generated/status/*.mdx` |

**Two things the emitter must do that a naive one won't:**

1. **Compute effective geometry, not declared values.** Button declares `padding: 8px 12px`, but a fixed `control-height-md` makes the vertical padding largely inert, and `contained`/`outlined`/`text` differ again because borders add to the box. Publishing the declared value teaches a wrong mental model. Publish what renders, and say where the space actually comes from.

2. **Mark framework literals.** Values MUI hard-codes that no token covers — icon gaps, icon sizes, negative offsets, `minWidth` — render, and therefore are spec. Each must be classified as token-bound, framework literal, or deliberately untokenised, and the third case labeled as a decision so it does not read as an oversight.

---

## 8. Agent-readable output

**The site is internal.** That is decided, and it changes what comes free.

| Capability | Internal site | Action |
|---|---|---|
| `/llms.txt`, `/llms-full.txt` | Automatic | 100,000-char cap on the former; expect truncation at full component coverage and plan to commit an override |
| Markdown export (`.md` on any URL) | Automatic | Nothing |
| `markdown.instructions` | Automatic | Set — states the tier model and constraint-ID convention on every page and both llms files |
| Hosted MCP server | Available | Use the **authed** variant at `/authed/mcp` |
| `<Visibility for="agents">` | Works | Use sparingly |
| **`skill.md`** | ❌ **Public sites only** | **Hand-authored** at `docs/skill.md` |
| Contextual "Open in Claude/ChatGPT" | ❌ Broken | Removed from `docs.json` — those services cannot fetch an internal URL, so the button would fail silently. `copy` and `view` are kept; they hand the reader the markdown directly, which works regardless of network. |

**`skill.md` being manual is the significant one.** It is the single artifact that makes
the agentic goal work, and it is now a file that has to be maintained rather than a
byproduct. Committed at `docs/skill.md`, alongside `docs/AGENTS.md` for docs-specific
agent behavior. Both need updating whenever the tier model, the marker conventions, or
the global constraints change — add that to the contribution checklist.

The constraint-ID convention pays off doubly here: an agent can cite `TITAN-BTN-01` as
justification for its output, which makes generated code reviewable against the system
rather than against taste.

**Internal now does not mean internal forever.** The Storybook origin lives in exactly one
constant (`snippets/StorybookFrame.jsx`), so a future public mirror is a one-line change
rather than a find-and-replace across every component page.

---

## 9. Information architecture

```
Get started
  Overview · For designers · For engineers · For agents · Changelog
Foundations
  Overview · Color · Typography · Space & density · Elevation · Motion
  Iconography · Layout & grid · Accessibility
Components
  Actions        Button · IconButton · Link · ButtonGroup · Menu
  Forms          Input · Select · Combobox · Checkbox · Radio · Switch
                 DatePicker · FileUpload · Form · FieldLabel
  Data display   DataTable · List · Card · Tag · Badge · Avatar · EmptyState
  Navigation     Tabs · Breadcrumb · Pagination · SideNav · TopNav
  Feedback       Alert · Toast · Banner · ProgressBar · Spinner · Skeleton
  Containment    Dialog · Drawer · Popover · Tooltip · Accordion · Panel
Patterns
  Destructive confirmation · Form validation · Empty & zero states
  Loading & skeletons · Error handling · Filtering & search
  Bulk selection · Inline editing · Progressive disclosure · Notifications
Views
  List view · Detail view · Settings view · Wizard · Dashboard
  Split view · Full-page form
AI Experience  (a fifth area, outside the four-tier ladder above — see §12)
  Overview
  Wayfinders     Initial CTA · Suggestions
  Inputs         Open input
  Tuners         Controls
  Governors      Stream of thought · Verification
  Trust builders Caveat
  Identifiers    Avatar · Color · Iconography · Name · Personality
  Actions        Search · Summarize · Draft · Update · Disambiguate · Recommend · Welcome/empty state
Content
  Voice & tone · UI labels · Error messages · Empty state copy
  Capitalization & punctuation · Numbers, dates & units
Contribute
  Governance · Propose a component · Token workflow
  Versioning & deprecation · Figma sync · Reporting drift
```

Component grouping is **by job, not by alphabet**. Alphabetical grouping optimizes for a reader who already knows the component's name — which is exactly the reader who doesn't need the nav. Grouping by job serves the reader who knows their problem and not yet its solution, which is both the new hire and the agent.

Mintlify constraint to respect: each navigation element may contain only one type of child at each level. A tab holds groups *or* anchors, never both. `mint validate` catches violations; run it in CI.

---

## 10. Phasing

**Phase 0 — Foundation (this session)**
Plan, IA, `docs.json`, page templates, three exemplar pages proving the content model.

**Phase 1 — Make it real**
Point at the Titan checkout. Build the emitter. Deploy Storybook. Replace every placeholder with generated content. Publish Foundations complete, plus 5 components at full depth.

*Depth over breadth is the whole bet.* Five decision-complete component pages are worth more than forty stubs — to a human, and far more to an agent, which cannot tell a stub from a considered omission.

**Phase 2 — Coverage**
All components. Patterns from the real product surface, not from a generic list — audit shipped Invoca screens and document what recurs.

**Phase 3 — Views and enforcement**
View archetypes. Constraint linting. Track generated-to-merged delta as the health metric.

---

## 11. Open questions

1. **Storybook toolbar globals.** The parameter names controlling color scheme and density are unknown. `StorybookFrame` deliberately omits them — Storybook ignores unrecognized globals silently and renders the default, so a guess produces embeds that look correct while showing the wrong mode.
2. **Sibling Storybooks.** The path `/Titan/core/` implies `/Titan/shared/` and `/Titan/legacy-web/` may also exist, matching the package structure. If so, `StorybookFrame` needs a package parameter.
3. **Mintlify plan.** Which tier gates custom CSS/JS could not be verified — the pricing page renders figures as animated counters. Confirm before depending on custom CSS.
4. **Legacy library.** Confirm nothing in the new docs inherits the "IDS – Core Components" file's Purpose/Prominence/Type model — it is composition-intent evidence, per §5a's adjudication table, never a source for values or variant models.

**Resolved**

- **Figma access** — a live connection to the real "IDS – Core Components" file exists via the
  official Figma Dev Mode MCP server, confirmed by rendering a real screenshot from a real
  page (`node-id=22525-6240`, "Form Elements - Form Input - Text Field"). It is queryable
  evidence now, not an uncertain "may be referenced" — but its evidentiary status is unchanged:
  composition intent where code is silent, never a source for values. **Do not use Code
  Connect as part of this** — it has been confirmed inaccurate; query the file directly
  instead. See `AGENTS.md`'s Figma access section for the access method (including why broad
  page-discovery calls undercount and direct node IDs are the reliable path) and PLAN.md §5a
  for how to weigh what it shows against what code says.

- **Audience** — public (`docs.invoca.com`). See the 2026-09-01 migration note at the top of
  this file — superseded the original "internal" framing in §8.
- **Component demos** — iframed via the public Chromatic deployment
  (`https://main--64e4dc66838839c721332d22.chromatic.com`), not the internal Storybook this
  plan originally targeted. Story IDs are `components-<name-plural>--<story>` in most cases,
  but verify against the deployment's own `/index.json` before shipping one — pluralization is
  not fully predictable (`Menu`'s is singular: `components-menu--docs`), and a component's own
  `utilization.md` self-link has been found stale against what the deployment actually serves.
  See `snippets/StorybookFrame.jsx`'s header for the verification method.
- **Titan checkout access** — a working checkout exists locally at `~/invoca/Titan` (verify per
  environment; this is a local path, not a portable guarantee). `tools/emit-components.mjs` and
  `tools/emit-tokens.mjs` both run against it for real — reference tables are no longer
  placeholders by default. Do not hand-simulate "pending" content going forward; add a
  `component-concepts.json` entry and run the emitter, or state the gap in authored prose.
- **Storybook story index** — the internal `internal-docs.invocadev.com/Titan/core/index.json`
  remains unreachable from this environment, but the public deployment's own `/index.json`
  serves the same purpose (311 entries confirmed) and is what `StorybookFrame` actually embeds
  against — use that one, not the internal one.
- **Component naming** — the inferred component inventory in `docs.json` has not been fully
  reconciled against the real index; treat any component name there as unverified until checked
  the same way the three Actions-category pages (Link/TextLink, ButtonGroup, Menu) were.
- **zeroheight** — only the Dates/Times and Numbers pages are in scope for this pass; both are transcribed and live at `/invoca-design-system/content/*`. The rest is deferred, not blocked.

---

## 12. AI Experience — a fifth area, added 2026-09-02

`/invoca-design-system/ai-experience/*` documents Invoca's agentic AI surfaces: Wayfinders,
Inputs, Tuners, Governors, Trust builders, and Identifiers (names and starting shape adopted
from the public catalogue [Shape of AI](https://www.shapeof.ai/)), plus Actions — the seven
jobs Invoca's own agentic features are known or expected to do (search, summarize, draft,
update, disambiguate, recommend, welcome/empty state), which is not in Shape of AI and is
authored from Invoca's actual product surface, principally [Signal AI](https://mynetwork.invoca.net).

It does not slot into the four-tier ladder in §3. A Pattern page can assume the same input
produces the same output, that every value is derivable from source, that failure is one state
among several, and that documented behavior stays true. None of those hold for a model-backed
feature. So AI Experience pages carry the same constraints/content/accessibility sections as a
Pattern page, plus four this documentation had no prior section for: **agency tier** (Suggests
/ Drafts / Acts-reversible / Acts-irreversible / Acts-unsupervised), **outcome states**
(working, streaming, confident-and-right, confident-and-wrong, uncertain, refused, empty,
interrupted, degraded, rate-limited, stale — with confident-and-wrong as the primary case, not
an edge case), **disclosure & recourse** (six fixed questions — does the user know it's AI,
what did it use, how sure is it, how do they check it, how do they correct it, how do they get
out), and **evaluation** (the eval set, metric, threshold, and named failure classes behind any
capability claim — or an explicit statement that none exists).

Identifiers (Avatar, Color, Iconography, Name, Personality) is the exception within the
exception: it describes how the AI presents itself rather than an interaction, so those five
pages use the lighter foundation shape (what it governs, choosing a value, constraints)
instead of the full pattern shape.

**Status at authoring time: entirely proposal.** Nothing in this area is built. The only real
thing it touches is Signal AI's shipped transcript-summary capability, cited on
[Actions: Summarize](/invoca-design-system/ai-experience/actions/summarize) — even there, only
the external API contract is documented; no model, prompt, or eval data behind it is public.
Every constraint, outcome-state treatment, and content rule in this area is offered for review,
not established policy, the same standing the exemplar pages elsewhere in this plan have.
