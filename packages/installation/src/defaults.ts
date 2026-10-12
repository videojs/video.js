/** Stable demo sources used by generated installation examples. */
export const INSTALLATION_DEMO_SOURCES = {
  audio: 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/audio.m4a',
  cloudflare: 'https://watch.videodelivery.net/bfbd585059e33391d67b0f1d15fe6ea4',
  dash: 'https://dash.akamaized.net/akamai/streamroot/050714/Spring_4Ktest.mpd',
  live: 'https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8',
  spotify: 'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5',
  tiktok: 'https://www.tiktok.com/@_luwes/video/7527476667770522893',
  twitch: 'https://www.twitch.tv/videos/106400740',
  videoHls: 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM.m3u8',
  videoMp4: 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4',
  vimeo: 'https://vimeo.com/76979871',
  youtube: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
} as const;

/** The `--source-url` value that explicitly selects the demo source for the selected media. */
export const INSTALLATION_DEMO_SOURCE_URL = 'demo';

/** Media subpaths currently published by `@videojs/cdn`. */
export const CDN_MEDIA_SUBPATHS = [
  'background-video',
  'cloudflare-video',
  'dash-video',
  'hls-audio',
  'hls-background-video',
  'hls-video',
  'hlsjs-video',
  'mux-audio',
  'mux-audio/hls-js',
  'mux-audio/spf',
  'mux-background-video',
  'mux-video',
  'mux-video/hls-js',
  'mux-video/spf',
  'native-hls-video',
  'playerjs-video',
  'shaka-video',
  'spotify-audio',
  'tiktok-video',
  'twitch-video',
  'vimeo-video',
  'wistia-video',
  'youtube-video',
] as const;

export function cdnBaseForVersion(version = 'latest'): string {
  return `https://cdn.jsdelivr.net/npm/@videojs/cdn@${version}`;
}
