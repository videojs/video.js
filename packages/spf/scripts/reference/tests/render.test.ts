import { describe, expect, it } from 'vite-plus/test';

import { demoteHeadings, exampleBlock } from '../render';

describe('exampleBlock', () => {
  it('dedents the lines after the first and fences them as TypeScript', () => {
    expect(exampleBlock('const a = 1;\n  const b = 2;\n    const c = 3;')).toBe(
      '```ts\nconst a = 1;\nconst b = 2;\n  const c = 3;\n```'
    );
  });

  it('keeps an already fenced body, dropping the semicolon the formatter leaves after the fence', () => {
    expect(exampleBlock('```html\n  <video></video>\n  ```;')).toBe('```html\n<video></video>\n```');
  });
});

describe('demoteHeadings', () => {
  it('demotes headings by two levels', () => {
    expect(demoteHeadings('# Title\n\n## Section')).toBe('### Title\n\n#### Section');
  });

  it('leaves lines inside code fences alone', () => {
    expect(demoteHeadings('```sh\n# a shell comment\n```')).toBe('```sh\n# a shell comment\n```');
  });
});
