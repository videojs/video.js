import { resolve } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { defaultTemplateSource, loadTemplates } from '../templates';

const templates = resolve(import.meta.dirname, '../../../templates/skin');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadTemplates', () => {
  it('reads the selected template folders from a local checkout', async () => {
    const loaded = await loadTemplates(templates, ['shared', 'html']);

    expect([...loaded.keys()]).toEqual(['shared', 'html']);
    expect(loaded.get('shared')!.has('apps/preview/index.html')).toBe(true);
    expect(loaded.get('html')!.has('apps/preview/src/main.ts')).toBe(true);
  });

  it('downloads only the selected folders from the build commit, all at once', async () => {
    vi.stubGlobal('__SKIN_TEMPLATES__', {
      ref: 'abc123',
      files: ['shared/_gitignore', 'react/apps/preview/src/frame/main.tsx', 'html/apps/preview/src/frame/main.ts'],
    });

    const fetched: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetched.push(url);
        return new Response(`content of ${url.split('/skin/')[1]}`);
      })
    );

    const loaded = await loadTemplates(defaultTemplateSource(), ['shared', 'react']);

    expect(fetched.sort()).toEqual([
      'https://raw.githubusercontent.com/videojs/video.js/abc123/packages/cli/templates/skin/react/apps/preview/src/frame/main.tsx',
      'https://raw.githubusercontent.com/videojs/video.js/abc123/packages/cli/templates/skin/shared/_gitignore',
    ]);
    expect(loaded.get('react')!.get('apps/preview/src/frame/main.tsx')).toBe(
      'content of react/apps/preview/src/frame/main.tsx'
    );
  });

  it('reports a failed download', async () => {
    vi.stubGlobal('__SKIN_TEMPLATES__', { ref: 'abc123', files: ['shared/_gitignore'] });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404, statusText: 'Not Found' }))
    );

    await expect(loadTemplates(defaultTemplateSource(), ['shared'])).rejects.toThrow(/404 Not Found/);
  });

  it('asks for a local folder when the build recorded no templates', async () => {
    await expect(loadTemplates(defaultTemplateSource(), ['shared'])).rejects.toThrow(/--templates/);
  });
});
