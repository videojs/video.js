# Video.js site guide

This file contains site-specific gotchas. Read `site/README.md`, `site/package.json`, the relevant implementation, and its tests for the current architecture and commands.

## Sources of truth

- Commands and versions: `package.json`
- Astro/Vite/Markdown configuration: `astro.config.ts`
- Content schemas: `src/content.config.ts`
- Framework/style support and type guards: `src/types/docs.ts`
- Sidebar and route availability: `src/docs.config.ts`
- Design tokens and variants: `src/styles/globals.css`
- Guide authoring: `src/content/docs/writing-style/write-guides.mdx`
- API builder contract: `scripts/api-docs-builder/src/tests/e2e.test.ts`
- Deployment workflow: root `.github/workflows/`

If this guide conflicts with those files, use the executable source and update this guide.

## Commands

From the repository root:

```bash
pnpm dev:site
pnpm build:site
pnpm -F site test [path-or-pattern]
pnpm -F site api-docs
pnpm -F site astro check
```

## Styling and components

- Inspect `src/styles/globals.css` before choosing Tailwind classes. Prefer existing theme tokens and semantic utilities.
- Use the custom `intent:` variant for pointer/focus intent where existing site code does; do not replace it mechanically with `hover:`.
- Prefer a token-based utility when one fits. For a non-token one-off, use an inline style instead of an arbitrary-value class such as `min-h-[120px]`.
- Use `text-muted` for metadata and chrome only: eyebrows, captions, group labels, key hints, placeholders, inactive nav states, icons, and empty-value dashes. Text a reader has to read keeps full contrast in light mode, where grey on manila reads poorly, with hierarchy carried by size (`text-p3`, `text-p4`); use `dark:text-muted` if it should soften in dark mode.
- When a non-token value needs a responsive, dark-mode, or other Tailwind variant, bridge it through an inline CSS custom property, for example `style="--md-min-h: 120px"` with `class="md:min-h-(--md-min-h)"`.
- Use `clsx` in React and `class:list` in Astro for conditional classes.
- React islands are independent roots. Use Nanostores for cross-island state instead of React context.
- React Compiler is enabled; do not add memoization without a measured or documented need.

## Content

- Read `src/content/docs/writing-style/write-guides.mdx` before adding or reviewing site prose. It owns document types, frontmatter, sidebar registration, framework/style variants, voice, and MDX conventions.
- Changelog source format and generation are owned by `src/content.config.ts` and the root changelog workflows; follow those sources rather than duplicating their extension rules here.
- Blog filenames are `YYYY-MM-DD-slug.mdx`; `src/utils/globWithParser.ts` removes the date from the route slug.
- Use `write-docs` or `review-docs` for prose workflows and `write-api-reference` for generated reference pages.

## Demos

- Use `{{VJS*}}` placeholders from `scripts/replace-demo-placeholders.ts` for shared media URLs in HTML and React demos.
- Keep demo-specific CSS scoped under a unique root class.
- Prefix demo classes with framework, component, and variant.
- Reflect meaningful HTML demo state to `data-*` attributes and style those attributes.
- Use React state for React demo rendering; avoid querying the DOM for application state.
- Set explicit media attributes needed by the scenario (`muted`, `playsinline`, `crossorigin`, and preload behavior).

## Site-specific gotchas

- `astro.config.ts` has a root `vite.optimizeDeps` block that can shadow renderer-provided includes. Keep React client dependencies in its explicit `include` list when changing renderer setup.
- Markdown uses Satteri MDAST plugins, not remark/rehype plugins. Add transformations with `defineMdastPlugin` and write derived frontmatter through `ctx.data.astro.frontmatter`.
- Shiki highlighting is configured independently from the Markdown processor.
- React context does not cross Astro islands.
- Never expose `context.locals.accessToken` to client code. Auth and Mux integration are only for the installation uploader; trace the middleware and server actions before changing that flow.

## Analytics

PostHog loads only in production builds for videojs.org and the pre-release site (main.videojs.org), not deploy previews, from `src/components/Posthog.astro`; its config lives in `src/utils/analytics.ts`. It runs cookieless, so there is no durable person: never call `identify`, `alias`, or a person-property API. Add page context in `withPageContext`, which stamps each event as it is sent; registered super properties go stale across view transitions.

- Mark any installation query parameter that can carry reader data as `private` in `@videojs/installation`. The config masks private parameters, and their current values wherever the page renders them, everywhere in outgoing events. Keep session replay off: it records page text outside `before_send`.
- Autocaptured clicks carry `data-ph-capture-attribute-{location,cta,destination}` as event properties. Put `location` on a container (the closest ancestor wins) and `cta` or `destination` on the anchor or button. Use kebab-case and reuse existing values.
- `src/components/typography/linkDestination.ts` classifies off-site hrefs for `destination`; `A.astro` and `renderInlineMarkdown` apply it to content links.
- Wrap hardcoded links to Mux pages in `withMuxAttribution` from `src/utils/mux/attribution.ts` with their placement; content links get `docs-content` or `blog-content` automatically. In MDX, write links as Markdown or `<A>`, not raw `<a>`. After a build, `pnpm -F site check:link-analytics` fails on an untagged off-site or Mux link.
- Agents read Markdown without running JavaScript, so the `agent-markdown-*` edge functions count those reads server-side through `src/utils/agent-analytics.ts`, in production only. When a Markdown route changes, update those functions' paths too.

## API references

Generated reference JSON is gitignored and rebuilt by `pnpm -F site api-docs`, `pnpm dev:site --prepare`, the root `pnpm dev`, and build. `pnpm dev:site` reuses existing output and only generates it when missing, so refresh it after changing package source or JSDoc. Do not hand-edit it. Change the TypeScript/JSDoc input or the builder, run the generator, and inspect the output. Keep the builder E2E suite passing.

## Verification

Run the narrowest unit tests while iterating. For content or UI work, verify affected framework/style variants in the browser. For builder changes, run its E2E test plus `pnpm -F site api-docs`. Finish with `pnpm -F site astro check` or the relevant site build when the change affects compilation.
