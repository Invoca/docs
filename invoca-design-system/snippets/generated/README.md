# Generated reference content

**Everything in this directory is emitted by CI from Titan source. Do not hand-edit.**

A hand-edit here does not fix anything — it creates a value that disagrees with the
package and survives until someone notices. Fix the source and re-emit.

## What lands here

| Path | Emitted from | Contains |
|---|---|---|
| `tokens/*.mdx` | DTCG token JSON | Primitive, semantic, and component token tables |
| `props/*.mdx` | Component TypeScript types | Props tables with types, defaults, required flags |
| `matrix/*.mdx` | Storybook stories | Variant × size × state matrices |
| `status/*.mdx` | `package.json` + component manifest | Version, status, and `since` badges |
| `utilization/*.mdx` | A `utilization.md` file per component directory in the Titan checkout, refreshed by a separate CI job that greps product repos | Per-application usage counts |

<Warning>
  **`utilization/*.mdx` needs the same "pending" treatment as `tokens/*.mdx` until the Titan
  checkout is wired up.** `emit-components.mjs`'s `analyseUtilization()` reads
  `utilization.md` from the checkout and returns `null` when it is absent — there is no
  fallback data source. The six files emitted before this note (`button`, `tabs`, `table`,
  `alert`, `empty-state`, `skeleton`) contain specific per-repo counts with no traceable
  source and are not marked pending; they need to be replaced with the same "Pending
  generation" placeholder `tokens/*.mdx` already uses. `TITAN-GAP-31`'s prose also cites one
  of these figures ("132 usages across 13 applications") as fact and needs the same fix.
</Warning>

## Emitter requirements

These are not optional refinements. Each exists because the naive version of the
emitter publishes something misleading.

1. **Emit effective geometry, not declared values.**
   A declared `padding: 8px 12px` under a fixed control-height token is not what
   renders. Resolve the rendered box before emitting, and state in the token table
   where the space actually comes from.

2. **Classify every value.** Three classes, all of which must appear in output:
   - **Token-bound** — emit the token name and its resolved value per mode
   - **Untokenised** — it renders but no token stands behind it. It is still spec.
     Emit it, marked, and open a token gap issue.
   - **Deliberately untokenised** — emit it labeled as a decision, so a reader does
     not file it as an oversight.

3. **Emit per-mode values, not one value.** Two axes, disjoint: color-scheme
   (light/dark) and density (comfortable/compact). A token carrying both is a build
   error upstream. Density-constant is a deliberate property — where a size token
   does not flip, say so, because "constant by accident" is how compact proportions
   drift.

4. **Read source JSON, never the `.ts` outputs.** The TypeScript outputs are
   flat-resolved for the theme factory and have lost their references. A token table
   built from them shows leaf values with no alias chain, which is the single most
   useful thing a semantic token page has to communicate.

5. **Mark what the system does not ship.** Titan decides two control sizes, small and
   medium; a `large` still renders but matches no token. What the components accept is
   not what the system offers. Emit the system's surface and flag the difference —
   otherwise a reader infers the wider surface is available.

## Colors

Emit color tokens as Mintlify's native `<Color>` markup rather than a plain table.
It is theme-aware and click-to-copy:

```mdx
<Color variant="table">
  <Color.Row title="Background">
    <Color.Item
      name="tokens.background-raised"
      value={{ light: "#FFFFFF", dark: "#1A1D21" }}
    />
  </Color.Row>
</Color>
```

## Note on JSON

Mintlify cannot import `.json` files into MDX. The emitter must therefore produce
MDX (or JSX literals), not a JSON file for the page to read at runtime.
