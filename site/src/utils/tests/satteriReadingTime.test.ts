// @vitest-environment node
// Sätteri's native binding builds typed-array buffers that fail against jsdom's
// patched ArrayBuffer/DataView globals; run these against the real node realm.
import { markdownToHtml } from 'satteri';
import { describe, expect, it } from 'vite-plus/test';

import { satteriReadingTime } from '../satteriReadingTime';

function render(source: string) {
  const data = {
    astro: {
      frontmatter: {} as Record<string, unknown>,
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  };

  markdownToHtml(source, { mdastPlugins: [satteriReadingTime()], data });
  return data.astro.frontmatter;
}

describe('satteriReadingTime', () => {
  it('injects reading time into the frontmatter bag', () => {
    const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
    const frontmatter = render(`# Title\n\n${words}`);

    expect(frontmatter.readingTimeMinutes).toBeCloseTo(501 / 200, 6);
    expect(frontmatter.minutesRead).toBe('3 min read');
  });

  it('counts code and inline code toward the total', () => {
    const withCode = render('# Title\n\nSome `inline` text\n\n```ts\nconst a = 1;\n```');

    expect(withCode.readingTimeMinutes).toBeCloseTo(8 / 200, 6);
    expect(withCode.minutesRead).toBe('1 min read');
  });
});
