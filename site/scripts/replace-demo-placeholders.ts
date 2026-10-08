import type { Plugin } from 'vite';

import {
  VJS8_DEMO_VIDEO,
  VJS10_DEMO_AUDIO,
  VJS10_DEMO_BACKGROUND_VIDEO_MP4,
  VJS10_DEMO_BACKGROUND_VIDEO_POSTER,
  VJS10_DEMO_CLOUDFLARE,
  VJS10_DEMO_DASH,
  VJS10_DEMO_LIVE,
  VJS10_DEMO_PLAYERJS,
  VJS10_DEMO_POSTER,
  VJS10_DEMO_SPOTIFY,
  VJS10_DEMO_STORYBOARD,
  VJS10_DEMO_STORYBOARD_VTT,
  VJS10_DEMO_TIKTOK,
  VJS10_DEMO_TWITCH,
  VJS10_DEMO_VIDEO,
  VJS10_DEMO_VIMEO,
  VJS10_DEMO_WISTIA,
  VJS10_DEMO_YOUTUBE,
  VJS10_MULTI_AUDIO_DEMO_VIDEO,
} from '../src/consts.ts';

const DEMOS_DIRECTORY = '/src/components/docs/demos/';

const DEMO_PLACEHOLDERS = {
  VJS8_DEMO_VIDEO_HLS: VJS8_DEMO_VIDEO.hls,
  VJS10_DEMO_AUDIO_M4A: VJS10_DEMO_AUDIO,
  VJS10_DEMO_BACKGROUND_VIDEO_MP4: VJS10_DEMO_BACKGROUND_VIDEO_MP4,
  VJS10_DEMO_BACKGROUND_VIDEO_POSTER: VJS10_DEMO_BACKGROUND_VIDEO_POSTER,
  VJS10_DEMO_CLOUDFLARE: VJS10_DEMO_CLOUDFLARE,
  VJS10_DEMO_DASH: VJS10_DEMO_DASH,
  VJS10_DEMO_LIVE_HLS: VJS10_DEMO_LIVE.hls,
  VJS10_DEMO_PLAYERJS: VJS10_DEMO_PLAYERJS,
  VJS10_DEMO_POSTER: VJS10_DEMO_POSTER,
  VJS10_DEMO_SPOTIFY: VJS10_DEMO_SPOTIFY,
  VJS10_DEMO_STORYBOARD: VJS10_DEMO_STORYBOARD,
  VJS10_DEMO_STORYBOARD_VTT: VJS10_DEMO_STORYBOARD_VTT,
  VJS10_DEMO_TIKTOK: VJS10_DEMO_TIKTOK,
  VJS10_DEMO_TWITCH: VJS10_DEMO_TWITCH,
  VJS10_DEMO_VIDEO_HLS: VJS10_DEMO_VIDEO.hls,
  VJS10_DEMO_VIDEO_MP4: VJS10_DEMO_VIDEO.mp4,
  VJS10_DEMO_VIMEO: VJS10_DEMO_VIMEO,
  VJS10_DEMO_WISTIA: VJS10_DEMO_WISTIA,
  VJS10_DEMO_YOUTUBE: VJS10_DEMO_YOUTUBE,
  VJS10_MULTI_AUDIO_DEMO_VIDEO_HLS: VJS10_MULTI_AUDIO_DEMO_VIDEO.hls,
} as const;

const PLACEHOLDER_PATTERN = /{{([A-Z0-9_]+)}}/g;

/** Resolve the shared media source placeholders used in demo snippets. */
function replaceDemoPlaceholders(source: string): string {
  return source.replace(PLACEHOLDER_PATTERN, (placeholder, name: string) => {
    const value = DEMO_PLACEHOLDERS[name as keyof typeof DEMO_PLACEHOLDERS];
    if (!value) throw new Error(`Unknown demo placeholder: ${placeholder}`);

    return value;
  });
}

function transformDemoPlaceholders(source: string, id: string): string | null {
  const [filePath, query = ''] = id.split('?', 2);
  const isRawHtml = filePath.endsWith('.html') && new URLSearchParams(query).has('raw');
  const isReactDemo = filePath.endsWith('.tsx');
  if (!filePath.includes(DEMOS_DIRECTORY) || (!isRawHtml && !isReactDemo)) return null;

  return replaceDemoPlaceholders(source);
}

/** Resolve placeholders in HTML and React demos for the site build and dev server. */
export function demoPlaceholderPlugin() {
  return {
    name: 'videojs:demo-placeholders',
    enforce: 'pre',
    transform: transformDemoPlaceholders,
  } satisfies Plugin;
}
