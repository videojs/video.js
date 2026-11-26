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
  it('defines the slotted video fill once for every skin', async () => {
    const source = await readFile(sharedContainerStyles, 'utf8');

    expect(source).toContain("'[&>slot::slotted(video)]'");
    expect(source).toContain('${slottedVideo}:h-full!');
    expect(source).toContain('${slottedVideo}:w-full');
    expect(source).toContain('${slottedVideo}:object-media');
  });

  it.each(containerStyles)(
    'sizes the slotted video and lets the container shrink in the Shadow DOM (%s)',
    async (_, url) => {
      const source = await readFile(url, 'utf8');

      expect(source).toContain("'shadow-dom': ['min-h-0 min-w-0', ...slottedVideoFill]");
    }
  );

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

  it('defines the child iframe embed fill once for every skin', async () => {
    const source = await readFile(sharedContainerStyles, 'utf8');

    expect(source).toContain("'[&>[data-cross-origin-frame]]'");
    expect(source).toContain('${childEmbed}:h-full!');
    expect(source).toContain('${childEmbed}:min-w-0 ${childEmbed}:min-h-0');
  });

  // Registry skins have no shadow root, so the page's embed is a child of the container rather than slotted into it.
  it.each(videoPresetStyles)('stretches child iframe embeds without a shadow root (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).toMatch(/utilities: \[[^\]]*\.\.\.childEmbedFill\]/);
  });

  // The container ring can sit on the page, so it reads the public color instead of the control ring.
  it.each(containerStyles)('colors the container focus ring with the public focus ring color (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).toContain('focus-visible:outline-media-focus-ring');
    expect(source).not.toContain('outline-media-ring');
  });

  // The HTML container sits inside the skin's shadow root, so a ratio on it beats any `aspect-ratio` the page sets on the host.
  it.each(containerStyles)('does not force an aspect ratio (%s)', async (_, url) => {
    const source = await readFile(url, 'utf8');

    expect(source).not.toMatch(/\baspect-/);
  });
});
