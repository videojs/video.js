# MDX Structure

Structure and conventions for API reference MDX pages at `site/src/content/docs/reference/components/` (components, skins, media, extensions, icons) and `site/src/content/docs/reference/api/` (hooks, features, controllers, factories, utilities, and `preset-<name>` pages).

## Component Pages

### Frontmatter

```yaml
---
title: MuteButton              # PascalCase component name
frameworkTitle:
  html: media-mute-button      # HTML custom element tag name
description: A button component for muting and unmuting audio playback
stability: unstable              # Optional; marks an API whose shape may still change
---
```

- `title`: PascalCase React component name
- `frameworkTitle.html`: The `static tagName` from the HTML element file
- `description`: One-line description of the component
- `stability`: Optional API maturity. Use `unstable` when the API works but its shape may still change; the site adds
  the badge and an explanatory note to the page.

### Page Structure

```
frontmatter
imports (React demos, HTML demos)
## Import
## Anatomy
## Behavior       (if applicable)
## Styling        (if applicable)
## Accessibility  (if applicable)
## Examples
### BasicUsage
### [Additional demos]
<ComponentReference component="{PascalCase}" />
```

## Imports Section

Every component page begins with a reader-facing import section:

```mdx
## Import

<ComponentImports component="MuteButton" html="mute-button" />
```

The helper renders the named `@videojs/react` export for React readers and the
`@videojs/html/ui/{name}` side-effect registration import for HTML readers.

### React demo imports

```mdx
{/* React demos */}
import BasicUsageDemoReact from "@/components/docs/demos/{component}/react/css/BasicUsage";
import basicUsageReactTsx from "@/components/docs/demos/{component}/react/css/BasicUsage.tsx?raw";
import basicUsageReactCss from "@/components/docs/demos/{component}/react/css/BasicUsage.css?raw";
```

- Component import: default export from `.tsx` (no extension needed)
- Source imports: `?raw` suffix for displaying source code in tabs

### HTML demo imports

```mdx
{/* HTML demos */}
import BasicUsageDemoHtml from "@/components/docs/demos/{component}/html/css/BasicUsage.astro";
import basicUsageHtml from "@/components/docs/demos/{component}/html/css/BasicUsage.html?raw";
import basicUsageHtmlCss from "@/components/docs/demos/{component}/html/css/BasicUsage.css?raw";
import basicUsageHtmlTs from "@/components/docs/demos/{component}/html/css/BasicUsage.ts?raw";
```

- `.astro` wrapper: renders live demo
- `.html`, `.css`, `.ts`: `?raw` imports for source tabs

### Import naming convention

| Type | Pattern | Example |
|------|---------|---------|
| React component | `{DemoName}DemoReact` | `BasicUsageDemoReact` |
| React source | `{demoName}React{Ext}` | `basicUsageReactTsx` |
| HTML component | `{DemoName}DemoHtml` | `BasicUsageDemoHtml` |
| HTML source | `{demoName}Html` / `{demoName}Html{Ext}` | `basicUsageHtml`, `basicUsageHtmlCss` |

## Anatomy Section

Anatomy shows part nesting with self-closing placeholders, following the Base UI anatomy convention. No hooks, state, handlers, or option mapping — working code belongs in Examples. This holds even when a component has no React component form (e.g. the radio groups, whose React API is a hook feeding `Menu.RadioGroup`): show the part skeleton and let the Behavior prose link to the hook for wiring.

```mdx
## Anatomy

<FrameworkCase frameworks={["react"]}>
```tsx
<MuteButton />
```
</FrameworkCase>

<FrameworkCase frameworks={["html"]}>
```html
<media-mute-button></media-mute-button>
```
</FrameworkCase>
```

For multi-part components, show composed usage:

```mdx
<FrameworkCase frameworks={["react"]}>
```tsx
<Time.Group>
  <Time.Value type="current" />
  <Time.Separator />
  <Time.Value type="duration" />
</Time.Group>
```
</FrameworkCase>
```

## Prose Sections

### Behavior

Explain state transitions, timing, and interaction logic. Use tables for enumerated states:

```mdx
## Behavior

Toggles mute on and off. Exposes a derived `volumeLevel` based on the current volume and mute state:

| Level | Condition |
|-------|-----------|
| `off` | Muted or volume is 0 |
| `low` | Volume < 0.5 |
```

### Styling

**IMPORTANT:** All CSS code blocks in Styling sections MUST be wrapped in `<FrameworkCase>` blocks. HTML examples use custom element selectors (`media-mute-button`), React examples use className-based selectors (`.mute-button`). Never show bare CSS without a framework wrapper — React users should not see HTML element selectors and vice versa.

Show data attributes as a table, then framework-specific CSS selector patterns:

```mdx
## Styling

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-muted` | Present / absent | Present when audio is muted |
| `data-volume-level` | `"off"` \| `"low"` \| `"medium"` \| `"high"` | Current volume level |

Use `data-volume-level` for multi-level icon switching:

<FrameworkCase frameworks={["html"]}>
```css
media-mute-button[data-volume-level="off"] .icon-off { display: inline; }
```
</FrameworkCase>

<FrameworkCase frameworks={["react"]}>
React renders standard DOM elements with the same data attributes. Add a `className` and use it as the selector:

```css
.mute-button[data-volume-level="off"] .icon-off { display: inline; }
```
</FrameworkCase>
```

### Accessibility

Describe ARIA attributes, keyboard interactions, and label overrides:

```mdx
## Accessibility

Renders a `<button>` with an automatic `aria-label`: "Unmute" when muted, "Mute" when unmuted. Override with the `label` prop. Keyboard activation: <kbd>Enter</kbd> / <kbd>Space</kbd>.
```

## Examples Section

### Nesting pattern

```mdx
## Examples

### Basic Usage

<FrameworkCase frameworks={["react"]}>
  <StyleCase styles={["css"]}>
    <Demo files={[
      { title: "App.tsx", code: basicUsageReactTsx, lang: "tsx" },
      { title: "App.css", code: basicUsageReactCss, lang: "css" },
    ]}>
      <BasicUsageDemoReact client:idle />
    </Demo>
  </StyleCase>
</FrameworkCase>

<FrameworkCase frameworks={["html"]}>
  <StyleCase styles={["css"]}>
    <Demo files={[
      { title: "index.html", code: basicUsageHtml, lang: "html" },
      { title: "index.css", code: basicUsageHtmlCss, lang: "css" },
      { title: "index.ts", code: basicUsageHtmlTs, lang: "ts" },
    ]}>
      <BasicUsageDemoHtml />
    </Demo>
  </StyleCase>
</FrameworkCase>
```

Key details:
- React demos use `client:idle` for hydration
- HTML demos render server-side (no `client:*` directive)
- React source tabs: `App.tsx`, `App.css`
- HTML source tabs: `index.html`, `index.css`, `index.ts`

### ComponentReference Component

Always the last element in the file:

```mdx
<ComponentReference component="MuteButton" />
```

The component auto-renders Props, State, Data Attributes, and CSS Custom Properties for single-part and all Parts for multi-part. For multi-part components, React-only parts are hidden in HTML docs via framework filtering.

### Required Astro Component Imports

Every component reference MDX needs these at the top of the imports:

```mdx
import ComponentReference from "@/components/docs/api-reference/ComponentReference.astro";
import ComponentImports from "@/components/docs/api-reference/ComponentImports.astro";
import FrameworkCase from "@/components/docs/FrameworkCase.astro";
import StyleCase from "@/components/docs/StyleCase.astro";
import Demo from "@/components/docs/demos/Demo.astro";
```

---

## Cross-linking

Link generously between related reference pages.

Same-framework or cross-framework link:

```mdx
Within a `Player`, <DocsLink slug="reference/api/use-player">`usePlayer`</DocsLink> is usually simpler.
```

Selector page linking to framework-specific utils:

```mdx
<FrameworkCase frameworks={["react"]}>
Pass `selectPlayback` to <DocsLink slug="reference/api/use-player">`usePlayer`</DocsLink> to subscribe.
</FrameworkCase>

<FrameworkCase frameworks={["html"]}>
Pass `selectPlayback` to <DocsLink slug="reference/api/player-controller">`PlayerController`</DocsLink> to subscribe.
</FrameworkCase>
```

---

## Util Pages

Util pages document React hooks/utilities and HTML controllers/mixins. They are simpler than component pages — no demos, no anatomy.

### Frontmatter

```yaml
---
title: usePlayer
description: Hook to access the player store from within a Player
---
```

- `title`: The exported function/class name (e.g., `usePlayer`, `PlayerController`)
- No `frameworkTitle` — util pages are framework-specific
- `description`: One-line description

### Page Structure

```
frontmatter
import UtilReference
## Import
## Usage
<UtilReference util="{Name}" />
```

### Import Section

Show the import statement for the util:

```mdx
## Import

\`\`\`tsx
import { usePlayer } from '@videojs/react';
\`\`\`
```

### Usage Section

Explain usage patterns with code examples. For multi-overload utils, document each overload:

```mdx
## Usage

`usePlayer` has two overloads:

**Store access (no subscription)** -- returns the store instance.

\`\`\`tsx
const store = usePlayer();
\`\`\`

**Selector-based subscription** -- returns selected state.

\`\`\`tsx
const paused = usePlayer((s) => s.paused);
\`\`\`
```

### UtilReference Component

Always the last element in the file:

```mdx
<UtilReference util="usePlayer" />
```

The component auto-renders Parameters and Return Value tables. For multi-overload utils, it renders each overload with its own sections.

### Required Import

```mdx
import UtilReference from "@/components/docs/api-reference/UtilReference.astro";
```

---

## Sidebar Entry

Add to a group in `site/src/docs.config.ts` under the tab that matches the page's directory; `site/src/content/docs/writing-style/write-references.mdx` lists the groups:

- **Components** tab — `reference/components/` pages, in groups such as Layout, Skins, Media, Buttons, and Icons
- **API** tab — `reference/api/` pages, in groups such as Player, Presets, Store, Features, and Utils

Mark framework-specific entries with `frameworks: ['react']` or `frameworks: ['html']`.

```ts
{
  sidebarLabel: 'Buttons',
  contents: [
    { slug: 'reference/components/play-button' },
    { slug: 'reference/components/{name}' },  // <-- insert
  ],
},
```
