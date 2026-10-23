/**
 * Coding tasks for the docs MCP eval. Each task seeds a tiny project, asks a coding agent for one Video.js 10 change,
 * and grades the files it changed. Assertions accept any correct v10 solution; they reject the Video.js 8 patterns
 * agents fall back to when they lack current docs.
 */
import { readFileSync } from 'node:fs';

export type EvalFramework = 'html' | 'react';

export interface EvalAssertion {
  pattern: RegExp;
  /** Why the pattern matters, reported when the assertion fails. */
  reason: string;
}

/** Project files keyed by path relative to the project root. */
export type ProjectFiles = Record<string, string>;

export interface EvalTask {
  id: string;
  framework: EvalFramework;
  /** What a developer would type into a coding agent. */
  prompt: string;
  /** Project files seeded before the agent runs. */
  fixture: ProjectFiles;
  /** Every pattern must match the changed source files. */
  mustMatch: EvalAssertion[];
  /** No pattern may match the changed source files. */
  mustNotMatch: EvalAssertion[];
}

interface PackageManifest {
  version: string;
}

function workspaceVersion(packageName: 'html' | 'react'): string {
  // SAFETY: workspace manifests are validated by `pnpm check:workspace`; only `version` is read.
  const manifest = JSON.parse(
    readFileSync(new URL(`../../../packages/${packageName}/package.json`, import.meta.url), 'utf8')
  ) as PackageManifest;

  return manifest.version;
}

const REACT_VERSION = workspaceVersion('react');
const HTML_VERSION = workspaceVersion('html');

/** The `package.json` fields a fixture project declares. */
interface FixtureManifest {
  name: string;
  private: true;
  type: 'module';
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

function packageJson(manifest: FixtureManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function reactPackageJson(extraDependencies: Record<string, string> = {}): string {
  return packageJson({
    name: 'eval-app',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'tsc -b && vite build' },
    dependencies: {
      '@videojs/react': REACT_VERSION,
      react: '^19.2.0',
      'react-dom': '^19.2.0',
      ...extraDependencies,
    },
    devDependencies: {
      '@types/react': '^19.2.0',
      '@types/react-dom': '^19.2.0',
      '@vitejs/plugin-react': '^5.1.0',
      typescript: '^5.9.0',
      vite: '^7.2.0',
    },
  });
}

const HTML_PACKAGE_JSON = packageJson({
  name: 'eval-site',
  private: true,
  type: 'module',
  scripts: { dev: 'vite', build: 'vite build' },
  dependencies: { '@videojs/html': HTML_VERSION },
  devDependencies: { typescript: '^5.9.0', vite: '^7.2.0' },
});

const REACT_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Eval App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const REACT_MAIN = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

const REACT_EMPTY_APP = `export default function App() {
  return (
    <main>
      <h1>Welcome</h1>
    </main>
  );
}
`;

function reactProject(app = REACT_EMPTY_APP, extraFiles: ProjectFiles = {}) {
  return {
    'package.json': reactPackageJson(),
    'index.html': REACT_INDEX_HTML,
    'src/main.tsx': REACT_MAIN,
    'src/App.tsx': app,
    ...extraFiles,
  } satisfies ProjectFiles;
}

function htmlPage(body: string, head = ''): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Eval Site</title>${head}
  </head>
  <body>
${body}
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

function htmlProject(body: string, main = "import './style.css';\n") {
  return {
    'package.json': HTML_PACKAGE_JSON,
    'index.html': htmlPage(body),
    'src/main.ts': main,
    'src/style.css': 'body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}\n',
  } satisfies ProjectFiles;
}

/** A working v10 React player, as `agents init` generates it, for tasks that change an existing player. */
const REACT_V10_APP = `import '@videojs/react/video/skin.css';
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';

export default function App() {
  return (
    <main>
      <h1>Product tour</h1>
      <VideoPlayer>
        <VideoSkin style={{ width: '100%', aspectRatio: '16 / 9' }}>
          <Video src="/media/tour.mp4" playsInline />
        </VideoSkin>
      </VideoPlayer>
    </main>
  );
}
`;

/** A working v10 HTML player, as `agents init` generates it, for tasks that change an existing player. */
const HTML_V10_BODY = `    <h1>Launch event</h1>
    <video-player>
      <video-skin style="display: block; width: 100%; aspect-ratio: 16 / 9;">
        <video src="/media/keynote.mp4" playsinline></video>
      </video-skin>
    </video-player>`;

const HTML_V10_MAIN = `import './style.css';
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
`;

// Video.js 8 patterns. A v10 solution contains none of them.
const NO_VIDEOJS_CALL: EvalAssertion = {
  pattern: /\bvideojs\s*\(/,
  reason: 'calls the Video.js 8 `videojs()` factory',
};
const NO_V8_PACKAGE_IMPORT: EvalAssertion = {
  pattern: /from\s+['"]video\.js(?:\/[^'"]*)?['"]|import\s+['"]video\.js(?:\/[^'"]*)?['"]/,
  reason: 'imports the `video.js` package, which holds no v10 player',
};
const NO_V8_CSS: EvalAssertion = { pattern: /video-js(?:\.min)?\.css/, reason: 'loads the Video.js 8 stylesheet' };
const NO_DATA_SETUP: EvalAssertion = { pattern: /\bdata-setup\b/, reason: 'uses Video.js 8 `data-setup`' };
const NO_V8_CLASSES: EvalAssertion = {
  pattern: /class(?:Name)?=["'{`][^"'}`]*\b(?:video-js|vjs-[\w-]+)/,
  reason: 'uses Video.js 8 `video-js`/`vjs-*` classes',
};
const NO_V8_SELECTORS: EvalAssertion = { pattern: /\.vjs-[\w-]+/, reason: 'styles Video.js 8 `.vjs-*` selectors' };
const NO_ZENCDN: EvalAssertion = { pattern: /vjs\.zencdn\.net/, reason: 'loads Video.js 8 from vjs.zencdn.net' };

const V8_PATTERNS = [NO_VIDEOJS_CALL, NO_V8_PACKAGE_IMPORT, NO_V8_CSS, NO_DATA_SETUP, NO_V8_CLASSES, NO_ZENCDN];

const USES_REACT_PACKAGE: EvalAssertion = {
  pattern: /from\s+['"]@videojs\/react(?:\/[^'"]*)?['"]/,
  reason: 'imports from `@videojs/react`',
};
const USES_HTML_PACKAGE: EvalAssertion = {
  pattern: /['"]@videojs\/html\/[^'"]+['"]/,
  reason: 'imports a `@videojs/html` entry point',
};
const REACT_VIDEO_PLAYER: EvalAssertion = {
  pattern: /<(?:VideoPlayer|Player)(?=[\s/>])/,
  reason: 'renders `<VideoPlayer>` or the `Player` that `createPlayer` returns',
};
const IMPORTS_REACT_VIDEO_PLAYER: EvalAssertion = {
  pattern: /import\s*\{[^}]*\b(?:VideoPlayer|createPlayer)\b[^}]*\}\s*from\s*['"]@videojs\/react(?:\/[\w-]+)?['"]/,
  reason: 'imports `VideoPlayer` or `createPlayer` from `@videojs/react`',
};
// `createPlayer()` returns `{ Player, usePlayer, useMedia }`; agents without docs guess other names, such as `Provider`.
const CREATE_PLAYER_WITHOUT_PLAYER: EvalAssertion = {
  pattern: /\{(?![^}]*\bPlayer\b)[^}]*\}\s*=\s*createPlayer\s*\(/,
  reason: 'destructures `createPlayer()` without the `Player` it returns',
};
const REACT_PATTERNS = [...V8_PATTERNS, CREATE_PLAYER_WITHOUT_PLAYER];
const HTML_VIDEO_PLAYER: EvalAssertion = {
  pattern: /<video-player(?=[\s>])/,
  reason: 'renders `<video-player>`',
};

const V8_HTML_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Course lesson</title>
    <link href="https://vjs.zencdn.net/8.23.6/video-js.css" rel="stylesheet" />
  </head>
  <body>
    <h1>Lesson 1</h1>
    <video
      id="lesson-video"
      class="video-js vjs-big-play-centered"
      controls
      preload="auto"
      width="960"
      height="540"
      poster="/images/lesson-1.jpg"
      data-setup='{"playbackRates": [1, 1.5, 2]}'
    >
      <source src="/media/lesson-1.mp4" type="video/mp4" />
      <track kind="captions" src="/captions/lesson-1.en.vtt" srclang="en" label="English" default />
    </video>
    <script src="https://vjs.zencdn.net/8.23.6/video.min.js"></script>
    <script>
      var player = videojs('lesson-video');
      player.on('ended', function () {
        console.log('Lesson finished');
      });
    </script>
  </body>
</html>
`;

const V8_REACT_PLAYER = `import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);

  useEffect(() => {
    if (!containerRef.current || playerRef.current) return;

    const element = document.createElement('video-js');
    element.classList.add('vjs-big-play-centered');
    containerRef.current.appendChild(element);

    playerRef.current = videojs(element, {
      controls: true,
      fluid: true,
      preload: 'auto',
      poster,
      sources: [{ src, type: 'application/x-mpegURL' }],
    });

    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [src, poster]);

  return <div data-vjs-player ref={containerRef} />;
}
`;

const V8_REACT_APP = `import { VideoPlayer } from './VideoPlayer';

export default function App() {
  return (
    <main>
      <h1>Webinar replay</h1>
      <VideoPlayer src="https://example.com/webinar/master.m3u8" poster="/images/webinar.jpg" />
    </main>
  );
}
`;

export const TASKS: readonly EvalTask[] = [
  {
    id: 'react-mux-hls',
    framework: 'react',
    prompt:
      'Add a Video.js 10 video player to src/App.tsx, below the heading, that plays the HLS stream https://stream.mux.com/qxb01i6T202018GFS02vp9RIe01icTcDCjVzQpmaB00CUisJ4.m3u8 with the default skin.',
    fixture: reactProject(),
    mustMatch: [
      USES_REACT_PACKAGE,
      REACT_VIDEO_PLAYER,
      {
        pattern: /\b(?:MuxVideo|HlsJsVideo|HlsVideo|NativeHlsVideo)\b/,
        reason: 'uses an HLS-capable media component (`MuxVideo`, `HlsJsVideo`, `HlsVideo`, or `NativeHlsVideo`)',
      },
      { pattern: /qxb01i6T202018GFS02vp9RIe01icTcDCjVzQpmaB00CUisJ4/, reason: 'keeps the requested stream' },
    ],
    mustNotMatch: REACT_PATTERNS,
  },
  {
    id: 'html-packaged-player',
    framework: 'html',
    prompt:
      'This is a Vite site that installs Video.js 10 from npm. Add a video player with the default skin to index.html, under the heading, that plays /media/intro.mp4.',
    fixture: htmlProject('    <h1>About us</h1>'),
    mustMatch: [
      USES_HTML_PACKAGE,
      HTML_VIDEO_PLAYER,
      { pattern: /<video-(?:[\w-]+-)?skin(?=[\s>])/, reason: 'renders a video skin element' },
      { pattern: /\/media\/intro\.mp4/, reason: 'plays the requested file' },
    ],
    mustNotMatch: V8_PATTERNS,
  },
  {
    id: 'cdn-html-player',
    framework: 'html',
    prompt:
      'Add a Video.js 10 video player with the default skin to this static index.html page. There is no build step or npm, so load Video.js from a CDN. Play /media/intro.mp4.',
    fixture: {
      'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Static page</title>
  </head>
  <body>
    <h1>Our story</h1>
  </body>
</html>
`,
    },
    mustMatch: [
      { pattern: /@videojs\/cdn/, reason: 'loads the `@videojs/cdn` bundle' },
      HTML_VIDEO_PLAYER,
      { pattern: /<video-(?:[\w-]+-)?skin(?=[\s>])/, reason: 'renders a video skin element' },
      { pattern: /\/media\/intro\.mp4/, reason: 'plays the requested file' },
    ],
    mustNotMatch: [...V8_PATTERNS, { pattern: /video\.min\.js/, reason: 'loads the Video.js 8 script' }],
  },
  {
    id: 'migrate-v8-html',
    framework: 'html',
    prompt:
      'Migrate index.html from Video.js 8 to Video.js 10. Keep the poster, the captions track, and the ended log. Use the npm package; the project builds with Vite.',
    fixture: {
      'package.json': HTML_PACKAGE_JSON,
      'index.html': V8_HTML_PAGE,
      'src/main.ts': '',
    },
    mustMatch: [
      USES_HTML_PACKAGE,
      HTML_VIDEO_PLAYER,
      { pattern: /\/images\/lesson-1\.jpg/, reason: 'keeps the poster' },
      { pattern: /<track\b[^>]*\bkind=["'](?:captions|subtitles)["']/, reason: 'keeps the captions track' },
      { pattern: /\bended\b/, reason: 'keeps the ended handler' },
    ],
    mustNotMatch: V8_PATTERNS,
  },
  {
    id: 'migrate-v8-react',
    framework: 'react',
    prompt:
      'Migrate src/VideoPlayer.tsx from Video.js 8 to Video.js 10 using @videojs/react. Keep its props, the poster, and the HLS source, and remove the video.js dependency.',
    fixture: {
      ...reactProject(V8_REACT_APP, { 'src/VideoPlayer.tsx': V8_REACT_PLAYER }),
      'package.json': reactPackageJson({ 'video.js': '^8.23.6' }),
    },
    mustMatch: [
      USES_REACT_PACKAGE,
      IMPORTS_REACT_VIDEO_PLAYER,
      REACT_VIDEO_PLAYER,
      {
        pattern: /\b(?:HlsJsVideo|HlsVideo|NativeHlsVideo|MuxVideo)\b/,
        reason: 'plays the HLS source with an HLS-capable media component',
      },
      { pattern: /\bposter\b/, reason: 'keeps the poster' },
    ],
    mustNotMatch: [
      ...REACT_PATTERNS,
      { pattern: /\.dispose\(\)/, reason: 'still disposes a v8 player by hand' },
      { pattern: /"video\.js"\s*:/, reason: 'keeps the `video.js` dependency' },
    ],
  },
  {
    id: 'react-audio-player',
    framework: 'react',
    prompt:
      'Add a Video.js 10 audio player to src/App.tsx for the podcast episode https://example.com/podcast/episode-42.mp3.',
    fixture: reactProject(),
    mustMatch: [
      USES_REACT_PACKAGE,
      { pattern: /\b(?:AudioPlayer|AudioSkin)\b/, reason: 'uses the audio preset (`AudioPlayer`/`AudioSkin`)' },
      {
        pattern: /<(?:AudioPlayer|Player)(?=[\s/>])/,
        reason: 'renders `<AudioPlayer>` or the `Player` that `createPlayer` returns',
      },
      { pattern: /episode-42\.mp3/, reason: 'plays the requested episode' },
    ],
    mustNotMatch: [...REACT_PATTERNS, { pattern: /\bVideoPlayer\b/, reason: 'uses a video player for audio' }],
  },
  {
    id: 'html-background-video',
    framework: 'html',
    prompt:
      'Add a muted, looping Video.js 10 background video to the hero section in index.html that plays /media/hero.mp4. It is decorative, so it needs no controls.',
    fixture: htmlProject('    <section class="hero">\n      <h1>Build faster</h1>\n    </section>'),
    mustMatch: [
      USES_HTML_PACKAGE,
      {
        pattern: /<(?:background-video-player|background-video)(?=[\s>])/,
        reason: 'uses the background video preset',
      },
      { pattern: /\/media\/hero\.mp4/, reason: 'plays the requested file' },
    ],
    mustNotMatch: V8_PATTERNS,
  },
  {
    id: 'react-live-video',
    framework: 'react',
    prompt: 'Add a Video.js 10 player for our live stream https://example.com/live/stream.m3u8 to src/App.tsx.',
    fixture: reactProject(),
    mustMatch: [
      USES_REACT_PACKAGE,
      {
        pattern: /\bLiveVideo(?:Player|Skin)\b|@videojs\/react\/live-video/,
        reason: 'uses the live video preset',
      },
      {
        pattern: /<(?:LiveVideoPlayer|Player)(?=[\s/>])/,
        reason: 'renders `<LiveVideoPlayer>` or the `Player` that `createPlayer` returns',
      },
      { pattern: /live\/stream\.m3u8/, reason: 'plays the requested stream' },
    ],
    mustNotMatch: REACT_PATTERNS,
  },
  {
    id: 'react-captions',
    framework: 'react',
    prompt: 'Add English captions from /captions/en.vtt to the player in src/App.tsx so viewers can turn them on.',
    fixture: reactProject(REACT_V10_APP),
    mustMatch: [
      { pattern: /<track\b[^>]*\bkind=["'{]*(?:captions|subtitles)/, reason: 'adds a captions or subtitles track' },
      { pattern: /\/captions\/en\.vtt/, reason: 'uses the requested VTT file' },
    ],
    mustNotMatch: [...REACT_PATTERNS, { pattern: /addRemoteTextTrack/, reason: 'uses the Video.js 8 text track API' }],
  },
  {
    id: 'html-accent-color',
    framework: 'html',
    prompt: "Change the Video.js player's accent color to our brand red, #e11d48.",
    fixture: htmlProject(HTML_V10_BODY, HTML_V10_MAIN),
    mustMatch: [
      {
        pattern: /--media-accent-color['"]?\s*:\s*['"]?#e11d48/i,
        reason: "sets the skin's `--media-accent-color` custom property",
      },
    ],
    mustNotMatch: [...V8_PATTERNS, NO_V8_SELECTORS],
  },
  {
    id: 'react-custom-controls',
    framework: 'react',
    prompt:
      'Build a Video.js 10 player in src/App.tsx without a packaged skin: just a play/pause button, a seek bar, and a fullscreen button, built from Video.js components. Play /media/intro.mp4.',
    fixture: reactProject(),
    mustMatch: [
      USES_REACT_PACKAGE,
      REACT_VIDEO_PLAYER,
      { pattern: /\bPlayButton\b/, reason: 'uses `PlayButton`' },
      { pattern: /\bTimeSlider\b/, reason: 'uses `TimeSlider` as the seek bar' },
      { pattern: /\bFullscreenButton\b/, reason: 'uses `FullscreenButton`' },
      { pattern: /\/media\/intro\.mp4/, reason: 'plays the requested file' },
    ],
    mustNotMatch: [
      ...REACT_PATTERNS,
      { pattern: /\b(?:VideoSkin|NeutralVideoSkin)\b|skin\.css/, reason: 'uses a packaged skin' },
    ],
  },
  {
    id: 'html-poster-title',
    framework: 'html',
    prompt:
      'Show /images/keynote.jpg as the poster before playback, and show the title "Launch Keynote" in the Video.js player in index.html.',
    fixture: htmlProject(HTML_V10_BODY, HTML_V10_MAIN),
    mustMatch: [
      {
        pattern:
          /<video-player\b[^>]*\bposter=["'][^"']*keynote\.jpg|slot=["']poster["'][^>]*keynote\.jpg|keynote\.jpg[^>]*slot=["']poster["']/,
        reason: "sets the player's poster (`poster` on `<video-player>` or the skin's `poster` slot)",
      },
      {
        pattern: /content-title=["']Launch Keynote["']|contentTitle\s*[=:]\s*["']Launch Keynote["']/,
        reason: "sets the player's title (`content-title`)",
      },
    ],
    mustNotMatch: V8_PATTERNS,
  },
];
