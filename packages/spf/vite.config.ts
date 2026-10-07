import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';
import { playwright } from 'vite-plus/test/browser-playwright';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => ({
  ...packageBuildConfig(mode, 'neutral'),
  entry: {
    index: 'src/index.ts',
    dom: 'src/dom.ts',
    hls: 'src/playback/engines/hls/index.ts',
    'hls/video': 'src/playback/engines/hls/engine.ts',
    'hls/audio': 'src/playback/engines/hls/engine-audio-only.ts',
    'hls/background-video': 'src/playback/engines/hls/engine-background-video.ts',
    'hls/features/airplay': 'src/playback/engines/hls/features/airplay.ts',
    'hls/features/airplay-fairplay': 'src/playback/engines/hls/features/airplay-fairplay.ts',
    'hls/features/audio': 'src/playback/engines/hls/features/audio.ts',
    'hls/features/background-video': 'src/playback/engines/hls/features/background-video.ts',
    'hls/features/calculate-duration': 'src/playback/engines/hls/features/calculate-duration.ts',
    'hls/features/chapters': 'src/playback/engines/hls/features/chapters.ts',
    'hls/features/current-time': 'src/playback/engines/hls/features/current-time.ts',
    'hls/features/drm': 'src/playback/engines/hls/features/drm.ts',
    'hls/features/end-stall-recovery': 'src/playback/engines/hls/features/end-stall-recovery.ts',
    'hls/features/error': 'src/playback/engines/hls/features/error.ts',
    'hls/features/hls-loading': 'src/playback/engines/hls/features/hls-loading.ts',
    'hls/features/initial-load': 'src/playback/engines/hls/features/initial-load.ts',
    'hls/features/live': 'src/playback/engines/hls/features/live.ts',
    'hls/features/media-source': 'src/playback/engines/hls/features/media-source.ts',
    'hls/features/monitor-player-size': 'src/playback/engines/hls/features/monitor-player-size.ts',
    'hls/features/multi-cdn': 'src/playback/engines/hls/features/multi-cdn.ts',
    'hls/features/shift-text-timestamps': 'src/playback/engines/hls/features/shift-text-timestamps.ts',
    'hls/features/shift-timestamps': 'src/playback/engines/hls/features/shift-timestamps.ts',
    'hls/features/start-position': 'src/playback/engines/hls/features/start-position.ts',
    'hls/features/text-tracks': 'src/playback/engines/hls/features/text-tracks.ts',
    'hls/features/video': 'src/playback/engines/hls/features/video.ts',
    'media-tracks': 'src/media/media-tracks/index.ts',
    'hls-audio': 'src/playback/adapters/hls-audio/index.ts',
    'hls-background-video': 'src/playback/adapters/hls-background-video/index.ts',
    'hls-video': 'src/playback/adapters/hls-video/index.ts',
  },
});

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'vp pack',
        dependsOn: workspaceTaskDependencies(),
        cache: {
          input: cachedTaskInputs,
          output: ['dist/**'],
        },
      },
      'test:ci': packageTestTask(),
    },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    // Vitest v4 compatibility: keep separate Vite servers for inline projects.
    // Remove when plugins and config hooks can run once for shared projects.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#inline-projects-share-the-vite-server-by-default
    sharedViteServer: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'core',
          include: ['src/core/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'media',
          include: ['src/media/**/*.test.ts'],
          exclude: ['src/media/dom/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'network',
          include: ['src/network/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'behaviors',
          include: [
            'src/playback/behaviors/**/*.test.ts',
            'src/playback/actors/**/*.test.ts',
            'src/playback/primitives/**/*.test.ts',
          ],
          exclude: ['src/playback/behaviors/dom/**', 'src/playback/actors/dom/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          // All DOM-bound tests across the package — MSE/VTT primitives,
          // DOM-bound behaviors, DOM-bound actor factories.
          include: [
            'src/media/dom/**/*.test.ts',
            'src/playback/behaviors/dom/**/*.test.ts',
            'src/playback/actors/dom/**/*.test.ts',
          ],
          browser: {
            locators: {
              // Vitest v4 compatibility: keep partial, case-insensitive locator matching.
              // Remove after updating locators for full, case-sensitive matches.
              // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
              // https://vitest.dev/guide/migration/#locators-are-strict-by-default
              exact: false,
            },
            enabled: true,
            headless: true,
            provider: playwright(),
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'playback-engines',
          include: ['src/playback/engines/**/*.test.ts'],
          browser: {
            locators: {
              // Vitest v4 compatibility: keep partial, case-insensitive locator matching.
              // Remove after updating locators for full, case-sensitive matches.
              // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
              // https://vitest.dev/guide/migration/#locators-are-strict-by-default
              exact: false,
            },
            enabled: true,
            headless: true,
            provider: playwright(),
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          // The Medias over the engines. Browser-bound like the engines they
          // drive: they construct a real composition, which reaches MediaSource.
          name: 'playback-adapters',
          include: ['src/playback/adapters/**/*.test.ts'],
          browser: {
            locators: {
              // Vitest v4 compatibility: keep partial, case-insensitive locator matching.
              // Remove after updating locators for full, case-sensitive matches.
              // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
              // https://vitest.dev/guide/migration/#locators-are-strict-by-default
              exact: false,
            },
            enabled: true,
            headless: true,
            provider: playwright(),
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'types',
          include: [],
          typecheck: {
            enabled: true,
            checker: 'tsgo',
            include: ['src/**/*.test-d.ts'],
          },
        },
      },
    ],
  },
  pack: packageBuildModes.map(createPackConfig),
});
