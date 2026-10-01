import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { VJS10_DEMO_AUDIO, VJS10_DEMO_VIDEO } from '../../src/consts.ts';
import { demoPlaceholderPlugin } from '../replace-demo-placeholders.ts';

const DEMOS_DIRECTORY = resolve('src/components/docs/demos');

describe('demoPlaceholderPlugin', () => {
  const plugin = demoPlaceholderPlugin();

  it('registers the demo transform as a pre-transform', () => {
    expect(plugin.enforce).toBe('pre');
  });

  it('resolves placeholders in raw HTML demo imports', () => {
    const source =
      '<video src="{{VJS10_DEMO_VIDEO_MP4}}"></video>\n' +
      '<audio src="{{VJS10_DEMO_AUDIO_M4A}}"></audio>\n' +
      'Again: {{VJS10_DEMO_VIDEO_MP4}}';

    expect(plugin.transform(source, '/site/src/components/docs/demos/play-button.html?raw')).toBe(
      `<video src="${VJS10_DEMO_VIDEO.mp4}"></video>\n` +
        `<audio src="${VJS10_DEMO_AUDIO}"></audio>\n` +
        `Again: ${VJS10_DEMO_VIDEO.mp4}`
    );
  });

  it('throws for unknown placeholders in supported demo imports', () => {
    expect(() =>
      plugin.transform('{{UNKNOWN_DEMO_VIDEO}}', '/site/src/components/docs/demos/play-button.html?raw')
    ).toThrow('Unknown demo placeholder: {{UNKNOWN_DEMO_VIDEO}}');
  });

  it.each([
    '/site/src/components/docs/demos/play-button/react/css/BasicUsage.tsx',
    '/site/src/components/docs/demos/play-button/react/css/BasicUsage.tsx?raw',
  ])('resolves placeholders in React demo import %s', (id) => {
    expect(plugin.transform('{{VJS10_DEMO_VIDEO_MP4}}', id)).toBe(VJS10_DEMO_VIDEO.mp4);
  });

  it.each([
    '/site/src/components/docs/demos/play-button.html?draw=true',
    '/site/src/components/docs/demos/play-button.ts?raw',
    '/site/src/components/play-button.html?raw',
    '/site/src/components/play-button.tsx',
  ])('ignores unsupported demo import %s', (id) => {
    expect(plugin.transform('{{VJS10_DEMO_VIDEO_MP4}}', id)).toBeNull();
  });
});

describe('demo placeholders', () => {
  it('does not hardcode shared demo media URLs', () => {
    const demoFiles = [
      ...globSync('**/*.html', { cwd: DEMOS_DIRECTORY }),
      ...globSync('**/*.tsx', { cwd: DEMOS_DIRECTORY }),
    ];
    const hardcodedSources = demoFiles.filter((file) => {
      const source = readFileSync(resolve(DEMOS_DIRECTORY, file), 'utf8');

      return /https:\/\/(?:(?:stream|image)\.mux\.com|dash\.akamaized\.net|vimeo\.com)\//.test(source);
    });

    expect(hardcodedSources).toEqual([]);
  });
});
