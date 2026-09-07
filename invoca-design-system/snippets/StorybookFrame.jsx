/*
 * StorybookFrame — embeds a live Titan component from the Storybook deployment.
 *
 * Mintlify cannot import npm packages into MDX, so components cannot be rendered
 * directly from the Titan package. Storybook is deployed separately and embedded
 * here. This keeps exactly one implementation of every component.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VERIFIED from the pages already live at /invoca-design-system/temp/*, plus direct checks
 * against the deployment's own story index (see below):
 *   Origin        https://main--64e4dc66838839c721332d22.chromatic.com
 *   Story ID      components-<name-plural>--<story>   e.g. components-buttons--basic-button,
 *                 components-alerts--basic-alerts, components-chips--color-chips,
 *                 components-modals--medium-modal, components-tooltips--textonly,
 *                 components-text-links--docs, components-button-groups--docs,
 *                 components-menu--docs (this one is NOT pluralized — Menu's own Storybook
 *                 title is singular, confirmed against the index)
 *   Autodocs      confirmed working for at least Button (…?path=/docs/components-buttons--docs)
 *
 * This site is public (docs.invoca.com), and so is this Chromatic deployment — unlike the
 * internal Storybook this file originally targeted, these embeds render for every reader.
 *
 * ⚠ USE A SPECIFIC STORY, NEVER THE `--docs` ID, FOR A "LIVE EXAMPLE" EMBED. A component's
 *   `--docs` id is Storybook's autodocs page for the whole component — title, description,
 *   every story, and the props table, all at once. Embedded at a "live example" height (150–250px)
 *   it shows a sliver of that whole page, not a focused example. Pick an actual story id instead
 *   (e.g. `components-buttons--basic-button`, not `components-buttons--docs`) so the iframe shows
 *   one live, focused rendering. This was shipped wrong on three pages before being caught.
 *
 * ⚠ HOW TO GET A REAL STORY ID — do not derive one from the internal Titan checkout's local
 *   Storybook `title` field, or from a component's `utilization.md` self-link. Both can be
 *   wrong: this deployment's actual slugs follow Chromatic's own pluralization/hyphenation
 *   rules, which do not always match the source `title` string, and a component's own
 *   utilization.md was found carrying a stale self-reference (`components-textlink--docs`
 *   for what the live deployment actually serves as `components-text-links--docs`). Instead,
 *   fetch this deployment's real index and confirm the id is in it before using it:
 *
 *     fetch("https://main--64e4dc66838839c721332d22.chromatic.com/index.json")
 *       .then(r => r.json()).then(d => Object.keys(d.entries))
 *
 *   Then load `.../iframe.html?id=<candidate>&viewMode=docs` and confirm it does not return
 *   "Couldn't find story matching '<id>'" before shipping it in a page.
 *
 * UNVERIFIED — do not trust until checked against the running Storybook:
 *   - The `globals` parameter names for color scheme and density.
 *   - The story-ID naming convention for any component not explicitly listed above as
 *     confirmed. Check it against the index before using it.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Mintlify constraints this file must respect:
 *   - named exports only, no default export
 *   - arrow function syntax
 *   - no imports of any kind (React hooks are pre-injected)
 *   - Tailwind v3 utility classes only; no arbitrary values like w-[347px]
 *
 * Usage:
 *   <StorybookFrame story="components-buttons--basic-button" height={140} />
 *   <StorybookFrame story="components-alerts--basic-alerts" height={300} />
 */

export const StorybookFrame = ({
  story,
  height = 200,
  viewMode = "story",
  globals = null,
  title,
}) => {
  // Mintlify's snippet sandbox doesn't preserve module-scope bindings across
  // exports — a separate `export const STORYBOOK_ORIGIN` referenced from here
  // throws ReferenceError at runtime. Keep it local to this function instead.
  const STORYBOOK_ORIGIN = "https://main--64e4dc66838839c721332d22.chromatic.com";

  const parts = [`id=${story}`, `viewMode=${viewMode}`, "shortcuts=false"];

  if (viewMode === "story") parts.push("singleStory=true");

  // Only emitted when explicitly supplied — a guessed global name is silently
  // ignored by Storybook, which renders the default mode and looks correct.
  if (globals) {
    const g = Object.keys(globals)
      .map((k) => `${k}:${globals[k]}`)
      .join(";");
    parts.push(`globals=${g}`);
  }

  const src = `${STORYBOOK_ORIGIN}/iframe.html?${parts.join("&")}`;
  const canonical = `${STORYBOOK_ORIGIN}/index.html?path=/${viewMode === "docs" ? "docs" : "story"}/${story}`;

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <iframe
        src={src}
        title={title || `Titan Storybook: ${story}`}
        loading="lazy"
        style={{ width: "100%", height: `${height}px`, border: "0", display: "block" }}
      />
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-800 dark:bg-gray-900">
        <span className="font-mono text-gray-500 dark:text-gray-400">{story}</span>
        <a
          href={canonical}
          target="_blank"
          rel="noreferrer"
          className="text-gray-500 underline dark:text-gray-400"
        >
          Open in Storybook ↗
        </a>
      </div>
    </div>
  );
};
