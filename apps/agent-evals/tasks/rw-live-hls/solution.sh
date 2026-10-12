#!/usr/bin/env bash
# Reference solution for the oracle agent, following agents init for a Vue live-video player with hls.js.
set -euo pipefail

pnpm add @videojs/html @videojs/hlsjs-video

cat > vite.config.ts <<'TS'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const videoJsElements = new Set(['live-video-player', 'live-video-skin', 'hlsjs-video'])

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
import '@videojs/html/live-video/player'
import '@videojs/html/live-video/skin'
import '@videojs/html/media/hlsjs-video'
</script>

<template>
  <main class="page">
    <h1>Acme Studio</h1>
    <p>Short films from independent creators.</p>
    <live-video-player>
      <live-video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
        <hlsjs-video src="http://media.acme.test/live/master.m3u8" playsinline></hlsjs-video>
      </live-video-skin>
    </live-video-player>
  </main>
</template>
VUE
