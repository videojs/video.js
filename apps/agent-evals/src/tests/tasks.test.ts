import { describe, expect, it } from 'vitest';

import { loadTasks, selectTasks, type TaskFilter } from '../tasks.ts';

const tasks = loadTasks();
const filter = (overrides: Partial<TaskFilter>): TaskFilter => ({
  suites: ['core'],
  ids: [],
  frameworks: [],
  methods: [],
  presets: [],
  ...overrides,
});

describe('selectTasks', () => {
  it('runs the core React and HTML tasks by default', () => {
    expect(selectTasks(tasks, filter({})).map(({ id }) => id)).toEqual([
      'html-static-cdn-hls',
      'html-vite-packaged-minimal',
      'html-vite-shadcn',
      'react-next-background',
      'react-next-packaged',
      'react-next-shadcn',
      'react-vite-audio-minimal',
    ]);
  });

  it('adds the extended tasks with the full suite', () => {
    expect(selectTasks(tasks, filter({ suites: ['full'] }))).toHaveLength(tasks.length);
  });

  it('narrows by what the tasks expect', () => {
    expect(selectTasks(tasks, filter({ methods: ['shadcn'] })).map(({ id }) => id)).toEqual([
      'html-vite-shadcn',
      'react-next-shadcn',
    ]);
    expect(selectTasks(tasks, filter({ suites: ['extended'], frameworks: ['vue'] })).map(({ id }) => id)).toEqual([
      'vue-nuxt-hls',
      'vue-vite-packaged',
    ]);
  });

  it('selects by id across suites', () => {
    expect(selectTasks(tasks, filter({ ids: ['astro-*', 'react-next-packaged'] })).map(({ id }) => id)).toEqual([
      'astro-packaged',
      'react-next-packaged',
    ]);
  });

  it('rejects a selection that matches nothing', () => {
    expect(() => selectTasks(tasks, filter({ frameworks: ['svelte'] }))).toThrow('No tasks match');
  });
});
