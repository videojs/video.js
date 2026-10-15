import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { loadTemplates } from '../templates';

const templates = resolve(import.meta.dirname, '../../../templates/skin');

describe('loadTemplates', () => {
  it('reads only the selected template folders', async () => {
    const loaded = await loadTemplates(templates, ['shared', 'html']);

    expect([...loaded.keys()]).toEqual(['shared', 'html']);
    expect(loaded.get('shared')!.has('apps/preview/index.html')).toBe(true);
    expect(loaded.get('html')!.has('apps/preview/src/frame/main.ts')).toBe(true);
  });

  it('names the folder it could not read', async () => {
    await expect(loadTemplates(templates, ['vue'])).rejects.toThrow(/templates\/skin\/vue/);
  });
});
