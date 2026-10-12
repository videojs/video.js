#!/usr/bin/env bash
# Reference solution for the oracle agent, following the installation guide's packaged method for SvelteKit.
set -euo pipefail

pnpm add @videojs/html

# The fixture forces runes mode, so the component renders its children with a snippet instead of the guide's <slot />.
cat > src/lib/VideoPlayer.svelte <<'SVELTE'
<script lang="ts">
	import type { Snippet } from 'svelte';
	import '@videojs/html/video/player';
	import '@videojs/html/video/skin';

	let { children }: { children?: Snippet } = $props();
</script>

<video-player>
	<video-skin>
		{@render children?.()}
	</video-skin>
</video-player>

<style>
	video-skin {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
	}
</style>
SVELTE

cat > src/routes/+page.svelte <<'SVELTE'
<script lang="ts">
	import VideoPlayer from '$lib/VideoPlayer.svelte';
</script>

<svelte:head>
	<title>Acme Studio</title>
</svelte:head>

<main class="page">
	<h1>Acme Studio</h1>
	<p>Short films from independent creators.</p>
	<VideoPlayer>
		<video src="https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4" playsinline></video>
	</VideoPlayer>
</main>

<style>
	.page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 4rem 1.5rem;
		font-family: system-ui, sans-serif;
	}
</style>
SVELTE
