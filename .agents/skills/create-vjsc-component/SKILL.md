---
name: create-vjsc-component
description: Create VJSC modules. Use for UI and styles.
---

# Create a VJSC component

Author every module so VJSC can understand and transform it in isolation. Prefer explicit component anatomy and state over knowledge of surrounding markup.

## Component ownership

Keep schemas limited to parts owned by the component's real public compound API. Never copy an independent primitive into another component: `VolumePopover.Tooltip` and `Menu.Tooltip` are forbidden. Compose `Tooltip` instead.

## Shared triggers

Nest the component trigger inside the tooltip composition:

```tsx
<ButtonTooltip side="top">
  <$.Menu.Trigger>Settings</$.Menu.Trigger>
</ButtonTooltip>
```

Use the same pattern for `VolumePopover.Trigger`.

- React targets lower each primitive through its `render` composition so both behaviors reach one button.
- HTML root rewrites select `parts.Trigger.one()` and call `trigger.replaceWith(...)`. This preserves the tooltip wrapper while adding `commandfor` to the concrete button or `Host`.
- If two replaced parts share one wrapper, fix the canonical composition instead of duplicating the wrapper.

## Styling

Use the component's styling hooks and exported data attributes before introducing a structural relationship. Put a style on the canonical part that owns the visual, and put state on that same part when practical. If the required hook or state is missing, consider adding a real part, data attribute, ARIA state, or CSS custom property before reaching through the DOM.

Safe defaults include self `data-*` and `aria-*` variants, interaction pseudo-classes, pseudo-elements, media or container queries, and locally owned named groups.

The following break isolated transforms and are forbidden:

- `peer`, `peer-*`, and named peer relationships.
- Implicit ancestor variants such as `in-*`.
- Group consumers without an owner referenced by the same component module.
- Utilities whose compiled CSS escapes the semantic rule's scope.

Do not silence those isolation errors. A named group is acceptable only when the JSX module statically references both its owner and consumers, such as `sliderStyles.root` with `sliderStyles.thumb`.

Avoid structural selectors such as `:has()`, `has-*`, `group-has-*`, descendants, child or sibling combinators, `*`, and `**`. Treat `VJSC_STYLE_COMPLEX_SELECTOR` as design feedback: prefer a component part, colocated state attribute, or locally owned named group. Existing exceptions are gaps, not patterns to copy.

## Style modules

- Default-export `styles({...})` from a relative `*.styles.ts` module and reference static members directly inside JSX `className`. Do not hide references behind barrels, variables, spreads, or dynamic property access; per-module collection must see `styles.thumb` itself.
- Name rules after the part or shortest semantic role: `root`, `trigger`, `popup`, `content`, `track`, `fill`, `thumb`, or `playIcon`. Do not repeat the component name in the key. Set the module `prefix` and let each rule derive `prefix-<kebab key>`, with `root` emitting the prefix itself, such as `media-slider-thumb`. Spell out `className` only where a rule departs from that.
- Put shared primitive rules in a generic module and component-specific deltas in a specific module. Follow the current `button.styles.ts` plus `play-button.styles.ts`, and `slider.styles.ts` plus `time-slider.styles.ts`, pattern.
- Compose classes from general to specific to caller override: `[sliderStyles.thumb, styles.thumb, className]`.
- Organize component and style modules by role (`behaviors`, `buttons`, `dialogs`, `display`, `layout`, `menus`, `sliders`), with reusable popup rules under `styles/popups`. Name output assets for the rules they aggregate, and keep skin-only layout in the skin rather than a generic primitive module.
- Put common utilities in `utilities` and selected skin or target differences in `variants` instead of duplicating a rule.

## Shared utilities and tokens

- Put a recipe that several rules repeat into `packages/skins/src/styles/tailwind.css` as an `@utility`, and prefix it at the use site instead of building class strings dynamically. Name property families `<property>-media-<token>` (`mask-media-volume`, `clip-media-x-*`) and multi-property recipes `<recipe>-media` (`surface-media`, `focus-ring-media`).
- Keep `@utility` bodies flat declaration lists. The Shadcn registry exporter cannot represent nested rules, so state, pseudo-element, and media handling belongs on the use site through variants, and preference modes belong in `themes/preferences.css` through tokens.
- Functional utilities read their argument with `--value([*])`; custom variants use the block form because the shorthand splits comma-separated media query lists. Name variants `media-<state>` and use the layout variants `media-xs`, `media-sm`, `media-md`, `media-lg`, `media-xl`, `media-2xl`, and their `media-max-*` counterparts instead of raw container prefixes. Reach for `media-transitioning` when starting and ending styles share a value, `media-highlighted` for hover, focus, expanded, and highlighted states, and `media-anchored` for anchor-positioning support checks.
- Add other breakpoint sizes when a layout needs them, following Tailwind’s container size scale. Define the matching `--container-media-*` theme key and both `media-*` and `media-max-*` variants, and update the utility reference. Unused variants do not generate utility rules in compiled Tailwind CSS.
- Prefer a `--media-*` token with an `@theme inline` alias over literal values, and use the named utility the alias produces, such as `duration-media-fast`, `scale-media-hidden`, or `shadow-media-thumb`. Reserve the `(--var)` shorthand for runtime values such as `--media-slider-pointer`. Use `rounded-media-pill` rather than `rounded-full`, whose `calc(infinity * 1px)` the style pipeline cannot serialize.
- The vjsc plugin writes a candidate manifest into the Vite cache directory and aliases it as `vjsc:candidates`; the dev Tailwind entry imports it so scanning sees the utilities the transform resolves. The plugin also re-includes the manifest in the Vite watcher, which skips the cache directory by default, so Tailwind recompiles as modules record. Raw style modules are not scanned.
- In CSS output, a composed rule overrides the rules it extends only when its output file comes later in `skinStyleOrder` (`packages/skins/build/transform.ts`); a composition that sets one property in a reversed order fails the build, so add a new output file there after the files it overrides. Tailwind output has no runtime class merging, so a same-property override across composed rules still needs `!` unless Tailwind emits the shorthand first.

## Example

Input: “Add a tooltip to the volume-popover button.”

Output: Wrap `$.VolumePopover.Trigger` in `ButtonTooltip`; keep the schema at `Root`, `Trigger`, and `Popup`; preserve the wrapper in HTML with `replaceWith(...)`; style each primitive through its own part and state hooks.

## Validation

Build Core after schema changes. Run affected isolated transforms for HTML and React with CSS and Tailwind, inspect all style diagnostics, refresh generated snapshots, run `pnpm -F @videojs/skins test`, and verify no foreign parts or forbidden relationships remain.
