import { defineConfig } from 'vite-plus';

import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../build/task.ts';
import { registryTargets } from './build/registry/targets.ts';

const packageDir = import.meta.dirname;
const generatedPackageOutputs = [
  { pattern: 'packages/html/src/presets/background/skin.ts', base: 'workspace' as const },
  { pattern: 'packages/html/src/define/background/skin.css', base: 'workspace' as const },
  { pattern: 'packages/html/src/internal/skins/**', base: 'workspace' as const },
  { pattern: 'packages/react/src/internal/skins/**', base: 'workspace' as const },
  { pattern: 'packages/react/src/presets/*/skin.tsx', base: 'workspace' as const },
  { pattern: 'packages/react/src/presets/*/skin.css', base: 'workspace' as const },
  { pattern: 'packages/react/src/presets/*/minimal-skin.tsx', base: 'workspace' as const },
  { pattern: 'packages/react/src/presets/*/minimal-skin.css', base: 'workspace' as const },
] as const;

export default defineConfig({
  run: {
    tasks: {
      generate: {
        command: 'vp -C build pack',
        dependsOn: workspaceTaskDependencies(),
        cache: {
          untrackedEnv: ['VIDEOJS_PROFILE_SKINS'],
          // Generated package files and registry output are restored by this task,
          // so they must not participate in its own fingerprint.
          input: [
            ...cachedTaskInputs,
            '!dist/registry',
            '!dist/registry/**',
            ...generatedPackageOutputs.map(({ pattern, base }) => ({ pattern: `!${pattern}`, base })),
          ],
          output: ['dist/registry/source/**', ...generatedPackageOutputs],
        },
      },
      'generate:watch': {
        // Keep the framework packages' skin inputs current while developing. Registry emission stays one-shot.
        command: 'vp -C build pack --watch --no-clean',
        cache: false,
        dependsOn: workspaceTaskDependencies(),
      },
      'build:shadcn': {
        command: 'node --import tsx build/registry/build.ts',
        dependsOn: ['generate'],
        cache: {
          input: [
            'dist/registry/source/r/**',
            'build/registry/build.ts',
            'package.json',
            { pattern: 'pnpm-lock.yaml', base: 'workspace' },
          ],
          output: ['dist/shadcn/r/**'],
        },
      },
      'validate:shadcn:schema': {
        command: registryTargets.map(
          ({ output }) => `shadcn registry validate dist/registry/source/${output}/registry.json --cwd .`
        ),
        dependsOn: ['generate'],
        cache: {
          input: ['dist/registry/source/r/**', 'package.json', { pattern: 'pnpm-lock.yaml', base: 'workspace' }],
          output: [],
        },
      },
      'validate:shadcn:policy': {
        command: 'node --import tsx build/registry/validate.ts',
        dependsOn: ['build:shadcn'],
        cache: {
          input: [
            'build/registry/validate.ts',
            'dist/registry/source/r/**',
            'dist/shadcn/r/**',
            { pattern: 'packages/*/package.json', base: 'workspace' },
            { pattern: 'packages/adapters/*/package.json', base: 'workspace' },
            { pattern: 'packages/extensions/*/package.json', base: 'workspace' },
          ],
          output: [],
        },
      },
      'validate:shadcn': {
        command: 'node -e "" --',
        dependsOn: ['validate:shadcn:schema', 'validate:shadcn:policy'],
        cache: {
          output: [],
        },
      },
      'test:ci': {
        ...packageTestTask('pnpm run test:types && vp test run'),
        dependsOn: ['generate'],
      },
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
    projects: [
      {
        // Vitest v4 compatibility: keep this inline project independent of the root config.
        // Remove to inherit root options, including plugins and setup files.
        // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
        // https://vitest.dev/guide/migration/#inline-projects-inherit-the-root-config-by-default
        extends: false,
        test: {
          // Vitest v4 compatibility: preserve mock call history.
          // Remove after tests no longer rely on calls from setup or earlier tests.
          // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
          // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
          clearMocks: false,
          name: 'skins',
          root: packageDir,
          include: ['build/**/*.test.ts', 'src/**/*.test.ts'],
          // These integration tests share Vite and Rolldown package state.
          fileParallelism: false,
        },
      },
    ],
  },
});
