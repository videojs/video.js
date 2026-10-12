#!/usr/bin/env bash
# Reference solution for the oracle agent: the installation guide's new-app path for plain HTML, a static Vite site that
# hosts anywhere, with the packaged player playing the video the user gives when asked.
set -euo pipefail

npm create vite@latest . -- --template vanilla-ts --no-interactive
npm install
npm install @videojs/html

cat > src/player.ts <<'TS'
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
TS

cat > index.html <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Short films</title>
  </head>
  <body style="margin: 0; font-family: system-ui, sans-serif;">
    <main style="max-width: 48rem; margin: 0 auto; padding: 4rem 1.5rem;">
      <h1>Short films</h1>
      <p>Watch our latest film.</p>
      <video-player>
        <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
          <video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>
        </video-skin>
      </video-player>
    </main>
    <script type="module" src="/src/player.ts"></script>
  </body>
</html>
HTML

rm -f src/main.ts src/counter.ts src/style.css src/typescript.svg
