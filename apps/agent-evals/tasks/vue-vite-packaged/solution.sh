#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation and Vue guides.
set -euo pipefail

pnpm add @videojs/html

cat > vite.config.ts <<'TS'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const videoJsElements = new Set(['video-player', 'video-skin'])

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => videoJsElements.has(tag),
        },
      },
    }),
  ],
})
TS

cat > src/App.vue <<'VUE'
<script setup lang="ts">
import '@videojs/html/video/player'
import '@videojs/html/video/skin'
</script>

<template>
  <main class="page">
    <h1>Acme Studio</h1>
    <p>Short films from independent creators.</p>
    <video-player>
      <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
        <video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>
      </video-skin>
    </video-player>
  </main>
</template>
VUE
