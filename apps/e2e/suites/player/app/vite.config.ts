import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

import { createSkinsSourceConfig } from '../../../../../packages/skins/build/vite.ts';

const packageDir = import.meta.dirname;
// Source skin pages compile authored skins on request; packaged pages keep the built framework packages.
const skins = createSkinsSourceConfig({ frameworks: 'package' });

function getPageEntries(): Record<string, string> {
  const entries: Record<string, string> = {};

  // Hand-written pages in src/ (ejected, captions, etc.)
  const srcDir = resolve(packageDir, 'src');

  for (const entry of readdirSync(srcDir)) {
    const file = resolve(srcDir, entry);

    if (entry.endsWith('.html') && entry !== 'index.html' && statSync(file).isFile()) {
      entries[entry.replace('.html', '')] = file;
    }
  }

  // Generated pages in src/pages/
  const pagesDir = resolve(packageDir, 'src/pages');

  if (existsSync(pagesDir)) {
    for (const entry of readdirSync(pagesDir)) {
      const file = resolve(pagesDir, entry);

      if (entry.endsWith('.html') && statSync(file).isFile()) {
        entries[`pages/${entry.replace('.html', '')}`] = file;
      }
    }
  }

  return entries;
}

/**
 * Keep the controls visible before playback starts on every page, since most tests use them without playing first. The
 * tests of the before-start behaviour clear the property.
 */
const controlsBeforeStart = {
  name: 'controls-before-start',
  transformIndexHtml: () => [
    { tag: 'style', children: ':root { --media-controls-before-start: visible; }', injectTo: 'head' as const },
  ],
};

export default defineConfig({
  root: resolve(packageDir, 'src'),
  appType: 'mpa',
  define: {
    __DEV__: 'true',
  },
  plugins: [...skins.plugins, react({ jsxImportSource: 'react' }), controlsBeforeStart],
  resolve: {
    ...skins.resolve,
    dedupe: [...skins.resolve.dedupe, '@videojs/html', '@videojs/react'],
  },
  optimizeDeps: { exclude: skins.optimizeDeps.exclude },
  build: {
    outDir: resolve(packageDir, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rolldownOptions: {
      experimental: {
        nativeMagicString: true,
      },
      input: {
        main: resolve(packageDir, 'src/index.html'),
        ...getPageEntries(),
      },
    },
  },
});
