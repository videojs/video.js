import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vite-plus/test';

const sharedContainerStyles = new URL('../styles/layout/container.styles.ts', import.meta.url);

const containerStyles = [
  sharedContainerStyles,
  new URL('../skins/compat/shared/container.styles.ts', import.meta.url),
  new URL('../skins/scaffold/shared/container.styles.ts', import.meta.url),
].map((url) => [url.pathname.split('/src/')[1], url] as const);

// Audio embeds carry the same marker but set their own height, so only the video presets stretch embeds.
const videoPresetStyles = [
  new URL('../skins/shared/video/skin.styles.ts', import.meta.url),
  new URL('../skins/compat/shared/container.styles.ts', import.meta.url),
  new URL('../skins/scaffold/shared/container.styles.ts', import.meta.url),
].map((url) => [url.pathname.split('/src/')[1], url] as const);

describe('container styles', () => {
  it.each(containerStyles)('sizes the slotted video in the Shadow DOM (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).toContain('[&>slot::slotted(video)]:h-full!');
    expect(source).toContain('[&>slot::slotted(video)]:w-full');
    expect(source).toContain('[&>slot::slotted(video)]:object-media');
  });

  it.each(containerStyles)('lets the container shrink inside the Shadow DOM host grid (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).toContain("'min-h-0 min-w-0'");
  });

  it('defines the slotted iframe embed fill once for every skin', async () => {
    const source = await readFile(sharedContainerStyles, 'utf8');

    expect(source).toContain("'[&>slot::slotted([data-cross-origin-frame])]'");
    expect(source).toContain('${slottedEmbed}:h-full!');
    expect(source).toContain('${slottedEmbed}:min-w-0 ${slottedEmbed}:min-h-0');
  });

  it.each(videoPresetStyles)('stretches slotted iframe embeds in the Shadow DOM (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).toContain("'shadow-dom': slottedEmbedFill");
  });

  // The HTML container sits inside the skin's shadow root, so a ratio on it beats any `aspect-ratio` the page sets on the host.
  it.each(containerStyles)('does not force an aspect ratio (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).not.toMatch(/\baspect-/);
  });
});
