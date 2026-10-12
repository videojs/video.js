#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method for Nuxt with Mux video.
set -euo pipefail

npm install @videojs/html @videojs/mux-video @videojs/mux-data

cat > nuxt.config.ts <<'TS'
// https://nuxt.com/docs/api/configuration/nuxt-config
const videoJsElements = new Set(['video-player', 'video-skin', 'mux-video', 'mux-data'])

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => videoJsElements.has(tag),
    },
  },
})
TS

mkdir -p app/components
cat > app/components/VideoPlayer.client.vue <<'VUE'
<script setup lang="ts">
import '@videojs/html/video/player'
import '@videojs/html/video/skin'
import '@videojs/html/media/mux-video'
import '@videojs/html/extensions/mux-data'
</script>

<template>
  <video-player>
    <video-skin>
      <slot />
    </video-skin>
  </video-player>
</template>

<style>
video-skin {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>
VUE

cat > app/app.vue <<'VUE'
<script setup lang="ts">
import { VideoPlayer } from '#components'
</script>

<template>
  <main class="page">
    <NuxtRouteAnnouncer />
    <h1>Acme Studio</h1>
    <p>Short films from independent creators.</p>
    <VideoPlayer>
      <mux-video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8" playsinline></mux-video>
      <mux-data></mux-data>
    </VideoPlayer>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #171717;
}

.page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 4rem 1.5rem;
}
</style>
VUE
