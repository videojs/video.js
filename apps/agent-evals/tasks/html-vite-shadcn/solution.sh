#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's shadcn method for plain HTML.
set -euo pipefail

# The @ alias comes first: without it, shadcn writes the skin into a literal `@/` directory.
cat > tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "lib": ["ES2023", "DOM"],
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
JSON

cat > vite.config.ts <<'TS'
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
TS

cat > components.json <<'JSON'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
JSON

# The add installs @videojs/html at the version the registry names.
npx -y shadcn@latest registry add '@videojs=https://shadcn.videojs.org/r/html/{name}.json'
npx -y shadcn@latest add @videojs/video --overwrite --yes

cat > src/player.ts <<'TS'
import '@videojs/html/video/player';
import '@/components/videojs/video/skin';
TS

# Puts the media element and size into the skin template, then pastes the template into the page below the intro text.
node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const skinFile = "src/components/videojs/video/skin.html";
const replaceOnce = (file, text, anchor, replacement) => {
  if (!text.includes(anchor)) throw new Error(`${file} has no ${anchor}`);
  return text.replace(anchor, () => replacement);
};

let skin = readFileSync(skinFile, "utf8");
skin = replaceOnce(skinFile, skin, "<!-- Add a compatible media element here. -->",
  `<video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>`);
skin = replaceOnce(skinFile, skin, "<media-container",
  `<media-container style="display: block; width: 100%; aspect-ratio: 16 / 9;"`);
writeFileSync(skinFile, skin);

let html = readFileSync("index.html", "utf8");
html = replaceOnce("index.html", html, "      <p>Short films from independent creators.</p>\n",
  `      <p>Short films from independent creators.</p>\n      <video-player>\n${skin.trim()}\n      </video-player>\n`);
html = replaceOnce("index.html", html, "    <script type=\"module\" src=\"/src/main.ts\"></script>\n",
  "    <script type=\"module\" src=\"/src/main.ts\"></script>\n    <script type=\"module\" src=\"/src/player.ts\"></script>\n");
writeFileSync("index.html", html);
'
