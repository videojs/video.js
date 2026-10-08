# Builder Conventions

Naming and file placement conventions required by the api-docs-builder at `site/scripts/api-docs-builder/`.

The builder parses authored TypeScript and TSX with Oxc. Its cached project resolver follows relative and
workspace-package imports, re-exports, interface inheritance, aliases, and the generic substitutions used by
the documented API patterns; it does not invoke the TypeScript compiler.

## File Locations

| File | Path | Purpose |
|------|------|---------|
| Core | `packages/core/src/core/ui/{name}/core.ts` | Props, State, defaultProps |
| Data attrs | `packages/core/src/core/ui/{name}/data.ts` | Data attribute definitions |
| CSS vars | `packages/core/src/core/ui/{name}/vars.ts` | CSS custom property definitions (optional) |
| HTML element | `packages/html/src/ui/{name}/element.ts` | Custom element with `static tagName` |
| React parts | `packages/react/src/ui/{name}/index.parts.ts` | Multi-part detection (optional) |

Every file in a component directory uses a simple role name (`core.ts`, `data.ts`, `vars.ts`, `component.ts`);
helpers drop the folder prefix, such as `slider/segments.ts`. Additional part-scoped data attribute files also use a
simple name, such as `menu/item.ts`. The builder discovers them by the `@parts` JSDoc tag on an exported const whose
name ends in `DataAttrs` (`MenuItemDataAttrs`), not by file name.

## Naming Requirements

The builder derives PascalCase from kebab-case using `kebabCase` from es-toolkit. All interfaces and exports must follow this pattern:

| Convention | Example (play-button) |
|-----------|----------------------|
| Props interface | `PlayButtonProps` |
| State interface | `PlayButtonState` |
| Core class | `PlayButtonCore` |
| Data attrs export | `PlayButtonDataAttrs` |
| CSS vars export | `PlayButtonCSSVars` |
| HTML element class | `PlayButtonElement` |
| HTML tag name | `static tagName = 'media-play-button'` |

## NAME_OVERRIDES

When kebab-to-pascal conversion doesn't produce the correct name, add an override in `site/src/utils/api-reference-overrides.ts` (the shared map the builder imports and the reference pages invert for slug lookup):

```ts
export const NAME_OVERRIDES: Record<string, string> = {
  'pip-button': 'PiPButton',
  'airplay-button': 'AirPlayButton',
};
```

Use overrides only when the standard conversion fails (e.g., acronyms like PiP). Prefer aligning component naming with the standard conversion when possible.

The same map covers media components whose PascalCase name doesn't kebab-case to their element tag name (e.g. `'hlsjs-video': 'HlsJsVideo'`). It is keyed by the generated-reference file slug regardless of component vs. media.

## Multi-Part Components

**Detection**: Presence of `packages/react/src/ui/{name}/index.parts.ts`.

**Non-local re-export filtering**: Only exports with source paths starting with `./` are treated as parts. Re-exports from other directories (e.g., `../slider/index.parts`) are filtered out. This prevents domain variant components (TimeSlider, VolumeSlider) from inheriting base component parts.

**Single-part fallback**: When filtering leaves only one part (typically Root), the component uses single-part mode — the remaining part's props/state/data-attrs are promoted to the top level, not nested under `parts`.

**Primary part identification**: The part whose React source file instantiates the component's Core class (matches `new {Name}Core`). When no part does (the parts drive the core through hooks) or several do (they share one source file), the part exported as `Root` is primary. The primary part receives the shared core props/state/data-attrs/css-vars and the component's `element.ts`.

**Shared source files**: Parts may be exported from one file (`export { XRoot as Root, XOptions as Options, XValue as Value } from './component'`). Their kebabs then derive from the export names (`root`, `options`, `value`) rather than the file name, and descriptions and `{LocalName}Props` resolve by local export name inside that file.

**Non-primary parts**: Each gets its own element file at `packages/html/src/ui/{name}/{part}.ts` (e.g., `time/group.ts`). Element class must be `{Name}{Part}Element` (e.g., `TimeGroupElement`). A nested React part source such as `./chapters/title` is honored when the same folder exists on the HTML side; otherwise the part is looked up flat in the component directory.

**Namespace parts**: `export * as Thumbnail from './thumbnail/index.parts'` groups nested parts that render as `Slider.Thumbnail.Root` and `Slider.Thumbnail.Image` (part ids `thumbnail-root`, `thumbnail-image`). The nested index lives in a folder named after the namespace. Its `Root` maps to the element file of the same name (`slider/thumbnail.ts`, class `SliderThumbnailElement`); other nested parts map to `{namespace}-{part}.ts`. Nested exports may point at another component's file (`../../thumbnail/image`); that part is React-only unless an element file matches, and inherits data attributes from the component that owns the file. Domain variants may re-export the namespace (`export { Thumbnail } from '../slider/index.parts'`) and receive the same nested parts.

**Framework-divergent parts**: All parts get `platforms.react`. Parts with a matching HTML element file also get `platforms.html`. The renderer filters parts by framework — React-only parts are hidden in HTML docs.

**Part descriptions**: Extracted from JSDoc on the React component export:
```tsx
/** Displays a formatted time value. */
export const Value = ...;
```

## JSDoc Extraction

- **Data attribute descriptions**: From JSDoc comments on each property in the data-attrs export object
- **Part descriptions**: From JSDoc on React component exports in their `.tsx` files
- **Prop/state descriptions**: From JSDoc on interface properties in the core file

### Util JSDoc

Util exports (hooks, controllers, factories, selectors) have their own JSDoc conventions for `@param`, `@label`, and `@public` tags. See `references/util-conventions.md` → "JSDoc Conventions".

## Common Failures

The builder fails silently for many issues — data just won't appear in the JSON:

| Symptom | Cause |
|---------|-------|
| No JSON generated | Core file missing or Props interface not found |
| Empty props | Interface not named `{PascalCase}Props` |
| Empty state | Interface not named `{PascalCase}State` |
| No data attributes | File missing or export not named `{PascalCase}DataAttrs` |
| No CSS vars | File missing or export not named `{PascalCase}CSSVars` |
| No HTML tag | Element file missing or no `static tagName` |
| No part descriptions | Missing JSDoc on React component exports |
| Wrong PascalCase | Need a `NAME_OVERRIDES` entry |

## Validation

```bash
# Generate JSON
pnpm -F site api-docs

# Check component output
cat site/src/content/generated-component-reference/{name}.json

# Check util output
cat site/src/content/generated-util-reference/{slug}.json

# Verify schema
# The builder validates against ComponentReferenceSchema / UtilReferenceSchema before writing.
# Schema errors are logged as errors and cause exit code 1.
```
