#!/usr/bin/env bash
# Reference solution for the oracle agent: the packaged Video.js 10 player on the marketing site's home page, the app
# the user picks when asked, following the installation guide's packaged method. The dashboard stays as it was.
set -euo pipefail

cd apps/marketing
pnpm add @videojs/html

cat > src/player.ts <<'TS'
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
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
    <main class="page">
      <h1>Acme Studio</h1>
      <p>Short films from independent creators.</p>
      <video-player>
        <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
          <video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>
        </video-skin>
      </video-player>
    </main>
    <script type="module" src="/src/main.ts"></script>
    <script type="module" src="/src/player.ts"></script>
  </body>
</html>
HTML
