import process from 'node:process';

import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';
import astro from 'shiki/langs/astro.mjs';
import bash from 'shiki/langs/bash.mjs';
import css from 'shiki/langs/css.mjs';
import html from 'shiki/langs/html.mjs';
import http from 'shiki/langs/http.mjs';
import javascript from 'shiki/langs/javascript.mjs';
import json from 'shiki/langs/json.mjs';
import jsx from 'shiki/langs/jsx.mjs';
import markdown from 'shiki/langs/markdown.mjs';
import mdxLang from 'shiki/langs/mdx.mjs';
import ts from 'shiki/langs/ts.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import yaml from 'shiki/langs/yaml.mjs';
import svgr from 'vite-plugin-svgr';

import { cssExclude, viteCssTarget } from '../build/css-targets.ts';
import { reactCompilerPlugin } from '../build/react-compiler.ts';
import llmsMarkdown from './integrations/llms-integration';
import { llmsIndexPaths } from './integrations/llms-sections';
import { demoPlaceholderPlugin } from './scripts/replace-demo-placeholders.ts';
import { PRERELEASE_URL, PRODUCTION_URL } from './src/consts.ts';
import { satteriCdnVersion } from './src/utils/satteriCdnVersion';
import { satteriCodeFrame } from './src/utils/satteriCodeFrame';
import { satteriConditionalHeadings } from './src/utils/satteriConditionalHeadings';
import { satteriReadingTime } from './src/utils/satteriReadingTime';
import { satteriRelatedLinks } from './src/utils/satteriRelatedLinks';
import { shikiNotationTransformers } from './src/utils/shikiNotationTransformers';
import { shikiStripPreStyle } from './src/utils/shikiStripPreStyle';

// Netlify sets CONTEXT and BRANCH for each deploy. We use them to determine
// the correct site URL:
//   - production (site/v10 branch)  → PRODUCTION_URL (videojs.org)
//   - branch-deploy (main branch)   → PRERELEASE_URL (main.videojs.org)
//   - deploy-preview (PR branches)  → DEPLOY_PRIME_URL (Netlify subdomain)
//
// Hostnames are sourced from src/consts.ts so there is a single place to
// update if the pre-release or production host ever moves.
//
// For URLs that must always point to production regardless of deploy context
// (e.g. canonical, JSON-LD), use PRODUCTION_URL from src/consts.ts instead.
const SITE_URL =
  process.env.CONTEXT === 'production'
    ? PRODUCTION_URL.origin
    : process.env.BRANCH === 'main'
      ? PRERELEASE_URL.origin
      : process.env.DEPLOY_PRIME_URL || PRODUCTION_URL.origin;

// @astrojs/react does not expose @vitejs/plugin-react's native compiler option yet. Register only the compiler here;
// the remaining plugins are already registered by Astro's integration. Limit compilation to site source because
// workspace libraries resolve outside node_modules and already ship compiled output.
const siteReactCompilerPlugin = reactCompilerPlugin({
  compiler: true,
  exclude: [/\.astro$/, /node_modules/],
  include: /[/\\]site[/\\]src[/\\].*\.[jt]sx?$/,
});

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  adapter: netlify({
    devFeatures: { edgeFunctions: false, images: false, environmentVariables: false },
  }),
  // Server-only secrets read at runtime (not inlined at build time).
  // All optional — the site degrades gracefully without auth/Mux configured.
  env: {
    schema: {
      // OAuth — powers the video uploader login flow
      OAUTH_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      OAUTH_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      OAUTH_REDIRECT_URI: envField.string({ context: 'server', access: 'secret', optional: true }),
      OAUTH_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      SESSION_COOKIE_PASSWORD: envField.string({ context: 'server', access: 'secret', optional: true }),
      MUX_API_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: 'https://api.mux.com',
      }),
      // Mux service account credentials — only used by the /api/health/mux endpoint
      MUX_TOKEN_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      MUX_TOKEN_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  integrations: [
    // Only register Sentry when the upload token is present (i.e. production
    // deploys). Without a token the integration still initializes the vite
    // plugin and emits telemetry/init noise during every local and PR build,
    // all for a "can't upload source maps" warning. Gate it at the source.
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentry({
            project: 'videojsorg',
            org: 'mux',
            authToken: process.env.SENTRY_AUTH_TOKEN,
          }),
        ]
      : []),
    mdx({ extendMarkdownConfig: true }),
    sitemap({
      // The llms indexes are written after the build, so the sitemap cannot discover them from the page list.
      customPages: llmsIndexPaths().map((path) => `${SITE_URL}${path}`),
    }),
    llmsMarkdown(),
    react(),
  ],
  prefetch: {
    prefetchAll: true,
  },

  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: {
        light: 'gruvbox-dark-hard',
        dark: 'gruvbox-dark-soft',
      },
      // Pre-declare only the languages used in MDX code fences. Without this,
      // Astro ships a highlighter that lazily loads grammars on first use,
      // which serializes per-block initialization during build.
      // `js`/`cjs`/`mjs` are auto-registered as aliases of `javascript` by Shiki.
      langs: [
        ...tsx,
        ...ts,
        ...css,
        ...html,
        ...jsx,
        ...javascript,
        ...bash,
        ...markdown,
        ...mdxLang,
        ...json,
        ...yaml,
        ...http,
        ...astro,
      ],
      transformers: [...shikiNotationTransformers, shikiStripPreStyle],
    },
    // `syntaxHighlight`/`shikiConfig` are applied by Astro's Shiki layer
    // independently of the Markdown processor, so highlighting is configured
    // here while the processor's custom transforms live in `mdastPlugins`.
    processor: satteri({
      mdastPlugins: [
        satteriReadingTime(),
        satteriRelatedLinks(),
        satteriConditionalHeadings(),
        satteriCdnVersion(),
        satteriCodeFrame(),
      ],
    }),
  },

  image: {
    domains: ['image.mux.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '66.media.tumblr.com',
        pathname: '/tumblr_mdgad5rr0S1qzc111.png',
      },
    ],
  },

  vite: {
    // SVG → React component transform. We use SVGR instead of Astro's
    // experimental svg feature because: (1) React islands need React
    // components, and (2) SVGR runs SVGO for automatic SVG optimization.
    plugins: [siteReactCompilerPlugin, demoPlaceholderPlugin(), tailwindcss(), svgr()],
    // Minify for the root `browserslist` without rewriting the skins' `:dir()` and `light-dark()` for every browser.
    build: { cssTarget: viteCssTarget },
    css: { lightningcss: { exclude: cssExclude } },
    optimizeDeps: {
      // @resvg/resvg-js loads a native .node binding for the server-only OG
      // image route, so Vite's dev optimizer must leave it external.
      exclude: ['@videojs/react', '@videojs/html', '@resvg/resvg-js'],
      // react-dom (CJS) must be pre-bundled so its named exports (createRoot,
      // hydrateRoot) are exposed as ESM bindings to the @astrojs/react client
      // renderer. Excluding @videojs/react above shadows the include list the
      // React integration injects, so re-declare them here.
      include: ['react-dom', 'react-dom/client'],
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Instrument Sans',
      cssVariable: '--font-instrument-sans',
      weights: ['400 600'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
      optimizedFallbacks: true,
      display: 'swap',
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-ibm-plex-mono',
      weights: ['600', '400'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['monospace'],
      optimizedFallbacks: true,
      display: 'swap',
    },
  ],
});
