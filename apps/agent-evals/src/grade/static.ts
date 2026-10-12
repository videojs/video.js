import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';

import type { InstallMethod, Preset } from '../tasks.ts';

export type DetectedMethod = InstallMethod | 'custom' | 'none';

/** The player the project ended up with: Video.js 10 or 8, another library by name, a bare media element, or nothing. */
export type PlayerChoice = 'videojs-10' | 'videojs-8' | 'native' | 'none' | (string & {});

/** Other players and playback libraries, by package name, as they appear in results. */
const OTHER_PLAYERS: Record<string, string> = {
  plyr: 'plyr',
  'plyr-react': 'plyr',
  'react-player': 'react-player',
  '@mux/mux-player': 'mux-player',
  '@mux/mux-player-react': 'mux-player',
  '@mux/mux-video': 'mux-video',
  '@mux/mux-video-react': 'mux-video',
  vidstack: 'vidstack',
  '@vidstack/react': 'vidstack',
  'media-chrome': 'media-chrome',
  'shaka-player': 'shaka-player',
  dashjs: 'dash.js',
  'video-react': 'video-react',
  mediaelement: 'mediaelement',
  'react-h5-audio-player': 'react-h5-audio-player',
  'react-audio-player': 'react-audio-player',
  howler: 'howler',
  'wavesurfer.js': 'wavesurfer',
  'hls.js': 'hls.js',
};
const OTHER_PLAYER_CDNS: ReadonlyArray<[RegExp, string]> = [
  [/cdn\.plyr\.io|\/npm\/plyr@?/, 'plyr'],
  [/\/npm\/hls\.js@?|hls\.js@[\d]/, 'hls.js'],
  [/\/npm\/vidstack@?|cdn\.vidstack\.io/, 'vidstack'],
  [/\/npm\/media-chrome@?/, 'media-chrome'],
  [/\/npm\/@mux\/mux-player@?/, 'mux-player'],
];

export interface StaticReport {
  /** `@videojs/*` and `video.js` dependencies, with the installed version when node_modules has it. */
  videojsPackages: Record<string, string>;
  /**
   * Every `@videojs/*` package in node_modules after the grader's install, dependencies of dependencies included, so a
   * version other than the build under test shows up. `null` before the install.
   */
  installedVersions?: Record<string, string> | null;
  cdnUrls: string[];
  /** Whether every CDN URL names an exact version. `null` without CDN URLs. */
  cdnPinned: boolean | null;
  v8Evidence: string[];
  method: DetectedMethod;
  /**
   * Video.js UI parts the project's own code composes, and the files that do. Ten or more is an editable skin in the
   * repo, whichever tool put it there; a handful is a hand-built player.
   */
  skinSource?: { parts: number; files: string[] };
  preset: Preset | 'unknown';
  /** `minimal` covers its rename, neutral, as in task expectations. */
  skin: 'default' | 'minimal' | 'compat' | 'scaffold' | 'none' | 'unknown';
  media: 'hls' | 'dash' | 'background-video' | 'html5' | 'unknown';
  choice: PlayerChoice;
}

const LOCKFILES = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lock', 'bun.lockb']);
const TEXT_EXTENSIONS = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
]);
const MAX_FILE_BYTES = 512 * 1024;

const CDN_URL =
  /https?:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com|esm\.sh|cdn\.skypack\.dev)\/@videojs\/[\w-]+(?:@[^/"'`\s)]+)?[^"'`\s)]*/g;
const CDN_VERSION = /@videojs\/[\w-]+@(\d+\.\d+\.\d+[\w.-]*)/;

/** Parts that make an editable skin, as opposed to a few hand-placed controls. */
export const SKIN_SOURCE_PARTS = 10;

const REACT_PRIMITIVES = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]@videojs\/react['"]/g;
const HTML_PARTS = /['"]@videojs\/html\/ui\/([\w-]+)['"]/g;

const V8_PATTERNS: ReadonlyArray<[string, RegExp]> = [
  ['videojs() call', /(?<![\w./@-])videojs\s*\(/],
  ['video-js class', /class(?:Name)?\s*=\s*["'{`][^"'`}]*\bvideo-js\b/],
  ['data-setup attribute', /\bdata-setup\s*=/],
  ['registerPlugin', /\bregisterPlugin\s*\(/],
  ['video.js v8 stylesheet', /video\.js\/dist\/video-js(?:\.min)?\.css/],
  ['Video.js 8 CDN', /vjs\.zencdn\.net|video\.js@[0-8]\./],
];

/**
 * Reads the project's source files. Pass every file, not only the agent's changes: a migration that leaves Video.js 8
 * code in a file it never touched is still unfinished.
 */
export function analyzeProject(appDir: string, files: readonly string[]): StaticReport {
  const sources = files
    .filter((file) => !LOCKFILES.has(file.split('/').at(-1)!) && TEXT_EXTENSIONS.has(extname(file)))
    .map((file) => ({ file, text: readText(join(appDir, file)) }))
    .filter((source): source is { file: string; text: string } => source.text !== null);
  const code = sources.map(({ text }) => text).join('\n');
  // Ejected skin styles carry selectors for every preset and skin, such as `[data-preset="live-audio"]`, so what the
  // project uses comes from its markup and scripts.
  const usage = sources
    .filter(({ file }) => extname(file) !== '.css')
    .map(({ text }) => text)
    .join('\n');

  // Every manifest in the project, so a workspace's shared packages count along with its apps.
  const manifests = files.filter((file) => file.split('/').at(-1) === 'package.json').map((file) => dirname(file));
  const dependencies = Object.assign({}, ...manifests.map((dir) => readDependencies(join(appDir, dir))));
  const videojsPackages = Object.assign(
    {},
    ...manifests.map((dir) => readVideojsPackages(join(appDir, dir), readDependencies(join(appDir, dir))))
  );
  const cdnUrls = [...new Set(code.match(CDN_URL) ?? [])];
  const v8Evidence = V8_PATTERNS.filter(([, pattern]) => pattern.test(code)).map(([label]) => label);
  const videojsPackage = videojsPackages['video.js'];

  if (videojsPackage && majorVersion(videojsPackage) < 10) v8Evidence.push(`video.js@${videojsPackage} dependency`);

  const skinSource = detectSkinSource(sources);
  const method = detectMethod(appDir, code, videojsPackages, cdnUrls, skinSource.parts);

  return {
    videojsPackages,
    installedVersions: null,
    cdnUrls,
    cdnPinned: cdnUrls.length > 0 ? cdnUrls.every((url) => CDN_VERSION.test(url)) : null,
    v8Evidence,
    method,
    skinSource,
    preset: detectPreset(usage),
    skin: detectSkin(usage),
    media: detectMedia(usage),
    choice: detectChoice(code, dependencies, videojsPackages, cdnUrls, v8Evidence),
  };
}

/**
 * Versions of every `@videojs/*` package installed in the project, including dependencies of dependencies, from the
 * node_modules beside each of `manifestDirs` (relative to `appDir`) in a workspace.
 */
export function readInstalledVideojs(
  appDir: string,
  manifestDirs: readonly string[] = ['.']
): Record<string, string> | null {
  const scopes = [...new Set(['.', ...manifestDirs])]
    .map((dir) => join(appDir, dir, 'node_modules', '@videojs'))
    .filter((scope) => existsSync(scope));
  if (scopes.length === 0) return null;

  const versions: Record<string, string> = {};

  for (const scope of scopes) {
    for (const name of readdirSync(scope)) {
      const manifest = readText(join(scope, name, 'package.json'));

      if (manifest) versions[`@videojs/${name}`] = (JSON.parse(manifest) as { version: string }).version;
    }
  }

  return versions;
}

/** The exact version a CDN URL names, or `null` for a URL that floats. */
export function cdnVersion(url: string): string | null {
  return CDN_VERSION.exec(url)?.[1] ?? null;
}

function detectSkinSource(sources: ReadonlyArray<{ file: string; text: string }>): { parts: number; files: string[] } {
  const parts = new Set<string>();
  const files: string[] = [];

  for (const { file, text } of sources) {
    const before = parts.size;

    for (const [, names = ''] of text.matchAll(REACT_PRIMITIVES)) {
      for (const name of names.split(',')) {
        const imported = name
          .trim()
          .split(/\s+as\s+/)[0]!
          .trim();

        if (/^[A-Z]/.test(imported)) parts.add(`react:${imported}`);
      }
    }

    for (const [, part] of text.matchAll(HTML_PARTS)) parts.add(`html:${part}`);

    if (parts.size > before) files.push(file);
  }

  return { parts: parts.size, files };
}

function readText(path: string): string | null {
  if (!existsSync(path) || statSync(path).size > MAX_FILE_BYTES) return null;

  return readFileSync(path, 'utf8');
}

function readDependencies(appDir: string): Record<string, string> {
  const manifest = readText(join(appDir, 'package.json'));
  if (!manifest) return {};

  const pkg = JSON.parse(manifest) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  return { ...pkg.devDependencies, ...pkg.dependencies };
}

function readVideojsPackages(appDir: string, dependencies: Record<string, string>): Record<string, string> {
  const packages: Record<string, string> = {};

  for (const [name, specifier] of Object.entries(dependencies)) {
    if (!name.startsWith('@videojs/') && name !== 'video.js') continue;

    const installed = readText(join(appDir, 'node_modules', name, 'package.json'));

    packages[name] = installed ? (JSON.parse(installed) as { version: string }).version : specifier;
  }

  return packages;
}

function majorVersion(version: string): number {
  const match = version.match(/(\d+)\./);

  return match ? Number(match[1]) : Number.NaN;
}

function detectMethod(
  appDir: string,
  code: string,
  videojsPackages: Record<string, string>,
  cdnUrls: readonly string[],
  skinParts: number
): DetectedMethod {
  const componentsJson = readText(join(appDir, 'components.json')) ?? '';
  const hasPackages = Object.keys(videojsPackages).some((name) => name.startsWith('@videojs/'));

  // Editable skin source counts however it got there: the shadcn CLI, or registry files copied by hand.
  if (/videojs/i.test(componentsJson) || /shadcn\.videojs\.org/.test(code) || skinParts >= SKIN_SOURCE_PARTS) {
    return 'shadcn';
  }

  if (cdnUrls.length > 0 && !hasPackages) return 'cdn';

  if (!hasPackages) return 'none';

  const packagedSkin =
    /\b(?:Minimal|Neutral|Compat|Scaffold)?(?:Video|Audio|LiveVideo|LiveAudio)Skin\b/.test(code) ||
    /<(?:minimal-)?(?:video|audio|live-video|live-audio)(?:-(?:minimal|neutral|compat|scaffold))?-skin\b/.test(code) ||
    /@videojs\/(?:react|html)\/[\w/-]*(?:skin|background)/.test(code) ||
    /\bBackgroundVideo\b|<background-video/.test(code);

  return packagedSkin ? 'packaged' : 'custom';
}

function detectChoice(
  code: string,
  dependencies: Record<string, string>,
  videojsPackages: Record<string, string>,
  cdnUrls: readonly string[],
  v8Evidence: readonly string[]
): PlayerChoice {
  const videojsPackage = videojsPackages['video.js'];
  const v10Package = videojsPackage !== undefined && majorVersion(videojsPackage) >= 10;

  if (cdnUrls.length > 0 || v10Package || Object.keys(videojsPackages).some((name) => name.startsWith('@videojs/'))) {
    return 'videojs-10';
  }

  if (v8Evidence.length > 0 || 'video.js' in dependencies || '@videojs-player/react' in dependencies)
    return 'videojs-8';

  const other = Object.keys(dependencies).find((name) => name in OTHER_PLAYERS);
  if (other) return OTHER_PLAYERS[other]!;

  const otherCdn = OTHER_PLAYER_CDNS.find(([pattern]) => pattern.test(code));
  if (otherCdn) return otherCdn[1];

  return /<(?:video|audio)\b/i.test(code) ? 'native' : 'none';
}

function detectPreset(code: string): StaticReport['preset'] {
  if (/background-video|BackgroundVideo/.test(code)) return 'background-video';

  if (/live-audio|LiveAudio/.test(code)) return 'live-audio';

  if (/live-video|LiveVideo/.test(code)) return 'live-video';

  if (/\baudio-player\b|\bAudioPlayer\b|@videojs\/(?:react|html)\/audio\b|@videojs\/cdn@[^/]+\/audio\.js/.test(code)) {
    return 'audio';
  }

  if (/\bvideo-player\b|\bVideoPlayer\b|@videojs\/(?:react|html)\/video\b|@videojs\/cdn@[^/]+\/video\.js/.test(code)) {
    return 'video';
  }

  return 'unknown';
}

function detectSkin(code: string): StaticReport['skin'] {
  if (
    /minimal-(?:video|audio)-skin|(?:video|audio)-minimal-skin|Minimal(?:Video|Audio)Skin|\/minimal[-/]|minimal-(?:video|audio)\b/i.test(
      code
    ) ||
    /(?:video|audio)-neutral(?:-skin)?\b|Neutral(?:Video|Audio)Skin|\/neutral-skin\b/.test(code)
  ) {
    return 'minimal';
  }

  if (/(?:video|audio)-compat(?:-skin)?\b|Compat(?:Video|Audio)Skin|\/compat-skin\b/.test(code)) return 'compat';

  if (/(?:video|audio)-scaffold(?:-skin)?\b|Scaffold(?:Video|Audio)Skin|\/scaffold-skin\b/.test(code)) {
    return 'scaffold';
  }

  if (/(?:video|audio)-skin|(?:Video|Audio)Skin|skin\.css/.test(code)) return 'default';

  if (/background-video|BackgroundVideo/.test(code)) return 'none';

  return 'unknown';
}

function detectMedia(code: string): StaticReport['media'] {
  if (
    /hls-video|HlsVideo|hlsjs-video|HlsJsVideo|native-hls-video|mux-video|MuxVideo|shaka-video|ShakaVideo/.test(code)
  ) {
    return 'hls';
  }

  if (/dash-video|DashVideo/.test(code)) return 'dash';

  if (/background-video|BackgroundVideo/.test(code)) return 'background-video';

  if (/<(?:video|audio)\b|<(?:Video|Audio)\b/.test(code)) return 'html5';

  return 'unknown';
}
