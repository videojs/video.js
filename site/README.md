# Video.js Website

For docs, blog, and more: [videojs.org](https://videojs.org).

Mostly a standard [Astro](https://astro.build/) project.

> [!NOTE]
> This README is the site overview. Agent-specific gotchas and source pointers live in [AGENTS.md](AGENTS.md).

## Project Structure

```text
├── public/                  # Static assets served as videojs.org/[filename]
├── scripts/
│  └── api-docs-builder/     # Generates API reference JSON from TypeScript sources
├── integrations/            # Custom Astro integrations (llms-markdown, etc.)
├── src/
│  ├── assets/               # Assets imported into components, pages, etc.
│  ├── components/
│  │  └── docs/
│  │     ├── api-reference/  # API reference Astro components
│  │     └── demos/          # Interactive component demos
│  ├── content/              # Content collections (blog/, docs/, authors.json)
│  │  └── generated-api-reference/  # Generated JSON (gitignored)
│  ├── examples/             # Temporary, until folded into component docs
│  ├── layouts/              # Astro layout components
│  ├── pages/                # File-based routing
│  ├── stores/               # Nanostores for cross-island client-side state
│  ├── styles/               # Global CSS and Tailwind config
│  ├── types/
│  ├── utils/
│  ├── consts.ts             # Site-wide constants
│  ├── content.config.ts     # Content collection schemas
│  ├── docs.config.ts        # Docs sidebar structure
│  └── test-setup.ts         # Vitest setup
├── astro.config.ts
├── AGENTS.md                # Agent guidance and site-specific gotchas
├── package.json
├── README.md
├── TODO.md
├── tsconfig.json
└── vite.config.ts           # Vite+, Vitest, and site task configuration
```

## Commands

If you're in the monorepo's root...

| Command                   | Action                                                                                                                                  |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev:site`           | Starts local dev server at `localhost:4321`; generates API references and package builds only when they are missing |
| `pnpm dev:site --prepare` | Same, but regenerates API references and rebuilds packages first (after changing package source or JSDoc)                            |
| `pnpm build:site`         | Build the production site to `site/dist/`                                                                                            |

If you're in `site/`...

| Command              | Action                                           |
| :------------------- | :----------------------------------------------- |
| `pnpm install`       | Installs dependencies                            |
| `pnpm exec vp run dev`   | Starts local dev server at `localhost:4321` (expects generated content; run `pnpm exec vp run dev:prepare` first) |
| `pnpm exec vp run build` | Build your production site to `./dist/`      |
| `pnpm astro preview`     | Preview your build locally, before deploying |
| `pnpm api-docs`      | Regenerate API reference JSON from TypeScript    |
| `pnpm astro ...`     | Run CLI commands like `astro add`, `astro check` |
| `pnpm test`          | Run tests with Vitest                            |
| `pnpm test:watch`    | Run tests in watch mode                          |
| `pnpm test:ui`       | Run Vitest with its web-based UI                 |
| `pnpm test:coverage` | Generate test coverage report                    |

## Deployment

The site deploys via Netlify from two branches:

| Branch | Deploys to | Content |
| :--- | :--- | :--- |
| `site/v10` | **videojs.org** | Stable docs matching the latest release |
| `main` | **main.videojs.org** | Pre-release docs (may include unreleased APIs) |

On each release, the CD workflow force-pushes `main` to `site/v10`, keeping production docs in sync with published packages.

**Shipping a change between releases:** The [Cherry-pick to site/v10](../.github/workflows/cherry-pick-site.yml) workflow cherry-picks a change from `main` onto `site/v10`. Ask for it either way:

- Add the `cherry-pick:site` label to the PR. It's picked when the PR merges, or right away if it already has. The changelog prose bot adds the label to every PR it opens, since prose lands after its release is already in production; remove it to hold the prose until the next release.
- Run the workflow from the Actions tab with a merged PR number or a commit SHA on `main`, at any point after the merge (`gh workflow run cherry-pick-site.yml -f target=1234`).

If the pick doesn't apply cleanly, the workflow comments on the PR and you cherry-pick by hand. Nothing else reaches production between releases.

**Cherry-picking by hand:** Land the change on `main` first, then `git cherry-pick -x` it onto `site/v10`. The next release's force-push already includes the change (since it came from `main`), so nothing gets lost. Treat `site/v10` as bot-owned — it is rewritten from `main` on every release, so anything pushed there that isn't also on `main` disappears at the next cut.

## Environment Variables

The installation page's video uploader uses OAuth + Mux. The environment schema in [`astro.config.ts`](astro.config.ts) is the current variable list. The site works without these variables; the uploader is simply unavailable.

## Technology Stack

Here are some of the technologies you should get to know when you're building this site:

- [**Astro**](https://astro.build) - Mostly-static site generation with [island architecture](https://docs.astro.build/en/concepts/islands/)
- [**Tailwind v4**](https://tailwindcss.com) - CSS utility class generator. Inspect [`src/styles/globals.css`](src/styles/globals.css) before reaching for standard Tailwind classes; agent-specific gotchas are indexed in [AGENTS.md](AGENTS.md).
- [**clsx**](https://github.com/lukeed/clsx) - Class name concatenation (in React; Astro has `class:list`)
- [**React**](https://react.dev) - Most of our client-side interactivity is built with React components. **React Compiler is enabled**.
- [**Nanostores**](https://github.com/nanostores/nanostores) - Shared client-side state (React Context doesn't work across islands)
- [**Base UI**](https://base-ui.com) - Headless accessible components
- [**Shiki**](https://shiki.style) - Syntax highlighting
- [**Vitest**](https://vitest.dev) - Testing framework

## Content

We have three-ish main types of content on the site. The blog, docs guides, and docs references. Each of these is created and rendered in a slightly different way.

### Blog

Let's start with the blog because it's more simple.

- Blog posts are written in and stored in [`src/content/blog/`](src/content/blog/) as [MDX](https://mdxjs.com) files
- Astro's [Content Collections API](https://docs.astro.build/en/guides/content-collections/) transforms the MDX into data
- That data is rendered in `src/pages/blog/[...slug].astro`
- Standard MDX typography is defined in `src/components/typography/`

The only weird thing about the blog? Blog posts use date-prefixed filenames: `YYYY-MM-DD-slug.mdx`. For example: `2024-01-15-new-release.mdx`. The date prefix is removed by [utils/globWithParser.ts](src/utils/globWithParser.ts) during content collection transformation, so the post's slug just becomes `new-release` (and its url, `/blog/new-release/`).

### Guides

You'll learn most of what you need to know about writing guides by reading [`src/content/docs/writing-style/write-guides.mdx`](src/content/docs/writing-style/write-guides.mdx).

High-level primer?

- Guides are written in MDX and stored in `src/content/docs/`
- Guides are separated into how-to guides (focused on an outcome) and concept guides (focused on understanding) according to the [Diataxis](https://diataxis.fr) framework.
- Astro's [Content Collections API](https://docs.astro.build/en/guides/content-collections/) transforms the MDX into data
- That data is rendered by `src/pages/docs/framework/[framework]/[...slug].astro`; the canonical installation routes
  use `src/pages/docs/guides/installation/[framework].astro`
- Standard MDX typography is defined in `src/components/typography/`

It's also worth pausing and explaining one big quirk of our docs...

#### Guides are generated for multiple frameworks

We want docs to feel idiomatic, no matter your framework or styling preference. React users shouldn't have to learn about Web Components, HTML users shouldn't have to understand React Hooks, and so on.

We currently support two frameworks (HTML, React) and one styling approach (CSS). This is defined in [types/docs.ts](src/types/docs.ts).

Most docs generate a route per framework. For example, `guides/architecture.mdx` becomes:

- `/docs/framework/html/guides/architecture/`
- `/docs/framework/react/guides/architecture/`

Installation is the entry point readers search for by framework and method, so its six pages use canonical routes under
`/docs/guides/installation/`: React, HTML, Vue, Svelte, Shadcn, and CDN.

Content that applies to only certain frameworks or styles can be restricted in two ways:

1. Within the MDX content itself, by wrapping framework- or style-specific content in `<FrameworkCase>` or `<StyleCase>` components. (Read more about these components in [`src/content/docs/writing-style/write-guides.mdx`](src/content/docs/writing-style/write-guides.mdx).)
2. In the sidebar config ([docs.config.ts](src/docs.config.ts)), by specifying `frameworks` on a per-guide basis, e.g.,

```ts
const sidebar: Sidebar = [
  {
    sidebarLabel: "Getting started",
    contents: [
      { slug: "guides/installation" }, // Available to all
      {
        slug: "guides/react-hooks",
        frameworks: ["react"], // Only for React
      },
    ],
  },
];
```

### Social previews

By default, pages get branded OG/Twitter images at `/og/{slug}.png` and `/og/twitter/{slug}.png`. Those images are rendered on demand by [`src/pages/og/[...path].png.ts`](src/pages/og/[...path].png.ts), limited to known internal routes, and cached by Netlify until the next deploy.

Use `ogTitle` in docs/blog frontmatter when the page title is too long for the social card. For fully custom art, use the existing manual image overrides (`ogImage`, `twitterImage`, or layout `image` props).

### References

API reference pages are generated from TypeScript source code by the builder in [`scripts/api-docs-builder/`](scripts/api-docs-builder/). It extracts component, utility, feature, media, and preset information into the gitignored `src/content/generated-*-reference/` collections.

The JSON is regenerated automatically by the root `pnpm dev` and `pnpm build` commands, or manually via `pnpm api-docs`.

See [`scripts/api-docs-builder/README.md`](scripts/api-docs-builder/README.md) for full documentation.

## Markdown plugins

Astro uses the Satteri Markdown processor with custom MDAST plugins configured in [`astro.config.ts`](astro.config.ts):

- [`satteriConditionalHeadings`](src/utils/satteriConditionalHeadings.ts) tracks conditional headings and generated API-reference headings.
- [`satteriReadingTime`](src/utils/satteriReadingTime.ts) derives reading-time frontmatter.
- [`satteriCodeFrame`](src/utils/satteriCodeFrame.ts) wraps standalone fenced code blocks in the site code-frame component.

The plugin implementations and tests are the source of truth for their behavior.

## Custom Integrations

### Search

Search is powered by [Algolia DocSearch v4](https://docsearch.algolia.com). Configuration is in `src/search.config.ts` and the component is `src/components/Search.tsx`.

### Custom Integration

One custom Astro integration in `integrations/`:

- **llms-markdown** — Generates LLM-optimized `.md` files and `llms.txt` indexes from `[data-llms-content]` elements

Read [`integrations/llms-markdown.ts`](integrations/llms-markdown.ts) for implementation details.

### Markdown delivery

Every generated page has a static `.md` twin. Netlify serves those files directly, with the Markdown headers the
build writes to `_headers`, and the edge functions in [`netlify/edge-functions/`](netlify/edge-functions/) negotiate
`Accept: text/markdown` on the HTML routes. Installation twins are the exception to the otherwise static response: the
shared renderer in `@videojs/installation` validates their query parameters and replaces the generated installation
section at the edge.
The same renderer powers the `npx @videojs/cli agents init` command and the docs bundled with `@videojs/react` and
`@videojs/html`.

Edge functions resolve workspace packages through [`netlify/edge-functions/import_map.json`](netlify/edge-functions/import_map.json).
Keep that map in sync when an edge handler adds or moves a workspace import.
