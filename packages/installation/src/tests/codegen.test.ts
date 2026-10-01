import { describe, expect, it } from 'vite-plus/test';

import {
  generateHTMLInstallCode,
  generateHTMLUsageCode,
  generateReactCreateCode,
  generateReactInstallCode,
  generateSourceHTMLUsageCode,
  generateSourceMediaInstallCode,
  generateSourceReactCreateCode,
  generateSvelteCreateCode,
  generateSvelteUsageCode,
  generateVueCreateCode,
  generateVueCustomElementConfigCode,
  generateVueUsageCode,
  getRendererComponent,
  getRendererTag,
  getSkinComponent,
  getSkinTag,
  INSTALLATION_DEMO_SOURCES,
  type InstallationOptions,
} from '../index';
import type { Renderer } from '../index';

const baseHTML: InstallationOptions = {
  useCase: 'default-video',
  skin: 'video',
  media: 'html5-video',
  sourceUrl: '',
  installMethod: 'npm',
};

const baseReact: InstallationOptions = {
  useCase: 'default-video',
  skin: 'video',
  media: 'html5-video',
  sourceUrl: '',
  installMethod: 'npm',
};

describe('generateHTMLInstallCode', () => {
  const manifest = ['hlsjs-video', 'dash-video', 'mux-video', 'mux-audio'];

  it('returns install commands for all methods', () => {
    const result = generateHTMLInstallCode(baseHTML, manifest);

    expect(result.npm).toBe('npm install @videojs/html');
    expect(result.pnpm).toBe('pnpm add @videojs/html');
    expect(result.yarn).toBe('yarn add @videojs/html');
    expect(result.bun).toBe('bun add @videojs/html');
  });

  it('returns CDN script tags', () => {
    const result = generateHTMLInstallCode(baseHTML, manifest);

    expect(result.cdn).toContain('<script');
    expect(result.cdn).toContain('cdn.jsdelivr.net');
  });

  it('includes HLS media script in CDN output', () => {
    const result = generateHTMLInstallCode({ ...baseHTML, media: 'hls' }, manifest);

    expect(result.cdn).toContain('media/hlsjs-video.js');
  });

  it('includes the Mux Data extension script alongside Mux media in CDN output', () => {
    const result = generateHTMLInstallCode({ ...baseHTML, media: 'mux-video' }, manifest);

    expect(result.cdn).toContain('media/mux-video.js');
    expect(result.cdn).toContain('extensions/mux-data.js');
  });

  it('registers the container for a skinless CDN player', () => {
    const result = generateHTMLInstallCode({ ...baseHTML, skin: 'none' }, manifest);

    expect(result.cdn).toContain('/video-player.js');
    expect(result.cdn).toContain('/ui/container.js');
  });

  it('installs the selected playback adapter', () => {
    const hls = generateHTMLInstallCode({ ...baseHTML, media: 'hls' }, manifest);
    const dash = generateHTMLInstallCode({ ...baseHTML, media: 'dash' }, manifest);

    expect(hls.npm).toBe('npm install @videojs/html @videojs/hlsjs-video');
    expect(dash.pnpm).toBe('pnpm add @videojs/html @videojs/dash-video');
  });

  it('installs selected extensions', () => {
    const result = generateHTMLInstallCode({ ...baseHTML, media: 'hls', extensions: ['google-cast'] }, manifest);

    expect(result.pnpm).toBe('pnpm add @videojs/html @videojs/hlsjs-video @videojs/google-cast');
  });

  it('installs the adapter package for every embed renderer', () => {
    const expected = [
      ['cloudflare', '@videojs/cloudflare-video'],
      ['spotify', '@videojs/spotify-audio'],
      ['tiktok', '@videojs/tiktok-video'],
      ['twitch', '@videojs/twitch-video'],
      ['vimeo', '@videojs/vimeo-video'],
      ['youtube', '@videojs/youtube-video'],
    ] as const satisfies ReadonlyArray<readonly [Renderer, string]>;

    for (const [renderer, adapter] of expected) {
      const result = generateHTMLInstallCode({ ...baseHTML, media: renderer }, manifest);

      expect(result.npm).toBe(`npm install @videojs/html ${adapter}`);
    }
  });

  it('installs only the framework for built-in renderers', () => {
    for (const renderer of ['html5-video', 'html5-audio', 'background-video'] as const) {
      expect(generateHTMLInstallCode({ ...baseHTML, media: renderer }, manifest).npm).toBe('npm install @videojs/html');
    }
  });

  it('installs the Mux Data extension package alongside Mux media adapters', () => {
    const video = generateHTMLInstallCode({ ...baseHTML, media: 'mux-video' }, manifest);
    const audio = generateHTMLInstallCode(
      { ...baseHTML, useCase: 'default-audio', skin: 'audio', media: 'mux-audio' },
      manifest
    );

    expect(video.npm).toBe('npm install @videojs/html @videojs/mux-video @videojs/mux-data');
    expect(audio.pnpm).toBe('pnpm add @videojs/html @videojs/mux-audio @videojs/mux-data');
  });
});

describe('generateReactInstallCode', () => {
  it('returns install commands for all methods', () => {
    const result = generateReactInstallCode();

    expect(result.npm).toBe('npm install @videojs/react');
    expect(result.pnpm).toBe('pnpm add @videojs/react');
    expect(result.yarn).toBe('yarn add @videojs/react');
    expect(result.bun).toBe('bun add @videojs/react');
  });

  it('installs the selected playback adapter', () => {
    const result = generateReactInstallCode({ media: 'hls' });

    expect(result.npm).toBe('npm install @videojs/react @videojs/hlsjs-video');
  });

  it('installs the Mux Data extension package alongside Mux media adapters', () => {
    const result = generateReactInstallCode({ media: 'mux-video' });

    expect(result.npm).toBe('npm install @videojs/react @videojs/mux-video @videojs/mux-data');
  });

  it('installs Google Cast when selected', () => {
    const result = generateReactInstallCode({ media: 'hls', extensions: ['google-cast'] });

    expect(result.pnpm).toBe('pnpm add @videojs/react @videojs/hlsjs-video @videojs/google-cast');
  });
});

describe('generateHTMLUsageCode', () => {
  it('generates HTML with video-player and video-skin for default video', () => {
    const result = generateHTMLUsageCode(baseHTML);

    expect(result.html).toContain('<video-player>');
    expect(result.html).toContain('<video-skin style=');
    expect(result.html).toContain('<video src=');
    expect(result.html).toContain('playsinline');
  });

  it('includes TypeScript imports when not CDN', () => {
    const result = generateHTMLUsageCode(baseHTML);

    expect(result.imports).toBeDefined();
    expect(result.imports).toContain("import '@videojs/html/video/player'");
    expect(result.imports).toContain("import '@videojs/html/video/skin'");
  });

  it('registers and renders selected extensions', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, media: 'hls', extensions: ['google-cast'] });

    expect(result.imports).toContain("import '@videojs/html/extensions/google-cast'");
    expect(result.html).toContain('<google-cast></google-cast>');
  });

  it('omits TypeScript imports when CDN', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, installMethod: 'cdn' });

    expect(result.imports).toBeUndefined();
  });

  it('uses audio tags for audio use case', () => {
    const opts: InstallationOptions = {
      ...baseHTML,
      useCase: 'default-audio',
      skin: 'audio',
      media: 'html5-audio',
    };
    const result = generateHTMLUsageCode(opts);

    expect(result.html).toContain('<audio-player>');
    expect(result.html).toContain('<audio-skin>');
    expect(result.html).toContain(`<audio src="${INSTALLATION_DEMO_SOURCES.audio}"`);
    expect(result.html).not.toContain('playsinline');
  });

  it('uses background-video tags', () => {
    const opts: InstallationOptions = {
      ...baseHTML,
      useCase: 'background-video',
      media: 'background-video',
    };
    const result = generateHTMLUsageCode(opts);

    expect(result.html).toContain('<background-video-player>');
    expect(result.html).toContain('<background-video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">');
  });

  it('includes the HLS media TypeScript import', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, media: 'hls' });

    expect(result.imports).toContain("import '@videojs/html/media/hlsjs-video'");
  });

  it('uses the dash-video tag, playsinline, and media import for DASH', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, media: 'dash' });

    expect(result.html).toContain('<dash-video src=');
    expect(result.html).toContain('playsinline');
    expect(result.html).toContain('.mpd');
    expect(result.imports).toContain("import '@videojs/html/media/dash-video'");
  });

  it('uses the mux-video tag, playsinline, and media import for Mux video', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, media: 'mux-video' });

    expect(result.html).toContain('<mux-video src=');
    expect(result.html).toContain('playsinline');
    expect(result.imports).toContain("import '@videojs/html/media/mux-video'");
  });

  it('adds the Mux Data component and import alongside Mux video by default', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, media: 'mux-video' });

    expect(result.html).toContain('<mux-data></mux-data>');
    expect(result.html).toContain('Mux Data monitors playback quality');
    expect(result.imports).toContain("import '@videojs/html/extensions/mux-data'");
  });

  it('does not add Mux Data for non-Mux media', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, media: 'hls' });

    expect(result.html).not.toContain('mux-data');
    expect(result.imports).not.toContain('mux-data');
  });

  it('uses the vimeo-video tag and media import, without playsinline (iframe)', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, media: 'vimeo' });

    expect(result.html).toContain('<vimeo-video src=');
    expect(result.html).not.toContain('playsinline');
    expect(result.html).toContain('vimeo.com');
    expect(result.imports).toContain("import '@videojs/html/media/vimeo-video'");
  });

  it('uses the embed-provider tags and media imports, without playsinline (iframe)', () => {
    const cases = [
      { media: 'youtube', tag: 'youtube-video', urlPart: 'youtube.com' },
      { media: 'cloudflare', tag: 'cloudflare-video', urlPart: 'videodelivery.net' },
      { media: 'tiktok', tag: 'tiktok-video', urlPart: 'tiktok.com' },
      { media: 'twitch', tag: 'twitch-video', urlPart: 'twitch.tv' },
    ] as const;

    for (const { media, tag, urlPart } of cases) {
      const result = generateHTMLUsageCode({ ...baseHTML, media });

      expect(result.html).toContain(`<${tag} src=`);
      expect(result.html).not.toContain('playsinline');
      expect(result.html).toContain(urlPart);
      expect(result.imports).toContain(`import '@videojs/html/media/${tag}'`);
    }
  });

  it('uses the spotify-audio tag and media import for the audio use case', () => {
    const result = generateHTMLUsageCode({
      ...baseHTML,
      useCase: 'default-audio',
      skin: 'audio',
      media: 'spotify',
    });

    expect(result.html).toContain('<spotify-audio src=');
    expect(result.html).not.toContain('playsinline');
    expect(result.html).toContain('open.spotify.com');
    expect(result.imports).toContain("import '@videojs/html/media/spotify-audio'");
  });

  it('uses the mux-audio tag without playsinline for the audio use case', () => {
    const result = generateHTMLUsageCode({
      ...baseHTML,
      useCase: 'default-audio',
      skin: 'audio',
      media: 'mux-audio',
    });

    expect(result.html).toContain('<mux-audio src=');
    expect(result.html).not.toContain('playsinline');
    expect(result.imports).toContain("import '@videojs/html/media/mux-audio'");
    expect(result.html).toContain('<mux-data></mux-data>');
    expect(result.imports).toContain("import '@videojs/html/extensions/mux-data'");
  });

  it('uses neutral skin tag', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, skin: 'neutral-video' });

    expect(result.html).toContain('<video-neutral-skin style=');
    expect(result.imports).toContain("import '@videojs/html/video/neutral-skin'");
  });

  it('omits skin tag and skin import when skin is none', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, skin: 'none' });

    expect(result.html).toContain('<video-player>');
    expect(result.html).toContain(
      '<media-container style="position: relative; display: block; width: 100%; aspect-ratio: 16 / 9;">'
    );
    expect(result.html).toContain('<video src=');
    expect(result.html).not.toContain('playsinline style=');
    expect(result.html).not.toContain('<video-skin>');
    expect(result.imports).toContain("import '@videojs/html/video/player'");
    expect(result.imports).toContain("import '@videojs/html/ui/container'");
    expect(result.imports).not.toContain("import '@videojs/html/video/skin'");
  });

  it('uses custom source URL when provided', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, sourceUrl: 'https://example.com/video.mp4' });

    expect(result.html).toContain('https://example.com/video.mp4');
  });

  it('uses default demo URL when source URL is empty', () => {
    const result = generateHTMLUsageCode(baseHTML);

    expect(result.html).toContain('stream.mux.com');
  });

  it('uses live-video tags and imports for the live video use case', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, useCase: 'live-video', media: 'hls' });

    expect(result.html).toContain('<live-video-player>');
    expect(result.html).toContain('<live-video-skin style=');
    expect(result.html).toContain('<hlsjs-video src=');
    expect(result.html).toContain('playsinline');
    expect(result.imports).toContain("import '@videojs/html/live-video/player'");
    expect(result.imports).toContain("import '@videojs/html/live-video/skin'");
    expect(result.imports).toContain("import '@videojs/html/media/hlsjs-video'");
  });

  it('uses the neutral live video skin tag', () => {
    const result = generateHTMLUsageCode({
      ...baseHTML,
      useCase: 'live-video',
      skin: 'neutral-video',
      media: 'hls',
    });

    expect(result.html).toContain('<live-video-neutral-skin style=');
    expect(result.imports).toContain("import '@videojs/html/live-video/neutral-skin'");
  });

  it('omits the skin for a headless live video player', () => {
    const result = generateHTMLUsageCode({ ...baseHTML, useCase: 'live-video', skin: 'none', media: 'hls' });

    expect(result.html).toContain('<live-video-player>');
    expect(result.html).not.toContain('<live-video-skin>');
    expect(result.imports).toContain("import '@videojs/html/live-video/player'");
    expect(result.imports).not.toContain("import '@videojs/html/live-video/skin'");
  });

  it('uses live-audio tags and imports without playsinline', () => {
    const result = generateHTMLUsageCode({
      ...baseHTML,
      useCase: 'live-audio',
      skin: 'audio',
      media: 'mux-audio',
    });

    expect(result.html).toContain('<live-audio-player>');
    expect(result.html).toContain('<live-audio-skin>');
    expect(result.html).toContain('<mux-audio src=');
    expect(result.html).not.toContain('playsinline');
    expect(result.imports).toContain("import '@videojs/html/live-audio/player'");
    expect(result.imports).toContain("import '@videojs/html/live-audio/skin'");
    expect(result.imports).toContain("import '@videojs/html/media/mux-audio'");
    expect(result.html).toContain('<mux-data></mux-data>');
    expect(result.imports).toContain("import '@videojs/html/extensions/mux-data'");
  });

  it('defaults live use cases to a live source URL', () => {
    const live = generateHTMLUsageCode({ ...baseHTML, useCase: 'live-video', media: 'hls' });
    const onDemand = generateHTMLUsageCode({ ...baseHTML, media: 'hls' });

    expect(live.html).toContain('.m3u8');
    // A distinct asset from the on-demand demo, so the live player actually
    // reports live-edge state.
    expect(live.html).not.toEqual(onDemand.html);
  });
});

describe('Vue and Svelte code generation', () => {
  const hlsOptions = { ...baseHTML, media: 'hls' as const };

  it('configures Vue to pass the selected custom elements to the browser', () => {
    const code = generateVueCustomElementConfigCode(hlsOptions);

    expect(code['vite.config.ts']).toContain("'video-player', 'video-skin', 'hlsjs-video'");
    expect(code['nuxt.config.ts']).toContain('isCustomElement: (tag) => videoJsElements.has(tag)');
    expect(code['astro.config.mjs']).toContain("import vue from '@astrojs/vue'");
    expect(code['astro.config.mjs']).toContain('isCustomElement: (tag) => videoJsElements.has(tag)');
  });

  it('creates a Vue component and usage example from the selected player', () => {
    const player = generateVueCreateCode(hlsOptions).component;
    const usage = generateVueUsageCode({ ...hlsOptions, sourceUrl: 'https://example.com/live.m3u8' })['App.vue'];

    expect(player).toContain("import '@videojs/html/media/hlsjs-video'");
    expect(player).toContain('<slot />');
    expect(player).toContain(`<style>
video-skin {
  display: block;`);
    expect(player).not.toContain('style="');
    expect(player).not.toContain('defineProps');
    expect(usage).toContain('<VideoPlayer>');
    expect(usage).toContain('    <hlsjs-video src="https://example.com/live.m3u8" playsinline>');
  });

  it('renders Vue and Svelte players from Astro pages', () => {
    const vue = generateVueUsageCode({
      ...hlsOptions,
      playerImport: '../components/VideoPlayer.vue',
      sourceUrl: 'https://example.com/live.m3u8',
    })['index.astro'];
    const svelte = generateSvelteUsageCode({
      ...hlsOptions,
      playerImport: '../components/VideoPlayer.svelte',
      sourceUrl: 'https://example.com/live.m3u8',
    })['index.astro'];

    expect(vue).toContain("import VideoPlayer from '../components/VideoPlayer.vue'");
    expect(vue).toContain('<VideoPlayer client:load>');
    expect(svelte).toContain("import VideoPlayer from '../components/VideoPlayer.svelte'");
    expect(svelte).toContain('<VideoPlayer client:load>');
  });

  it('imports packaged Nuxt players through its component registry', () => {
    const usage = generateVueUsageCode({ ...hlsOptions, playerImport: '#components' })['App.vue'];

    expect(usage).toContain("import { VideoPlayer } from '#components'");
    expect(usage).not.toContain("import VideoPlayer from '#components'");
  });

  it('emits Vue media URLs as escaped static attributes', () => {
    const sourceUrl = 'https://example.com/video.m3u8?label="quoted"&autoplay=1';
    const usage = generateVueUsageCode({ ...hlsOptions, sourceUrl })['App.vue'];

    expect(usage).toContain('src="https://example.com/video.m3u8?label=&quot;quoted&quot;&amp;autoplay=1"');
    expect(usage).not.toContain(':src=');
  });

  it('creates Svelte and SvelteKit examples from the selected player', () => {
    const player = generateSvelteCreateCode(hlsOptions).component;
    const usage = generateSvelteUsageCode({ ...hlsOptions, sourceUrl: 'https://example.com/live.m3u8' });

    expect(player).toContain('<slot />');
    expect(player).toContain(`<style>
video-skin {
  display: block;`);
    expect(player).not.toContain('style="');
    expect(player).not.toContain('$props');
    expect(usage['+page.svelte']).toContain("import VideoPlayer from '$lib/VideoPlayer.svelte'");
    expect(usage['App.svelte']).toContain('<VideoPlayer>');
    expect(usage['App.svelte']).toContain('<hlsjs-video src={"https://example.com/live.m3u8"} playsinline>');
  });

  it('emits custom Svelte sources as JavaScript string expressions', () => {
    const sourceUrl = 'https://example.com/video.mp4?label={quoted}&path=\\media';
    const usage = generateSvelteUsageCode({ ...hlsOptions, sourceUrl });

    expect(usage['+page.svelte']).toContain(`src={${JSON.stringify(sourceUrl)}}`);
    expect(usage['App.svelte']).toContain(`src={${JSON.stringify(sourceUrl)}}`);
  });

  it('names reusable components after the selected preset', () => {
    const audioOptions = {
      ...baseHTML,
      useCase: 'default-audio' as const,
      media: 'html5-audio' as const,
    };

    expect(generateVueUsageCode(audioOptions)['App.vue']).toContain('<AudioPlayer>');
    expect(generateSvelteUsageCode(audioOptions)['App.svelte']).toContain(
      "import AudioPlayer from './lib/AudioPlayer.svelte'"
    );
  });
});

describe('generateReactCreateCode', () => {
  it('generates a React page for default video', () => {
    const result = generateReactCreateCode(baseReact);
    const code = result['app/page.tsx'];

    expect(code).not.toContain("'use client'");
    expect(code).not.toContain('createPlayer');
    expect(code).not.toContain('videoFeatures');
    expect(code).toContain("import { VideoPlayer, VideoSkin, Video } from '@videojs/react/video'");
    expect(code).toContain('<VideoPlayer>');
    expect(code).toContain('<VideoSkin style=');
    expect(code).toContain('<Video src={"');
    expect(code).toContain('playsInline />');
    expect(code).toContain('export default function Page()');
    expect(code).toContain("from '@videojs/react/video'");
    expect(code).toContain("import '@videojs/react/video/skin.css'");
  });

  it('uses separate media import for HLS', () => {
    const result = generateReactCreateCode({ ...baseReact, media: 'hls' });
    const code = result['app/page.tsx'];

    expect(code).toContain("import { VideoPlayer, VideoSkin } from '@videojs/react/video'");
    expect(code).toContain("import { HlsJsVideo } from '@videojs/react/media/hlsjs-video'");
    expect(code).toContain('<HlsJsVideo src={"');
    expect(code).toContain('playsInline />');
  });

  it('uses separate media import for DASH', () => {
    const result = generateReactCreateCode({ ...baseReact, media: 'dash' });
    const code = result['app/page.tsx'];

    expect(code).toContain("import { DashVideo } from '@videojs/react/media/dash-video'");
    expect(code).toContain('<DashVideo src={"');
    expect(code).toContain('playsInline />');
  });

  it('inlines the selected media source', () => {
    const code = generateReactCreateCode({
      ...baseReact,
      sourceUrl: 'https://example.com/video.mp4',
    })['app/page.tsx'];

    expect(code).toContain('<Video src={"https://example.com/video.mp4"} playsInline />');
  });

  it('uses separate media import for Mux video', () => {
    const result = generateReactCreateCode({ ...baseReact, media: 'mux-video' });
    const code = result['app/page.tsx'];

    expect(code).toContain("import { MuxVideo } from '@videojs/react/media/mux-video'");
    expect(code).toContain('<MuxVideo src={"');
    expect(code).toContain('playsInline />');
  });

  it('renders and imports the Mux Data component alongside Mux video by default', () => {
    const code = generateReactCreateCode({ ...baseReact, media: 'mux-video' })['app/page.tsx'];

    expect(code).toContain("import { MuxData } from '@videojs/react/extensions/mux-data'");
    expect(code).toContain('<MuxData />');
    expect(code).toContain('Mux Data monitors playback quality');
  });

  it('does not add Mux Data for non-Mux media', () => {
    const code = generateReactCreateCode({ ...baseReact, media: 'hls' })['app/page.tsx'];

    expect(code).not.toContain('MuxData');
    expect(code).not.toContain('mux-data');
  });

  it('uses separate media import for Vimeo without playsInline (iframe)', () => {
    const result = generateReactCreateCode({ ...baseReact, media: 'vimeo' });
    const code = result['app/page.tsx'];

    expect(code).toContain("import { VimeoVideo } from '@videojs/react/media/vimeo-video'");
    expect(code).toContain('<VimeoVideo src={"');
    expect(code).not.toContain('playsInline');
  });

  it('uses separate media imports for the embed providers without playsInline (iframe)', () => {
    const cases = [
      { media: 'youtube', component: 'YouTubeVideo', subpath: 'youtube-video' },
      { media: 'cloudflare', component: 'CloudflareVideo', subpath: 'cloudflare-video' },
      { media: 'tiktok', component: 'TikTokVideo', subpath: 'tiktok-video' },
      { media: 'twitch', component: 'TwitchVideo', subpath: 'twitch-video' },
    ] as const;

    for (const { media, component, subpath } of cases) {
      const code = generateReactCreateCode({ ...baseReact, media })['app/page.tsx'];

      expect(code).toContain(`import { ${component} } from '@videojs/react/media/${subpath}'`);
      expect(code).toContain(`<${component} src={"`);
      expect(code).not.toContain('playsInline');
    }
  });

  it('uses a separate media import for Spotify in the audio use case', () => {
    const code = generateReactCreateCode({
      ...baseReact,
      useCase: 'default-audio',
      skin: 'audio',
      media: 'spotify',
    })['app/page.tsx'];

    expect(code).toContain("import { SpotifyAudio } from '@videojs/react/media/spotify-audio'");
    expect(code).toContain('<SpotifyAudio src={"');
  });

  it('uses audio features and components', () => {
    const opts: InstallationOptions = {
      ...baseReact,
      useCase: 'default-audio',
      skin: 'audio',
      media: 'html5-audio',
    };
    const result = generateReactCreateCode(opts);
    const code = result['app/page.tsx'];

    expect(code).not.toContain('audioFeatures');
    expect(code).toContain("import { AudioPlayer, AudioSkin, Audio } from '@videojs/react/audio'");
    expect(code).toContain('<AudioPlayer>');
    expect(code).toContain('<AudioSkin>');
    expect(code).toContain(`<Audio src={"${INSTALLATION_DEMO_SOURCES.audio}"}`);
    expect(code).not.toContain('playsInline');
  });

  it('uses neutral skin component', () => {
    const result = generateReactCreateCode({ ...baseReact, skin: 'neutral-video' });
    const code = result['app/page.tsx'];

    expect(code).toContain('<NeutralVideoSkin style=');
    expect(code).toContain("import '@videojs/react/video/neutral-skin.css'");
  });

  it('omits skin component and CSS import when skin is none', () => {
    const result = generateReactCreateCode({ ...baseReact, skin: 'none' });
    const code = result['app/page.tsx'];

    expect(code).not.toContain('VideoSkin');
    expect(code).not.toContain('skin.css');
    expect(code).toContain("import { Container } from '@videojs/react'");
    expect(code).toContain("<Container style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>");
    expect(code).toContain('<Video src={"');
    expect(code).toContain('playsInline />');
    expect(code).not.toContain('playsInline style=');
    expect(code).toContain("from '@videojs/react/video'");
  });

  it('uses the live video player, skin, and CSS import', () => {
    const result = generateReactCreateCode({ ...baseReact, useCase: 'live-video', media: 'hls' });
    const code = result['app/page.tsx'];

    expect(code).toContain('<LiveVideoPlayer>');
    expect(code).toContain('<LiveVideoSkin style=');
    expect(code).toContain("import { LiveVideoPlayer, LiveVideoSkin } from '@videojs/react/live-video'");
    expect(code).toContain("import { HlsJsVideo } from '@videojs/react/media/hlsjs-video'");
    expect(code).toContain("import '@videojs/react/live-video/skin.css'");
    expect(code).toContain('<HlsJsVideo src={"');
    expect(code).toContain('playsInline />');
  });

  it('uses the neutral live video skin component', () => {
    const result = generateReactCreateCode({
      ...baseReact,
      useCase: 'live-video',
      skin: 'neutral-video',
      media: 'hls',
    });
    const code = result['app/page.tsx'];

    expect(code).toContain('<NeutralLiveVideoSkin style=');
    expect(code).toContain("import '@videojs/react/live-video/neutral-skin.css'");
  });

  it('omits the skin for a headless live video player', () => {
    const result = generateReactCreateCode({ ...baseReact, useCase: 'live-video', skin: 'none', media: 'hls' });
    const code = result['app/page.tsx'];

    expect(code).toContain("import { LiveVideoPlayer } from '@videojs/react/live-video'");
    expect(code).toContain('<LiveVideoPlayer>');
    expect(code).not.toContain('LiveVideoSkin');
    expect(code).not.toContain('skin.css');
  });

  it('uses the live audio player and skin without playsInline', () => {
    const result = generateReactCreateCode({
      ...baseReact,
      useCase: 'live-audio',
      skin: 'audio',
      media: 'mux-audio',
    });
    const code = result['app/page.tsx'];

    expect(code).toContain('<LiveAudioPlayer>');
    expect(code).toContain('<LiveAudioSkin>');
    expect(code).toContain("import { LiveAudioPlayer, LiveAudioSkin } from '@videojs/react/live-audio'");
    expect(code).toContain("import { MuxAudio } from '@videojs/react/media/mux-audio'");
    expect(code).toContain("import '@videojs/react/live-audio/skin.css'");
    expect(code).not.toContain('playsInline');
    expect(code).toContain("import { MuxData } from '@videojs/react/extensions/mux-data'");
    expect(code).toContain('<MuxData />');
  });

  it('uses the neutral live audio skin component', () => {
    const result = generateReactCreateCode({
      ...baseReact,
      useCase: 'live-audio',
      skin: 'neutral-audio',
      media: 'mux-audio',
    });

    expect(result['app/page.tsx']).toContain('<NeutralLiveAudioSkin>');
  });

  it('uses background video components', () => {
    const opts: InstallationOptions = {
      ...baseReact,
      useCase: 'background-video',
      media: 'background-video',
    };
    const result = generateReactCreateCode(opts);
    const code = result['app/page.tsx'];

    expect(code).not.toContain('backgroundFeatures');
    expect(code).toContain(
      "import { BackgroundVideoPlayer, BackgroundVideoSkin, BackgroundVideo } from '@videojs/react/background'"
    );
    expect(code).toContain('<BackgroundVideoPlayer>');
    expect(code).toContain("<BackgroundVideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>");
    expect(code).toContain('<BackgroundVideo');
    expect(code).toContain("import '@videojs/react/background/skin.css'");
  });

  it('imports streaming background media from its media subpath', () => {
    const code = generateReactCreateCode({
      ...baseReact,
      useCase: 'background-video',
      media: 'hls-background-video',
    })['app/page.tsx'];

    expect(code).toContain("import { HlsBackgroundVideo } from '@videojs/react/media/hls-background-video'");
    expect(code).toContain('<HlsBackgroundVideo');
  });
});

describe('source installation code', () => {
  it('installs only the selected adapter after the registry installs the player package', () => {
    expect(generateSourceMediaInstallCode('html5-video')).toBeNull();
    expect(generateSourceMediaInstallCode('hls')?.npm).toBe('npm install @videojs/hlsjs-video');
    expect(generateSourceMediaInstallCode('mux-video')?.pnpm).toBe('pnpm add @videojs/mux-video @videojs/mux-data');
  });

  it('uses the local React skin source with the selected media adapter', () => {
    const code = generateSourceReactCreateCode({ ...baseReact, media: 'hls' })['app/page.tsx'];

    expect(code).not.toContain("'use client'");
    expect(code).toContain("import { VideoSkin } from '@/components/videojs/video/skin'");
    expect(code).toContain("import { VideoPlayer } from '@videojs/react/video'");
    expect(code).toContain("import { HlsJsVideo } from '@videojs/react/media/hlsjs-video'");
    expect(code).toContain('<HlsJsVideo src={"');
    expect(code).toContain('playsInline />');
    expect(code).toContain('export default function Page()');
    expect(code).not.toContain('@videojs/react/video/skin.css');
    expect(code).not.toContain('MyPlayer');
  });

  it('adds the selected player directly to the app page', () => {
    const code = generateSourceReactCreateCode({
      ...baseReact,
      sourceUrl: 'https://example.com/video.mp4',
    })['app/page.tsx'];

    expect(code).toContain(`<VideoPlayer>
      <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <Video src={"https://example.com/video.mp4"} playsInline />
      </VideoSkin>
    </VideoPlayer>`);
    expect(code).not.toContain('const src');
  });

  it('uses utility classes for a Tailwind source catalog', () => {
    const code = generateSourceReactCreateCode({
      ...baseReact,
      styling: 'tailwind',
    })['app/page.tsx'];

    expect(code).toContain('<VideoSkin className="aspect-video w-full">');
    expect(code).not.toContain("style={{ width: '100%', aspectRatio: '16 / 9' }}");
  });

  it('emits custom React sources as JavaScript string expressions', () => {
    const sourceUrl = 'https://example.com/video.mp4?label="quoted"&path=\\media';
    const packaged = generateReactCreateCode({ ...baseReact, sourceUrl })['app/page.tsx'];
    const source = generateSourceReactCreateCode({ ...baseReact, sourceUrl })['app/page.tsx'];

    expect(packaged).toContain(`src={${JSON.stringify(sourceUrl)}}`);
    expect(source).toContain(`src={${JSON.stringify(sourceUrl)}}`);
  });

  it('keeps the local component name stable when the Neutral catalog is selected', () => {
    const code = generateSourceReactCreateCode({ ...baseReact, skin: 'neutral-video' })['app/page.tsx'];

    expect(code).toContain("import { VideoSkin } from '@/components/videojs/video/skin'");
    expect(code).not.toContain('NeutralVideoSkin');
  });

  it('shows the exact HTML skin file, media markup, and registrations to edit', () => {
    const code = generateSourceHTMLUsageCode({ ...baseHTML, media: 'hls' });

    expect(code.skinFile).toBe('components/videojs/video/skin.html');
    expect(code.media).toContain('<hlsjs-video src=');
    expect(code.imports).toContain("import '@videojs/html/video/player'");
    expect(code.imports).toContain("import '@videojs/html/media/hlsjs-video'");
    expect(code.imports).toContain("import '@/components/videojs/video/skin'");
    expect(code.player).toMatch(/^<video-player>/);
    expect(code.player).not.toContain('<script');
  });

  it('sizes the video skin on its root container instead of the player', () => {
    const video = generateSourceHTMLUsageCode({ ...baseHTML, media: 'hls' });
    const audio = generateSourceHTMLUsageCode({ ...baseHTML, useCase: 'default-audio', media: 'html5-audio' });

    expect(video.container).toEqual({
      anchor: '<media-container',
      code: '<media-container style="display: block; width: 100%; aspect-ratio: 16 / 9;"',
    });
    expect(video.player).not.toContain('style=');
    expect(audio.container).toBeNull();
    expect(audio.player).toMatch(/^<audio-player>/);
  });
});

describe('getRendererTag', () => {
  it('names the native or custom element each renderer renders', () => {
    expect(getRendererTag('html5-video')).toBe('video');
    expect(getRendererTag('hls')).toBe('hlsjs-video');
    expect(getRendererTag('background-video')).toBe('background-video');
  });
});

describe('getRendererComponent', () => {
  it('names the React component each renderer renders', () => {
    expect(getRendererComponent('html5-video')).toBe('Video');
    expect(getRendererComponent('hls')).toBe('HlsJsVideo');
    expect(getRendererComponent('youtube')).toBe('YouTubeVideo');
  });
});

describe('getSkinTag', () => {
  it('follows the preset and skin tier', () => {
    expect(getSkinTag('default-video', 'video')).toBe('video-skin');
    expect(getSkinTag('live-audio', 'neutral-audio')).toBe('live-audio-neutral-skin');
  });

  it('always uses the background skin for background video', () => {
    expect(getSkinTag('background-video', 'neutral-video')).toBe('background-video-skin');
  });
});

describe('getSkinComponent', () => {
  it('follows the preset and skin tier', () => {
    expect(getSkinComponent('default-audio', 'audio')).toBe('AudioSkin');
    expect(getSkinComponent('live-video', 'neutral-video')).toBe('NeutralLiveVideoSkin');
  });
});
