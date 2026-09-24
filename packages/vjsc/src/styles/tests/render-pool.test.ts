import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import type { StyleOutputFile } from '../output';
import { createRenderPool } from '../render-pool';

const workerFile = resolve(import.meta.dirname, 'fixtures/render-worker.mjs');
const file: StyleOutputFile = { name: 'buttons.css', layer: 'components', rules: [], groupOwners: new Map() };

describe('createRenderPool', () => {
  it('renders jobs on workers and settles each with its own result', async () => {
    const pool = createRenderPool(2, workerFile)!;
    const results = await Promise.all(
      ['a', 'b', 'c'].map((css) => pool.render({ css, scope: '.skin', file }, () => 'in-process'))
    );

    expect(results).toEqual(['.skin{a}', '.skin{b}', '.skin{c}']);
  });

  it('rejects with the error the worker threw, keeping its name and message', async () => {
    const pool = createRenderPool(1, workerFile)!;
    const failure = pool.render({ css: 'throw', scope: undefined, file }, () => 'in-process');

    await expect(failure).rejects.toThrow('Tailwind did not emit the semantic style.');
    await expect(failure).rejects.toMatchObject({ name: 'TypeError' });
  });

  it('renders on the main thread when a worker dies', async () => {
    const pool = createRenderPool(1, workerFile)!;

    await expect(pool.render({ css: 'crash', scope: undefined, file }, () => 'in-process')).resolves.toBe('in-process');
    await expect(pool.render({ css: 'a', scope: undefined, file }, () => 'fallback')).resolves.toBe('fallback');
  });

  it('renders jobs still queued behind a dead worker on the main thread', async () => {
    const pool = createRenderPool(1, workerFile)!;
    const results = await Promise.all([
      pool.render({ css: 'crash', scope: undefined, file }, () => 'crash in process'),
      pool.render({ css: 'queued', scope: undefined, file }, () => 'queued in process'),
    ]);

    expect(results).toEqual(['crash in process', 'queued in process']);
  });

  it('renders on the main thread when a worker cannot start', async () => {
    const unstartable = createRenderPool(1, 'relative-worker.js')!;
    const missing = createRenderPool(1, resolve(import.meta.dirname, 'fixtures/missing-worker.mjs'))!;

    await expect(unstartable.render({ css: 'a', scope: undefined, file }, () => 'in-process')).resolves.toBe(
      'in-process'
    );
    await expect(missing.render({ css: 'a', scope: undefined, file }, () => 'in-process')).resolves.toBe('in-process');
  });

  it('renders on the main thread when a job cannot be sent', async () => {
    const pool = createRenderPool(1, workerFile)!;
    const uncloneable = { ...file, groupOwners: new Map([['group', (() => 'owner') as unknown as string]]) };

    await expect(pool.render({ css: 'a', scope: undefined, file: uncloneable }, () => 'in-process')).resolves.toBe(
      'in-process'
    );
  });

  it('keeps rendering in process when no workers are allowed', () => {
    expect(createRenderPool(0, workerFile)).toBeNull();
  });
});
