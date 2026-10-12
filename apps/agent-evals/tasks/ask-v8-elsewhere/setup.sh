#!/usr/bin/env bash
# The html-vite site grows a second page, About, with a Video.js 8 player set up as the Video.js 8 guides describe,
# built as a Vite multi-page app. The home page has no player yet.
set -euo pipefail

npm install --save-exact video.js@8.24.1

cat > vite.config.ts <<'TS'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
      },
    },
  },
})
TS

cat > index.html <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Acme Studio</title>
  </head>
  <body>
    <nav class="nav">
      <a href="/">Home</a>
      <a href="/about.html">About</a>
    </nav>
    <main class="page">
      <h1>Acme Studio</h1>
      <p>Short films from independent creators.</p>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
HTML

cat > about.html <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>About · Acme Studio</title>
  </head>
  <body>
    <nav class="nav">
      <a href="/">Home</a>
      <a href="/about.html">About</a>
    </nav>
    <main class="page">
      <h1>About us</h1>
      <p>Acme Studio started in 2019 as a weekly screening night for local filmmakers. Watch how it began.</p>
      <video
        id="about-player"
        class="video-js vjs-big-play-centered"
        controls
        preload="auto"
        playsinline
        poster="https://image.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ/thumbnail.webp"
      >
        <source src="https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8" type="application/x-mpegURL" />
      </video>
    </main>
    <script type="module" src="/src/about.ts"></script>
  </body>
</html>
HTML

cat > src/about.ts <<'TS'
import './style.css'
import 'video.js/dist/video-js.css'
import videojs from 'video.js'

videojs('about-player', { fluid: true })
TS

cat >> src/style.css <<'CSS'

.nav {
  display: flex;
  gap: 1.5rem;
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0;
}

.nav a {
  color: inherit;
}
CSS
