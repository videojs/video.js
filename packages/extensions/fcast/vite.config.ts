import { defineConfig } from 'vite-plus';
import type { UserConfig as PackUserConfig } from 'vite-plus/pack';

import { type PackageBuildMode, packageBuildConfig, packageBuildModes } from '../../../build/pack.ts';
import { cachedTaskInputs, packageTestTask, workspaceTaskDependencies } from '../../../build/task.ts';

const createPackConfig = (mode: PackageBuildMode): PackUserConfig => ({
  ...packageBuildConfig(mode, 'browser'),
  entry: { index: './src/index.ts' },
});

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: 'vp pack',
        dependsOn: workspaceTaskDependencies(),
        cache: { input: cachedTaskInputs, output: ['dist/**'] },
      },
      'test:ci': packageTestTask(),
    },
  },
  define: { __DEV__: 'true' },
  test: { environment: 'jsdom' },
  pack: packageBuildModes.map(createPackConfig),
});
