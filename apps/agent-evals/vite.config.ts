import { defineConfig } from 'vite-plus';

import { cachedTaskInputs } from '../../build/task.ts';

export default defineConfig({
  run: {
    tasks: {
      typecheck: {
        command: 'tsgo --project tsconfig.json --noEmit',
        input: [...cachedTaskInputs, '!fixtures/**', '!results/**'],
        output: [],
      },
    },
  },
  test: {
    include: ['src/**/tests/*.test.ts'],
  },
});
