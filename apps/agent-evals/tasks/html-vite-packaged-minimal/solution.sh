#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method with the minimal skin.
set -euo pipefail

npm install @videojs/html

cat > src/player.ts <<'TS'
import '@videojs/html/video/player'
import '@videojs/html/video/minimal-skin'
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
        <video-minimal-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
          <video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>
        </video-minimal-skin>
      </video-player>
    </main>
    <script type="module" src="/src/main.ts"></script>
    <script type="module" src="/src/player.ts"></script>
  </body>
</html>
HTML
