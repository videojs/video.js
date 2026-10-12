#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method for Astro.
set -euo pipefail

pnpm add @videojs/html

mkdir -p src/scripts
cat > src/scripts/player.ts <<'TS'
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
TS

cat > src/pages/index.astro <<'ASTRO'
---

---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<link rel="icon" href="/favicon.ico" />
		<meta name="viewport" content="width=device-width" />
		<meta name="generator" content={Astro.generator} />
		<title>Acme Studio</title>
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
		<script src="../scripts/player.ts"></script>
	</body>
</html>
ASTRO
