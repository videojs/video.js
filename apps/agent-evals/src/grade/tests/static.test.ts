import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { analyzeProject, cdnVersion, readInstalledVideojs } from '../static.ts';

const projects: string[] = [];

function project(files: Record<string, string>): { dir: string; changed: string[] } {
  const dir = mkdtempSync(join(tmpdir(), 'agent-evals-static-'));

  projects.push(dir);

  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }

  return { dir, changed: Object.keys(files) };
}

afterEach(() => {
  for (const dir of projects.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('analyzeProject', () => {
  it('recognizes a packaged React skin with the installed version', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/react': '^10.0.0-rc.2', react: '^19.0.0' } }),
      'node_modules/@videojs/react/package.json': JSON.stringify({ version: '10.0.0-rc.2' }),
      'components/player.tsx': [
        "import '@videojs/react/video/skin.css';",
        "import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video';",
        'export const Player = () => <VideoPlayer><VideoSkin><Video src="a.mp4" /></VideoSkin></VideoPlayer>;',
      ].join('\n'),
    });

    expect(analyzeProject(dir, changed)).toMatchObject({
      videojsPackages: { '@videojs/react': '10.0.0-rc.2' },
      method: 'packaged',
      preset: 'video',
      skin: 'default',
      media: 'html5',
      v8Evidence: [],
    });
  });

  it('recognizes a pinned CDN install with HLS media', () => {
    const cdn = 'https://cdn.jsdelivr.net/npm/@videojs/cdn@10.0.0-rc.2';
    const { dir, changed } = project({
      'index.html': [
        `<script type="module" src="${cdn}/video.js"></script>`,
        `<script type="module" src="${cdn}/media/hls-video.js"></script>`,
        '<video-player><video-skin><hls-video src="a.m3u8"></hls-video></video-skin></video-player>',
      ].join('\n'),
    });

    expect(analyzeProject(dir, changed)).toMatchObject({
      cdnUrls: [`${cdn}/video.js`, `${cdn}/media/hls-video.js`],
      cdnPinned: true,
      method: 'cdn',
      preset: 'video',
      media: 'hls',
    });
  });

  it('flags unpinned CDN URLs', () => {
    const { dir, changed } = project({
      'index.html':
        '<script type="module" src="https://cdn.jsdelivr.net/npm/@videojs/cdn/video.js"></script><video-player></video-player>',
    });

    expect(analyzeProject(dir, changed).cdnPinned).toBe(false);
  });

  it('recognizes skin source copied through the Video.js shadcn registry', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/react': '^10.0.0-rc.2' } }),
      'components.json': JSON.stringify({
        registries: { '@videojs': 'https://shadcn.videojs.org/r/react/{name}.json' },
      }),
      'components/video-player/skin.tsx': "import { PlayButton } from '@videojs/react';",
    });

    expect(analyzeProject(dir, changed).method).toBe('shadcn');
  });

  it('recognizes the minimal audio skin', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/react': '10.0.0-rc.2' } }),
      'src/Podcast.tsx': [
        "import '@videojs/react/audio/minimal-skin.css';",
        "import { Audio, AudioPlayer, MinimalAudioSkin } from '@videojs/react/audio';",
      ].join('\n'),
    });

    expect(analyzeProject(dir, changed)).toMatchObject({ method: 'packaged', preset: 'audio', skin: 'minimal' });
  });

  it('counts the neutral skin, the minimal skin renamed, as minimal', () => {
    const react = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/react': '10.0.1' } }),
      'src/Podcast.tsx': [
        "import '@videojs/react/audio/neutral-skin.css';",
        "import { Audio, AudioPlayer, NeutralAudioSkin } from '@videojs/react/audio';",
      ].join('\n'),
    });
    const html = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/html': '10.0.1' } }),
      'src/player.ts': "import '@videojs/html/video/player';\nimport '@videojs/html/video/neutral-skin';",
      'index.html': '<video-player><video-neutral-skin><video src="a.mp4"></video></video-neutral-skin></video-player>',
    });

    expect(analyzeProject(react.dir, react.changed)).toMatchObject({ method: 'packaged', skin: 'minimal' });
    expect(analyzeProject(html.dir, html.changed)).toMatchObject({ method: 'packaged', skin: 'minimal' });
  });

  it('tells the compat and scaffold skins from the default skin', () => {
    const compat = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/react': '10.0.1' } }),
      'src/Player.tsx': "import { CompatVideoSkin, Video, VideoPlayer } from '@videojs/react/video';",
    });
    const scaffold = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/html': '10.0.1' } }),
      'index.html':
        '<video-player><video-scaffold-skin><video src="a.mp4"></video></video-scaffold-skin></video-player>',
    });

    expect(analyzeProject(compat.dir, compat.changed)).toMatchObject({ method: 'packaged', skin: 'compat' });
    expect(analyzeProject(scaffold.dir, scaffold.changed)).toMatchObject({ method: 'packaged', skin: 'scaffold' });
  });

  it('takes the video.js 10 package, which only routes installs, for Video.js 10', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { 'video.js': '^10.1.0', '@videojs/html': '^10.1.0' } }),
      'src/player.ts': "import '@videojs/html/video/player';",
    });
    const report = analyzeProject(dir, changed);

    expect(report.v8Evidence).toEqual([]);
    expect(report.choice).toBe('videojs-10');
  });

  it('collects Video.js 8 evidence', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { 'video.js': '^8.10.0' } }),
      'src/main.js': "import videojs from 'video.js';\nimport 'video.js/dist/video-js.css';\nvideojs('player', {});",
      'index.html': '<video id="player" class="video-js" data-setup="{}"></video>',
    });
    const report = analyzeProject(dir, changed);

    expect(report.method).toBe('none');
    expect(report.v8Evidence).toEqual([
      'videojs() call',
      'video-js class',
      'data-setup attribute',
      'video.js v8 stylesheet',
      'video.js@^8.10.0 dependency',
    ]);
  });

  it.each([
    [{ dependencies: { '@videojs/react': '^10.0.0-rc.2' } }, '<VideoPlayer />', 'videojs-10'],
    [{ dependencies: { 'video.js': '^8.10.0' } }, "import videojs from 'video.js';", 'videojs-8'],
    [{ dependencies: { plyr: '^3.8.0', 'hls.js': '^1.6.0' } }, "import Plyr from 'plyr';", 'plyr'],
    [{ dependencies: {} }, '<script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script><video></video>', 'hls.js'],
    [{ dependencies: {} }, '<audio controls src="episode.m4a"></audio>', 'native'],
    [{ dependencies: {} }, '<p>Coming soon</p>', 'none'],
  ])('records the player chosen (%o)', (manifest, code, choice) => {
    const { dir, changed } = project({ 'package.json': JSON.stringify(manifest), 'src/index.html': code });

    expect(analyzeProject(dir, changed).choice).toBe(choice);
  });

  it('reads the preset from markup and scripts, not from ejected skin styles', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/react': '10.0.0-rc.3' } }),
      'components/videojs/styles/audio/theme.css':
        '.media-skin:is([data-preset="audio"], [data-preset="live-audio"]) {}',
      'app/page.tsx': "import { VideoPlayer } from '@/components/videojs/video/player';",
    });

    expect(analyzeProject(dir, changed).preset).toBe('video');
  });

  it('ignores lockfiles when scanning changes', () => {
    const { dir, changed } = project({
      'pnpm-lock.yaml': 'videojs(',
      'src/App.tsx': 'export default function App() { return null; }',
    });

    expect(analyzeProject(dir, changed).v8Evidence).toEqual([]);
  });
});

describe('analyzeProject skin source', () => {
  const htmlParts = [
    'container',
    'poster',
    'controls',
    'play-button',
    'mute-button',
    'volume-slider',
    'slider-track',
    'slider-fill',
    'slider-thumb',
    'time',
    'time-slider',
    'fullscreen-button',
  ];

  it('counts editable skin source copied without the shadcn CLI as shadcn', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/html': '10.0.0-rc.4' } }),
      'src/components/videojs/video/skin.ts': htmlParts.map((part) => `import '@videojs/html/ui/${part}';`).join('\n'),
      'src/main.ts': "import '@videojs/html/video/player';\nimport './components/videojs/video/skin';",
    });

    expect(analyzeProject(dir, changed)).toMatchObject({
      method: 'shadcn',
      skinSource: { parts: 12, files: ['src/components/videojs/video/skin.ts'] },
    });
  });

  it('keeps a few hand-placed controls custom', () => {
    const { dir, changed } = project({
      'package.json': JSON.stringify({ dependencies: { '@videojs/react': '10.0.0-rc.4' } }),
      'components/player.tsx': "import { PlayButton, TimeSlider, MuteButton as Mute } from '@videojs/react';",
    });

    expect(analyzeProject(dir, changed)).toMatchObject({ method: 'custom', skinSource: { parts: 3 } });
  });
});

describe('readInstalledVideojs', () => {
  it('reads every @videojs package in node_modules, dependencies included', () => {
    const { dir } = project({
      'node_modules/@videojs/react/package.json': JSON.stringify({ version: '10.0.0-rc.4' }),
      'node_modules/@videojs/core/package.json': JSON.stringify({ version: '10.0.0-rc.4' }),
    });

    expect(readInstalledVideojs(dir)).toEqual({ '@videojs/core': '10.0.0-rc.4', '@videojs/react': '10.0.0-rc.4' });
    expect(readInstalledVideojs(join(dir, 'missing'))).toBeNull();
  });
});

describe('cdnVersion', () => {
  it('reads an exact version and leaves floating URLs alone', () => {
    expect(cdnVersion('https://cdn.jsdelivr.net/npm/@videojs/cdn@10.0.0-rc.2/video.js')).toBe('10.0.0-rc.2');
    expect(cdnVersion('https://cdn.jsdelivr.net/npm/@videojs/cdn/video.js')).toBeNull();
  });
});
