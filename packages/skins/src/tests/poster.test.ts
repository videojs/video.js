import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vite-plus/test';

const posterStyles = [
  new URL('../styles/display/poster.styles.ts', import.meta.url),
  new URL('../skins/compat/shared/poster.styles.ts', import.meta.url),
  new URL('../skins/scaffold/shared/poster.styles.ts', import.meta.url),
].map((url) => [url.pathname.split('/src/')[1], url] as const);

describe('poster styles', () => {
  it.each(posterStyles)('fills the poster with a slotted image in the Shadow DOM (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).toContain('[&>slot::slotted(img)]:h-full!');
    expect(source).toContain('[&>slot::slotted(img)]:object-media');
  });
});
