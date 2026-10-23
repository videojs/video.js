// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  createInstallationPlan,
  INSTALLATION_FRAMEWORKS,
  INSTALLATION_PRESETS,
  INSTALLATION_SKIN_FLAGS,
  RENDERERS,
  resolveInstallationSelection,
} from '@videojs/installation';
import { describe, expect, it } from 'vite-plus/test';

import { type CheckCodeInput, checkCode, closestNames, type McpSurface } from '../check-code';

const SURFACE: McpSurface = {
  modules: {
    '@videojs/html': ['MediaElement'],
    '@videojs/html/video/player': [],
    '@videojs/html/video/skin': [],
    '@videojs/react': [
      'PlayButton',
      'TimeSlider',
      'TimeSlider.Root',
      'TimeSlider.Thumb',
      'TimeSlider.Track',
      'usePlayer',
    ],
    '@videojs/react/video': ['Video', 'VideoPlayer', 'VideoSkin', 'usePlayer'],
  },
  assets: ['@videojs/html/video/skin.css', '@videojs/react/video/skin.css'],
  elements: {
    'hls-video': ['@videojs/html/media/hls-video'],
    'media-play-button': ['@videojs/html/video/skin'],
    'media-time-slider': ['@videojs/html/video/skin'],
    'video-player': ['@videojs/html/video/player'],
    'video-skin': ['@videojs/html/video/skin'],
  },
};

const GENERATED_SURFACE_PATH = fileURLToPath(new URL('../../content/generated-mcp-surface.json', import.meta.url));

function check(code: string, framework: CheckCodeInput['framework'] = 'react', language?: string) {
  return checkCode({ code, framework, language }, SURFACE);
}

function rules(code: string, framework: CheckCodeInput['framework'] = 'react', language?: string) {
  return check(code, framework, language).map(({ rule, line, column }) => `${rule}@${line}:${column}`);
}

describe('checkCode', () => {
  describe('videojs-8-api', () => {
    it('flags the v8 setup call and its legacy package import with their codes', () => {
      const findings = check("import videojs from 'video.js';\n\nconst player = videojs('my-video');");

      expect(findings).toMatchObject([
        {
          rule: 'videojs-8-api',
          line: 1,
          column: 21,
          message: expect.stringContaining('VJS8_LEGACY_INIT'),
          fix: expect.stringContaining('@videojs/react/video'),
          docsUrl: 'https://videojs.org/docs/framework/react/reference/api/vjs8-legacy-init.md',
        },
        { rule: 'videojs-8-api', line: 3, column: 16, message: expect.stringContaining('VJS8_LEGACY_INIT') },
      ]);
    });

    it('maps v8 global members to their legacy codes', () => {
      const findings = check("videojs.registerPlugin('x', () => {});\nvideojs.options.autoplay = true;", 'html');

      expect(findings.map(({ message }) => message)).toEqual([
        expect.stringContaining('VJS8_LEGACY_PLUGIN'),
        expect.stringContaining('VJS8_LEGACY_OPTIONS'),
      ]);
      expect(findings[0]!.fix).toContain('<video-player>');
    });

    it('flags the v8 stylesheet and plugin packages without also calling them unknown modules', () => {
      const findings = check(
        "import 'video.js/dist/video-js.css';\nimport 'videojs-contrib-quality-levels';\nimport '@videojs/http-streaming';"
      );

      expect(findings.map(({ rule }) => rule)).toEqual(['videojs-8-api', 'videojs-8-api', 'videojs-8-api']);
      expect(findings[0]!.fix).toContain('@videojs/react/video/skin.css');
      expect(findings[0]!.docsUrl).toBe('https://videojs.org/docs/framework/react/guides/migrate-from-video-js-8.md');
    });

    it('flags v8 markup: classes, data-setup, the video-js element, and CDN URLs', () => {
      const html = [
        '<link href="https://vjs.zencdn.net/8.23.6/video-js.css" rel="stylesheet" />',
        '<video id="v" class="video-js vjs-default-skin" data-setup="{}"></video>',
        '<video-js></video-js>',
      ].join('\n');

      expect(rules(html, 'html')).toEqual([
        'videojs-8-api@1:1',
        'videojs-8-api@2:1',
        'videojs-8-api@2:1',
        'videojs-8-api@3:1',
      ]);
    });

    it('flags v8 classes and data-setup in JSX', () => {
      expect(rules('const a = <video className="video-js" data-setup="{}" />;')).toEqual([
        'videojs-8-api@1:18',
        'videojs-8-api@1:39',
      ]);
    });

    it('leaves Video.js 10 code and look-alike names alone', () => {
      const code = [
        "import { LEGACY_ERROR_CODES } from 'video.js/errors';",
        "import { VideoPlayer } from '@videojs/react/video';",
        'const videojsConfig = { src: "https://cdn.jsdelivr.net/npm/@videojs/cdn@10.2.0/video.js" };',
      ].join('\n');

      expect(check(code)).toEqual([]);
    });

    it('runs without a surface', () => {
      expect(
        checkCode({ code: "videojs('v');\nimport '@videojs/react/nope';", framework: 'react' }, undefined)
      ).toEqual([expect.objectContaining({ rule: 'videojs-8-api', line: 1 })]);
    });
  });

  describe('unknown-module', () => {
    it('flags a specifier the packages do not publish and suggests the closest one', () => {
      expect(check("import '@videojs/react/vide';")).toEqual([
        expect.objectContaining({
          rule: 'unknown-module',
          line: 1,
          column: 8,
          fix: 'Did you mean `@videojs/react/video`?',
        }),
      ]);
    });

    it('accepts published modules, stylesheets, and bundler query suffixes', () => {
      const code = [
        "import { VideoPlayer } from '@videojs/react/video';",
        "import '@videojs/react/video/skin.css';",
        "import styles from '@videojs/react/video/skin.css?inline';",
        "const lazy = () => import('@videojs/react/video');",
      ].join('\n');

      expect(check(code)).toEqual([]);
    });
  });

  describe('unknown-export', () => {
    it('flags a missing named export, suggests a close name, and names the module that has it', () => {
      const findings = check("import { Player, PlayButton } from '@videojs/react/video';");

      expect(findings).toEqual([
        expect.objectContaining({
          rule: 'unknown-export',
          column: 10,
          message: "`@videojs/react/video` doesn't export `Player`.",
          fix: 'Did you mean `VideoPlayer`?',
        }),
        expect.objectContaining({
          rule: 'unknown-export',
          column: 18,
          fix: '`PlayButton` is exported by `@videojs/react`.',
        }),
      ]);
    });

    it('suggests a name from another module of the package when the imported one has none close', () => {
      expect(check("import { Player } from '@videojs/react';")).toEqual([
        expect.objectContaining({ fix: 'Did you mean `VideoPlayer` from `@videojs/react/video`?' }),
      ]);
    });

    it('flags a default import from a module without one', () => {
      expect(check("import VideoPlayer from '@videojs/react/video';")).toEqual([
        expect.objectContaining({
          rule: 'unknown-export',
          message: '`@videojs/react/video` has no default export.',
          fix: expect.stringContaining('Use a named import'),
        }),
      ]);
    });

    it('checks re-exports and namespace members', () => {
      expect(rules("export { Plyer } from '@videojs/react/video';")).toEqual(['unknown-export@1:10']);
      expect(rules("import * as V from '@videojs/react';\nconst a = <V.PlayButon />;")).toEqual([
        'unknown-export@2:11',
      ]);
    });

    it('accepts value, type, aliased, and namespace imports that exist', () => {
      const code = [
        "import { type VideoPlayer as Player, usePlayer } from '@videojs/react/video';",
        "import type { Video } from '@videojs/react/video';",
        "import * as V from '@videojs/react';",
        'const a = <V.PlayButton />;',
      ].join('\n');

      expect(check(code)).toEqual([]);
    });
  });

  describe('unknown-element', () => {
    it('flags media- elements and Video.js family names the packages do not register', () => {
      const findings = check('<video-skins><media-play-btn></media-play-btn></video-skins>', 'html');

      expect(findings).toEqual([
        expect.objectContaining({ rule: 'unknown-element', column: 1, fix: 'Did you mean `<video-skin>`?' }),
        expect.objectContaining({ rule: 'unknown-element', column: 14, fix: 'Did you mean `<media-play-button>`?' }),
      ]);
    });

    it('flags unknown custom elements in JSX', () => {
      expect(rules('const a = <media-play-btn />;')).toEqual(['unknown-element@1:11']);
    });

    it("leaves registered elements, the project's own elements, and unrelated names alone", () => {
      const html = [
        '<video-player><video-skin><hls-video></hls-video></video-skin></video-player>',
        '<my-video></my-video><app-player></app-player><media-custom></media-custom>',
        '<script type="module">customElements.define(\'media-custom\', class extends HTMLElement {});</script>',
      ].join('\n');

      expect(check(html, 'html')).toEqual([]);
    });
  });

  describe('unknown-part', () => {
    it('flags a compound part the namespace does not have', () => {
      const findings = check("import { TimeSlider } from '@videojs/react';\nconst a = <TimeSlider.Thumbs />;");

      expect(findings).toEqual([
        expect.objectContaining({
          rule: 'unknown-part',
          line: 2,
          column: 11,
          message: "`Thumbs` isn't a part of `TimeSlider`.",
          fix: 'Did you mean `TimeSlider.Thumb`?',
        }),
      ]);
    });

    it('names parts by the local alias', () => {
      expect(check("import { TimeSlider as Slider } from '@videojs/react';\nconst a = <Slider.Trak />;")).toEqual([
        expect.objectContaining({ rule: 'unknown-part', fix: 'Did you mean `Slider.Track`?' }),
      ]);
    });

    it('accepts existing parts and members of exports that are not namespaces', () => {
      const code = [
        "import { PlayButton, TimeSlider } from '@videojs/react';",
        'const a = <TimeSlider.Root><TimeSlider.Thumb /></TimeSlider.Root>;',
        'const b = <PlayButton.Anything />;',
      ].join('\n');

      expect(check(code)).toEqual([]);
    });
  });

  describe('framework-mismatch', () => {
    it('warns when code imports the other framework package', () => {
      expect(check("import '@videojs/html/video/player';")).toEqual([
        expect.objectContaining({ rule: 'framework-mismatch', severity: 'warning' }),
      ]);
      expect(check("import { VideoPlayer } from '@videojs/react/video';", 'html')).toEqual([
        expect.objectContaining({ rule: 'framework-mismatch', severity: 'warning' }),
      ]);
    });

    it('accepts the matching package', () => {
      expect(check("import '@videojs/html/video/player';", 'html')).toEqual([]);
    });
  });

  describe('positions and parsing', () => {
    it('checks single-file components, offsetting script positions', () => {
      const vue = [
        '<template>',
        '  <video-player><media-play-btn /></video-player>',
        '</template>',
        '<script setup lang="ts">',
        "import '@videojs/html/video/playr';",
        '</script>',
      ].join('\n');

      expect(rules(vue, 'html', 'vue')).toEqual(['unknown-element@2:17', 'unknown-module@5:8']);
    });

    it('reads a bare JSX snippet as JSX', () => {
      expect(rules('<TimeSlider.Root>\n  <media-play-btn />\n</TimeSlider.Root>')).toEqual(['unknown-element@2:3']);
    });

    it('still checks imports when the code does not parse', () => {
      expect(rules("import { Plyer } from '@videojs/react/video';\nconst = = ;\n<<<")).toContain('unknown-export@1:1');
    });

    it('ignores comments', () => {
      expect(check("// videojs('v');\n/* import 'video.js'; */", 'html', 'js')).toEqual([]);
      expect(
        rules("/* import 'video.js'; */\nimport { Plyer } from '@videojs/react/video';\nconst = ;", 'react', 'js')
      ).toEqual(['unknown-export@2:1']);
      expect(check('<!-- <video-js></video-js> -->', 'html', 'html')).toEqual([]);
    });
  });

  // Agents copy our own installation output, so every generated snippet must pass against the real surface.
  it.skipIf(!existsSync(GENERATED_SURFACE_PATH))('accepts every generated installation snippet', () => {
    // SAFETY: the file is written by `scripts/mcp-surface.ts` with this shape.
    const surface = JSON.parse(readFileSync(GENERATED_SURFACE_PATH, 'utf8')) as McpSurface;
    const failures: string[] = [];
    let checked = 0;

    for (const framework of INSTALLATION_FRAMEWORKS) {
      for (const { flag: preset } of Object.values(INSTALLATION_PRESETS)) {
        for (const skin of INSTALLATION_SKIN_FLAGS) {
          for (const media of RENDERERS) {
            for (const method of ['packaged', 'cdn']) {
              const resolved = resolveInstallationSelection({
                method,
                framework,
                preset,
                skin,
                media,
                extensions: 'none',
                sourceUrl: 'demo',
              });
              if (!resolved.ok) continue;

              const plan = createInstallationPlan(resolved.selection, 'latest');

              for (const block of plan.steps.flatMap((step) => step.blocks)) {
                if (!['html', 'tsx', 'jsx', 'ts', 'js', 'vue', 'svelte'].includes(block.language)) continue;

                const findings = checkCode(
                  { code: block.code, framework: framework === 'react' ? 'react' : 'html', language: block.language },
                  surface
                );

                checked++;

                if (findings.length > 0) {
                  failures.push(`${framework}/${preset}/${skin}/${media}/${method}: ${JSON.stringify(findings)}`);
                }
              }
            }
          }
        }
      }
    }

    expect(checked).toBeGreaterThan(100);
    expect(failures.slice(0, 5)).toEqual([]);
  });
});

describe('closestNames', () => {
  it('returns only the best matches, ties included', () => {
    expect(closestNames('videoplayer', ['VideoPlayer', 'VideoPlayers', 'Player'])).toEqual(['VideoPlayer']);
    expect(closestNames('Thum', ['Thumb', 'Track', 'Thump'])).toEqual(['Thumb', 'Thump']);
  });

  it('prefers names with the same leading case, then containing names', () => {
    expect(closestNames('Player', ['usePlayer', 'VideoPlayer'])).toEqual(['VideoPlayer']);
    expect(closestNames('Zzz', ['VideoPlayer'])).toEqual([]);
  });

  it('ranks companion types below the component they accompany', () => {
    expect(closestNames('Player', ['PlayerProps', 'VideoPlayer'])).toEqual(['VideoPlayer']);
    expect(closestNames('PlayerProp', ['PlayerProps', 'VideoPlayer'])).toEqual(['PlayerProps']);
  });
});
