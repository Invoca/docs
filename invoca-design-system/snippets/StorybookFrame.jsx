/*
 * StorybookFrame — embeds a live Titan component from the Storybook deployment.
 *
 * Mintlify cannot import npm packages into MDX, so components cannot be rendered
 * directly from the Titan package. Storybook is deployed separately and embedded
 * here. This keeps exactly one implementation of every component.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VERIFIED from the pages already live at /invoca-design-system/temp/*:
 *   Origin        https://main--64e4dc66838839c721332d22.chromatic.com
 *   Story ID      components-<name-plural>--<story>   e.g. components-buttons--basic-button,
 *                 components-alerts--basic-alerts, components-chips--color-chips,
 *                 components-modals--medium-modal, components-tooltips--textonly
 *   Autodocs      confirmed working for at least Button (…?path=/docs/components-buttons--docs)
 *
 * This site is public (docs.invoca.com), and so is this Chromatic deployment — unlike the
 * internal Storybook this file originally targeted, these embeds render for every reader.
 *
 * UNVERIFIED — do not trust until checked against the running Storybook:
 *   - The `globals` parameter names for color scheme and density.
 *   - The full story-ID naming convention across all ~40 components. Only the six migrated
 *     from /temp are confirmed; the rest are still the drafted-not-verified names from the IA.
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
