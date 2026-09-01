# Titan theme snapshot

**Captured:** 2026-08-11
**Source:** the live MUI/Titan theme object, read out of a running story in the internal
Storybook at `https://internal-docs.invocadev.com/Titan/core` (Storybook 10.4.0).
**Method:** React fiber walk from `#storybook-root` to the nearest theme in context, then
POSTed to a local receiver. `density.json` is computed from `getComputedStyle` on probe
elements with and without `[data-density="compact"]`.

## Why this exists

The foundation pages were authored against these values. Until the CI emitter described in
[PLAN.md §7](../PLAN.md) can read DTCG source directly, this is the provenance record for
every number in `docs/foundations/`.

**This is a snapshot, not a source of truth.** It is a photograph of one build. Do not
wire anything to it and do not treat a value here as current — re-capture, or better,
build the emitter.

## Files

| File | Contents |
|---|---|
| `tokens.json` | The 338 Titan tokens, as resolved in the default (light) scheme |
| `colorSchemes.json` | `light` and `dark`, each with a full 338-token set — the mode diff lives here |
| `density.json` | All 940 `--titan-*` CSS custom properties, plus the comfortable→compact diff |
| `typography.json` | MUI typography variants as Titan overrides them |
| `transitions.json` | Durations and easings (adopted from MUI unchanged) |
| `breakpoints.json` | Breakpoint values (adopted from MUI unchanged) |
| `zIndex.json` | MUI's `theme.zIndex` — distinct from Titan's own `z-*` tokens in `tokens.json` |
| `shadows.json` | MUI's 25-step shadow array — distinct from Titan's `shadow-*` tokens |
| `palette.json`, `vars.json`, `components.json`, `font.json`, `shape.json`, `opacity.json` | Remaining theme branches |

## Provenance of values

Verified against a clean `createTheme()` from `@mui/material@7.3.11`:

- **Adopted from MUI unchanged** — `transitions.easing`, `transitions.duration`,
  `breakpoints.values`, `zIndex`, `typography.htmlFontSize`, `typography.fontSize`,
  all `fontWeight*`
- **Overridden by Titan** — `shape.borderRadius` (4 → 3), `typography.fontFamily`
  (Roboto → Lato), and every typography variant

Adopted does not mean unconsidered: Titan exposes its own `motion-*` token names over
MUI's values, which is a deliberate act of authorship.
