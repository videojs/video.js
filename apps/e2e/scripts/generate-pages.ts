/**
 * Generates Vite test pages from PageEntry definitions.
 *
 * Reads the media type configs and page arrays, then writes .ts/.tsx + .html files to `suites/player/app/src/pages/`,
 * which is gitignored — every page there comes from this script, including the special ones (ejected skins, captions,
 * background video), which take their own templates rather than the player shell.
 *
 * Run: `pnpm --dir apps/e2e generate-pages`
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../suites/player/app/src/pages');
const SOURCE_VIDEO_SKIN = relative(
  OUT_DIR,
  resolve(__dirname, '../../../packages/skins/src/skins/default/video/skin.tsx')
).replaceAll('\\', '/');

// ---------------------------------------------------------------------------
// Media type config — maps media element name to its import + attributes
// ---------------------------------------------------------------------------

interface MediaTypeConfig {
  /** Custom element tag (e.g. 'hlsjs-video', 'mux-video') */
  element: string;
  /** Side-effect imports to register the element */
  imports: string[];
  /** HTML attributes on the media element */
  attrs: string;
  /** Whether a storyboard track should be included */
  hasStoryboard: boolean;
  /** Whether a poster image should be included */
  hasPoster: boolean;
  /** Whether this is an audio element */
  isAudio: boolean;
}

const MEDIA_TYPES: Record<string, MediaTypeConfig> = {
  video: {
    element: 'video',
    imports: [],
    attrs: 'playsinline crossorigin="anonymous"',
    hasStoryboard: true,
    hasPoster: true,
    isAudio: false,
  },
  'hlsjs-video': {
    element: 'hlsjs-video',
    imports: ['@videojs/html/media/hlsjs-video'],
    attrs: 'playsinline crossorigin="anonymous"',
    hasStoryboard: true,
    hasPoster: true,
    isAudio: false,
  },
  'hls-video': {
    element: 'hls-video',
    imports: ['@videojs/html/media/hls-video'],
    attrs: 'playsinline crossorigin="anonymous" preload="metadata"',
    hasStoryboard: true,
    hasPoster: true,
    isAudio: false,
  },
  'native-hls-video': {
    element: 'native-hls-video',
    imports: ['@videojs/html/media/native-hls-video'],
    attrs: 'playsinline crossorigin="anonymous"',
    hasStoryboard: true,
    hasPoster: true,
    isAudio: false,
  },
  'mux-video': {
    element: 'mux-video',
    imports: ['@videojs/html/media/mux-video'],
    attrs: 'playsinline crossorigin="anonymous"',
    hasStoryboard: true,
    hasPoster: true,
    isAudio: false,
  },
  'dash-video': {
    element: 'dash-video',
    imports: ['@videojs/html/media/dash-video'],
    attrs: 'playsinline',
    hasStoryboard: false,
    hasPoster: false,
    isAudio: false,
  },
  'shaka-video': {
    element: 'shaka-video',
    imports: ['@videojs/html/media/shaka-video'],
    attrs: 'playsinline',
    hasStoryboard: false,
    hasPoster: true,
    isAudio: false,
  },
  audio: {
    element: 'audio',
    imports: [],
    attrs: '',
    hasStoryboard: false,
    hasPoster: false,
    isAudio: true,
  },
  'mux-audio': {
    element: 'mux-audio',
    imports: ['@videojs/html/media/mux-audio'],
    attrs: 'crossorigin="anonymous"',
    hasStoryboard: false,
    hasPoster: false,
    isAudio: true,
  },
  // Rendered by the `background` category templates rather than the player ones:
  // this element has no controls to hang on a skin. The entry exists because
  // every page looks its media type up here.
  'hls-background-video': {
    element: 'hls-background-video',
    imports: ['@videojs/html/media/hls-background-video'],
    attrs: '',
    hasStoryboard: false,
    hasPoster: false,
    isAudio: false,
  },
};

// React component names for media elements
const REACT_MEDIA: Record<string, { component: string; importPath: string }> = {
  video: { component: 'Video', importPath: '@videojs/react/video' },
  'hlsjs-video': { component: 'HlsJsVideo', importPath: '@videojs/react/media/hlsjs-video' },
  'shaka-video': { component: 'ShakaVideo', importPath: '@videojs/react/media/shaka-video' },
  audio: { component: 'Audio', importPath: '@videojs/react/audio' },
  'hls-background-video': {
    component: 'HlsBackgroundVideo',
    importPath: '@videojs/react/media/hls-background-video',
  },
};

// CDN import paths (override standard imports)
const CDN_IMPORTS: Record<string, string[]> = {
  video: ['@videojs/cdn/video'],
  'hlsjs-video': ['@videojs/cdn/video', '@videojs/cdn/media/hlsjs-video'],
};

// ---------------------------------------------------------------------------
// Page entry type (matches fixtures/media.ts)
// ---------------------------------------------------------------------------

interface PageDef {
  name: string;
  path: string;
  framework: 'html' | 'react';
  media: string;
  resource: string;
  category?: 'cdn' | 'captions' | 'background' | 'background-preset' | 'source-html' | 'source-react';
  /** The packaged skin theme; the default skin unless set. */
  skin?: 'neutral';
}

type SkinTheme = NonNullable<PageDef['skin']> | 'default';

/** The custom element a packaged HTML skin registers. */
function htmlSkinTag(media: 'video' | 'audio', skin: SkinTheme): string {
  return skin === 'neutral' ? `${media}-neutral-skin` : `${media}-skin`;
}

/** The entry a packaged skin ships under for both frameworks, as `video/skin` or `video/neutral-skin`. */
function skinEntry(media: 'video' | 'audio', skin: SkinTheme): string {
  return skin === 'neutral' ? `${media}/neutral-skin` : `${media}/skin`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function htmlShell(title: string, scriptSrc: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${scriptSrc}"></script>
  </body>
</html>
`;
}

function resourceHasPoster(resource: string): boolean {
  return resource === 'mp4' || resource === 'hlsTs' || resource === 'hlsFmp4';
}

function htmlVideoPage(config: MediaTypeConfig, resource: string, imports: string[], skin: SkinTheme): string {
  const allImports = [...imports, `import { MEDIA } from '../resources';`].join('\n');
  const tag = htmlSkinTag('video', skin);

  const storyboard = config.hasStoryboard
    ? `\n        <track kind="metadata" label="thumbnails" src="\${MEDIA.${resource}.storyboard}" default />`
    : '';

  const poster =
    config.hasPoster && resourceHasPoster(resource)
      ? `\n      <img slot="poster" src="\${MEDIA.${resource}.poster}" alt="Video poster" />`
      : '';

  const attrs = config.attrs ? ` ${config.attrs}` : '';

  return `${allImports}

const html = String.raw;

document.getElementById('root')!.innerHTML = html\`
  <video-player>
    <${tag} style="max-width: 800px; aspect-ratio: 16/9">
      <${config.element} src="\${MEDIA.${resource}.url}"${attrs}>${storyboard}
      </${config.element}>${poster}
    </${tag}>
  </video-player>
\`;
`;
}

function htmlAudioPage(config: MediaTypeConfig, resource: string, imports: string[], skin: SkinTheme): string {
  const allImports = [...imports, `import { MEDIA } from '../resources';`].join('\n');
  const attrs = config.attrs ? ` ${config.attrs}` : '';
  const tag = htmlSkinTag('audio', skin);

  return `${allImports}

const html = String.raw;

document.getElementById('root')!.innerHTML = html\`
  <div style="max-width: 600px; margin: 0 auto">
    <audio-player>
      <${tag}>
        <${config.element} src="\${MEDIA.${resource}.url}"${attrs}></${config.element}>
      </${tag}>
    </audio-player>
  </div>
\`;
`;
}

function reactVideoPage(media: string, resource: string, config: MediaTypeConfig, skin: SkinTheme): string {
  const reactMedia = REACT_MEDIA[media];
  if (!reactMedia) throw new Error(`No React component mapping for media type: ${media}`);

  const isDefaultVideo = media === 'video';
  const Skin = skin === 'neutral' ? 'NeutralVideoSkin' : 'VideoSkin';
  const skinImport =
    skin === 'neutral' ? `\nimport { NeutralVideoSkin } from '@videojs/react/video/neutral-skin';` : '';
  const mediaImport = isDefaultVideo
    ? `import { Video, VideoPlayer${skin === 'neutral' ? '' : ', VideoSkin'} } from '@videojs/react/video';${skinImport}`
    : `import { ${reactMedia.component} } from '${reactMedia.importPath}';\nimport { VideoPlayer${skin === 'neutral' ? '' : ', VideoSkin'} } from '@videojs/react/video';${skinImport}`;

  const posterProp = config.hasPoster && resourceHasPoster(resource) ? ` poster={MEDIA.${resource}.poster}` : '';
  const storyboardTrack = config.hasStoryboard
    ? `\n          <track kind="metadata" label="thumbnails" src={MEDIA.${resource}.storyboard} default />`
    : '';

  return `${mediaImport}
import '@videojs/react/${skinEntry('video', skin)}.css';
import { createRoot } from 'react-dom/client';
import { MEDIA } from '../resources';

function App() {
  return (
    <VideoPlayer${posterProp}>
      <${Skin} style={{ maxWidth: 800, aspectRatio: '16/9' }}>
        <${reactMedia.component} src={MEDIA.${resource}.url} playsInline crossOrigin="anonymous">${storyboardTrack}
        </${reactMedia.component}>
      </${Skin}>
    </VideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
`;
}

function reactAudioPage(media: string, resource: string, skin: SkinTheme): string {
  const reactMedia = REACT_MEDIA[media];
  if (!reactMedia) throw new Error(`No React component mapping for media type: ${media}`);

  const isDefaultAudio = media === 'audio';
  const Skin = skin === 'neutral' ? 'NeutralAudioSkin' : 'AudioSkin';
  const skinImport =
    skin === 'neutral' ? `\nimport { NeutralAudioSkin } from '@videojs/react/audio/neutral-skin';` : '';
  const mediaImport = isDefaultAudio
    ? `import { Audio, AudioPlayer${skin === 'neutral' ? '' : ', AudioSkin'} } from '@videojs/react/audio';${skinImport}`
    : `import { ${reactMedia.component} } from '${reactMedia.importPath}';\nimport { AudioPlayer${skin === 'neutral' ? '' : ', AudioSkin'} } from '@videojs/react/audio';${skinImport}`;

  return `${mediaImport}
import '@videojs/react/${skinEntry('audio', skin)}.css';
import { createRoot } from 'react-dom/client';
import { MEDIA } from '../resources';

function App() {
  return (
    <AudioPlayer>
      <${Skin} style={{ maxWidth: 600, margin: '0 auto' }}>
        <${reactMedia.component} src={MEDIA.${resource}.url} />
      </${Skin}>
    </AudioPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
`;
}

// ---------------------------------------------------------------------------
// Special page templates (captions, ejected skins, background video)
// ---------------------------------------------------------------------------

/**
 * The SPF background-video Media, alone rather than inside a player: the composition subscribes to no store features
 * and has no controls, so a skin would only add moving parts to what the spec is measuring.
 *
 * `?src=` picks the source, so one page serves every shape `spf-background-video.spec.ts` drives — playable, MPEG-TS,
 * encrypted, audio-only — and a test can compare two of them without a page each. Assigned as a property rather than
 * interpolated into markup, since the DRM source carries a signed-URL query string.
 */
function backgroundVideoPage(config: MediaTypeConfig, resource: string): string {
  return `${config.imports.map((imp) => `import '${imp}';`).join('\n')}
import { MEDIA } from '../resources';

const src = new URLSearchParams(window.location.search).get('src') ?? MEDIA.${resource}.url;

const media = document.createElement('${config.element}') as HTMLElement & { src: string };
media.src = src;
// Viewport units rather than percentages: the shared page shell's #root has no
// height of its own, and a background video that lays out at zero is one an
// engine may treat as offscreen.
media.style.width = '100vw';
media.style.height = '100vh';

document.getElementById('root')!.append(media);
`;
}

/**
 * The React counterpart, and the only place `onError` can be observed: the component hands out no reference to its
 * Media, so what a consumer sees is whatever React's own event plumbing delivers. Failures are counted onto `window`
 * rather than rendered — the assertion is that the prop fired at all, since the condition behind it isn't reachable
 * from here by design.
 */
function reactBackgroundVideoPage(media: string, resource: string): string {
  const reactMedia = REACT_MEDIA[media];
  if (!reactMedia) throw new Error(`No React component mapping for media type: ${media}`);

  return `import { ${reactMedia.component} } from '${reactMedia.importPath}';
import { createRoot } from 'react-dom/client';
import { MEDIA } from '../resources';

declare global {
  interface Window {
    __backgroundVideoErrors: number;
  }
}

window.__backgroundVideoErrors = 0;

const src = new URLSearchParams(window.location.search).get('src') ?? MEDIA.${resource}.url;

function App() {
  return (
    <${reactMedia.component}
      src={src}
      style={{ width: '100vw', height: '100vh' }}
      onError={() => {
        window.__backgroundVideoErrors += 1;
      }}
    />
  );
}

createRoot(document.getElementById('root')!).render(<App />);
`;
}

/** The handwritten Background preset, kept separate from the engine-only fixtures above. */
function backgroundPresetPage(framework: PageDef['framework'], resource: string): string {
  if (framework === 'react') {
    return `import {
  BackgroundVideo,
  BackgroundVideoPlayer,
  BackgroundVideoSkin,
} from '@videojs/react/background';
import '@videojs/react/background/skin.css';
import { createRoot } from 'react-dom/client';
import { MEDIA } from '../resources';

function App() {
  return (
    <BackgroundVideoPlayer>
      <BackgroundVideoSkin
        className="background-preset"
        style={{ width: 640, height: 360, objectFit: 'contain' }}
      >
        <img alt="" data-background-poster src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />
        <BackgroundVideo data-background-media src={MEDIA.${resource}.url} />
      </BackgroundVideoSkin>
    </BackgroundVideoPlayer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
`;
  }

  return `import '@videojs/html/background/player';
import '@videojs/html/background/skin';
import '@videojs/html/background/video';
import { MEDIA } from '../resources';

document.getElementById('root')!.innerHTML = String.raw\`
  <background-video-player>
    <background-video-skin
      class="background-preset"
      style="width: 640px; height: 360px; --media-object-fit: contain"
    >
      <img alt="" data-background-poster src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />
      <background-video data-background-media src="\${MEDIA.${resource}.url}"></background-video>
    </background-video-skin>
  </background-video-player>
\`;
`;
}

function captionsPage(resource: string): string {
  const captionVtt = 'WEBVTT\\n\\n00:00:00.000 --> 00:00:30.000\\nThis is a test caption';

  return `import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import { MEDIA } from '../resources';

const html = String.raw;

const captionVtt = encodeURIComponent('${captionVtt}');

document.getElementById('root')!.innerHTML = html\`
  <video-player>
    <video-skin style="max-width: 800px; aspect-ratio: 16/9">
      <video src="\${MEDIA.${resource}.url}" playsinline crossorigin="anonymous">
        <track kind="metadata" label="thumbnails" src="\${MEDIA.${resource}.storyboard}" default />
        <track kind="subtitles" label="English" srclang="en" src="data:text/vtt,\${captionVtt}" />
      </video>
      <img slot="poster" src="\${MEDIA.${resource}.poster}" alt="Video poster" />
    </video-skin>
  </video-player>
\`;
`;
}

function sourceHtmlPage(resource: string): string {
  return `import '@videojs/html/video/player';
import { VideoSkin } from '${SOURCE_VIDEO_SKIN}?style=css&target=html&skin=default-video&theme=default';
import { MEDIA } from '../resources';

const skin = String(
  VideoSkin({
    'data-source-skin': '',
    poster: MEDIA.${resource}.poster,
    style: 'display: block; max-width: 800px; aspect-ratio: 16/9',
  })
).replace(
  '<slot></slot>',
  \`<video src="\${MEDIA.${resource}.url}" playsinline muted crossorigin="anonymous"></video>\`
);

document.getElementById('root')!.innerHTML = \`<video-player poster="\${MEDIA.${resource}.poster}">\${skin}</video-player>\`;
`;
}

function sourceReactPage(resource: string): string {
  return `import { createPlayer } from '@videojs/react';
import { Video, videoFeatures } from '@videojs/react/video';
import { createRoot } from 'react-dom/client';
import { VideoSkin } from '${SOURCE_VIDEO_SKIN}?style=css&target=react&skin=default-video&theme=default';
import { MEDIA } from '../resources';

const { Player } = createPlayer({ features: videoFeatures });

function App() {
  return (
    <Player poster={MEDIA.${resource}.poster}>
      <VideoSkin
        data-source-skin
        poster={MEDIA.${resource}.poster}
        style={{ maxWidth: 800, aspectRatio: '16/9' }}
      >
        <Video src={MEDIA.${resource}.url} playsInline muted crossOrigin="anonymous" />
      </VideoSkin>
    </Player>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
`;
}

// ---------------------------------------------------------------------------
// Page definitions (drive generation from here)
// ---------------------------------------------------------------------------

const PAGES: PageDef[] = [
  // HTML Video
  { name: 'HTML Video MP4', path: 'html-video-mp4', framework: 'html', media: 'video', resource: 'mp4' },
  { name: 'HTML Video HLS', path: 'html-video-hls', framework: 'html', media: 'hlsjs-video', resource: 'hlsTs' },
  {
    name: 'HTML HLS Video fMP4',
    path: 'html-hls-video-fmp4',
    framework: 'html',
    media: 'hls-video',
    resource: 'hlsFmp4',
  },
  // A source the SPF engine cannot play: MPEG-TS segments, with no fMP4
  // rendition to fall back to. Deliberately absent from `fixtures/media.ts`'s
  // page arrays — the parameterized playback suites would all fail on it. Only
  // `spf-unsupported-source.spec.ts` uses it.
  {
    name: 'HTML HLS Video TS',
    path: 'html-hls-video-ts',
    framework: 'html',
    media: 'hls-video',
    resource: 'hlsTs',
  },
  // The SPF background-video composition, driven by `spf-background-video.spec.ts`
  // alone: `?src=` swaps the source per test, so these carry a playable default
  // and stay out of `fixtures/media.ts`'s page arrays — the parameterized
  // playback suites all assume a player with controls.
  {
    name: 'HTML HLS Background Video',
    path: 'html-hls-background-video',
    framework: 'html',
    media: 'hls-background-video',
    resource: 'hlsFmp4',
    category: 'background',
  },
  {
    name: 'React HLS Background Video',
    path: 'react-hls-background-video',
    framework: 'react',
    media: 'hls-background-video',
    resource: 'hlsFmp4',
    category: 'background',
  },
  {
    name: 'HTML Background Preset',
    path: 'html-background-preset',
    framework: 'html',
    media: 'hls-background-video',
    resource: 'mp4',
    category: 'background-preset',
  },
  {
    name: 'React Background Preset',
    path: 'react-background-preset',
    framework: 'react',
    media: 'hls-background-video',
    resource: 'mp4',
    category: 'background-preset',
  },
  { name: 'HTML DASH Video', path: 'html-dash-video', framework: 'html', media: 'dash-video', resource: 'dash' },
  {
    name: 'HTML Shaka Video HLS',
    path: 'html-shaka-video-hls',
    framework: 'html',
    media: 'shaka-video',
    resource: 'hlsTs',
  },
  {
    name: 'HTML Shaka Video DASH',
    path: 'html-shaka-video-dash',
    framework: 'html',
    media: 'shaka-video',
    resource: 'dash',
  },
  {
    name: 'HTML Native HLS Video',
    path: 'html-native-hls-video',
    framework: 'html',
    media: 'native-hls-video',
    resource: 'hlsTs',
  },
  { name: 'HTML Mux Video', path: 'html-mux-video', framework: 'html', media: 'mux-video', resource: 'hlsTs' },

  // HTML Audio
  { name: 'HTML Audio MP4', path: 'html-audio-mp4', framework: 'html', media: 'audio', resource: 'mp4' },
  { name: 'HTML Mux Audio', path: 'html-mux-audio', framework: 'html', media: 'mux-audio', resource: 'hlsTs' },

  // React Video
  { name: 'React Video MP4', path: 'react-video-mp4', framework: 'react', media: 'video', resource: 'mp4' },
  { name: 'React Video HLS', path: 'react-video-hls', framework: 'react', media: 'hlsjs-video', resource: 'hlsTs' },
  {
    name: 'React Shaka Video HLS',
    path: 'react-shaka-video-hls',
    framework: 'react',
    media: 'shaka-video',
    resource: 'hlsTs',
  },

  // React Audio
  { name: 'React Audio MP4', path: 'react-audio-mp4', framework: 'react', media: 'audio', resource: 'mp4' },

  // Neutral skins, for the layout snapshots
  {
    name: 'HTML Video Neutral MP4',
    path: 'html-video-neutral-mp4',
    framework: 'html',
    media: 'video',
    resource: 'mp4',
    skin: 'neutral',
  },
  {
    name: 'React Video Neutral MP4',
    path: 'react-video-neutral-mp4',
    framework: 'react',
    media: 'video',
    resource: 'mp4',
    skin: 'neutral',
  },
  {
    name: 'HTML Audio Neutral MP4',
    path: 'html-audio-neutral-mp4',
    framework: 'html',
    media: 'audio',
    resource: 'mp4',
    skin: 'neutral',
  },
  {
    name: 'React Audio Neutral MP4',
    path: 'react-audio-neutral-mp4',
    framework: 'react',
    media: 'audio',
    resource: 'mp4',
    skin: 'neutral',
  },

  // CDN
  { name: 'CDN Video MP4', path: 'cdn-video-mp4', framework: 'html', media: 'video', resource: 'mp4', category: 'cdn' },
  {
    name: 'CDN Video HLS',
    path: 'cdn-video-hls',
    framework: 'html',
    media: 'hlsjs-video',
    resource: 'hlsTs',
    category: 'cdn',
  },

  // Captions
  {
    name: 'HTML Video Captions',
    path: 'html-video-captions',
    framework: 'html',
    media: 'video',
    resource: 'mp4',
    category: 'captions',
  },

  // Generated canonical Skin fixtures for focused container/parity coverage.
  {
    name: 'Source HTML Video MP4',
    path: 'source-html-video-mp4',
    framework: 'html',
    media: 'video',
    resource: 'mp4',
    category: 'source-html',
  },
  {
    name: 'Source React Video MP4',
    path: 'source-react-video-mp4',
    framework: 'react',
    media: 'video',
    resource: 'mp4',
    category: 'source-react',
  },
];

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

function getImports(page: PageDef, config: MediaTypeConfig): string[] {
  if (page.category === 'cdn') {
    const cdnImports = CDN_IMPORTS[page.media];
    if (!cdnImports) throw new Error(`No CDN imports for media type: ${page.media}`);

    return cdnImports.map((i) => `import '${i}';`);
  }

  const playerType = config.isAudio ? 'audio' : 'video';
  const base = [
    `import '@videojs/html/${playerType}/player';`,
    `import '@videojs/html/${skinEntry(playerType, page.skin ?? 'default')}';`,
  ];

  for (const imp of config.imports) {
    base.push(`import '${imp}';`);
  }

  return base;
}

function generatePage(page: PageDef): { ts: string; html: string; ext: string } {
  const config = MEDIA_TYPES[page.media];
  if (!config) throw new Error(`Unknown media type: ${page.media}`);

  const ext = page.framework === 'react' ? 'tsx' : 'ts';

  let ts: string;

  // Special category pages
  if (page.category === 'background') {
    ts =
      page.framework === 'react'
        ? reactBackgroundVideoPage(page.media, page.resource)
        : backgroundVideoPage(config, page.resource);
  } else if (page.category === 'background-preset') {
    ts = backgroundPresetPage(page.framework, page.resource);
  } else if (page.category === 'captions') {
    ts = captionsPage(page.resource);
  } else if (page.category === 'source-html') {
    ts = sourceHtmlPage(page.resource);
  } else if (page.category === 'source-react') {
    ts = sourceReactPage(page.resource);
  } else if (page.framework === 'react') {
    ts = config.isAudio
      ? reactAudioPage(page.media, page.resource, page.skin ?? 'default')
      : reactVideoPage(page.media, page.resource, config, page.skin ?? 'default');
  } else {
    const imports = getImports(page, config);
    const skin = page.skin ?? 'default';

    ts = config.isAudio
      ? htmlAudioPage(config, page.resource, imports, skin)
      : htmlVideoPage(config, page.resource, imports, skin);
  }

  const html = htmlShell(page.name, `${page.path}.${ext}`);

  return { ts, html, ext };
}

function generateIndexHtml(pages: PageDef[]): string {
  const noCategory = (p: PageDef) => !p.category;

  const htmlVideo = pages.filter((p) => p.framework === 'html' && !MEDIA_TYPES[p.media]?.isAudio && noCategory(p));
  const htmlAudio = pages.filter((p) => p.framework === 'html' && MEDIA_TYPES[p.media]?.isAudio && noCategory(p));
  const reactVideo = pages.filter((p) => p.framework === 'react' && !MEDIA_TYPES[p.media]?.isAudio && noCategory(p));
  const reactAudio = pages.filter((p) => p.framework === 'react' && MEDIA_TYPES[p.media]?.isAudio && noCategory(p));

  const cdn = pages.filter((p) => p.category === 'cdn');
  const ejected = pages.filter((p) => p.category?.startsWith('ejected'));
  const captions = pages.filter((p) => p.category === 'captions');
  const source = pages.filter((p) => p.category?.startsWith('source-'));

  function list(entries: PageDef[]): string {
    return entries.map((p) => `        <li><a href="/pages/${p.path}.html">${p.name}</a></li>`).join('\n');
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Video.js E2E Test Pages</title>
  </head>
  <body>
    <h1>Video.js E2E Test Pages</h1>
    <nav>
      <h2>HTML (Web Components)</h2>
      <ul>
${list(htmlVideo)}
${list(htmlAudio)}
${list(captions)}
      </ul>
      <h2>React</h2>
      <ul>
${list(reactVideo)}
${list(reactAudio)}
      </ul>
      <h2>Ejected Skins</h2>
      <ul>
${list(ejected)}
      </ul>
      <h2>CDN Bundles</h2>
      <ul>
${list(cdn)}
      </ul>
      <h2>Generated Canonical Skins</h2>
      <ul>
${list(source)}
      </ul>
    </nav>
  </body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('[generate-pages] Generating Vite test pages...');

// The pages directory is wholly generated; clearing it drops pages whose names changed.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

let count = 0;

for (const page of PAGES) {
  const { ts, html, ext } = generatePage(page);

  writeFileSync(resolve(OUT_DIR, `${page.path}.${ext}`), ts);
  writeFileSync(resolve(OUT_DIR, `${page.path}.html`), html);
  count++;
}

// Generate index.html in src/ (not pages/)
const srcDir = resolve(OUT_DIR, '..');

writeFileSync(resolve(srcDir, 'index.html'), generateIndexHtml(PAGES));

console.log(`[generate-pages] Generated ${count} pages + index.html`);
