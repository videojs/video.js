import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { normalizeRenderedContent } from '../rendered-content';

function normalize(html: string): string {
  const { document } = parseHTML(`<!doctype html><html><body><div id="root">${html}</div></body></html>`);
  const root = document.getElementById('root')!;

  normalizeRenderedContent(root);

  return root.innerHTML;
}

describe('normalizeRenderedContent', () => {
  it('drops opted-out markup, scripts, and styles', () => {
    expect(normalize('<p>kept</p><div data-llms-ignore>chrome</div><script>x()</script><style>p{}</style>')).toBe(
      '<p>kept</p>'
    );
  });

  it('reveals hidden text alternatives', () => {
    expect(normalize('<div hidden data-llms-only>Run the CLI.</div>')).toBe(
      '<div data-llms-only="">Run the CLI.</div>'
    );
  });

  it('unwraps Astro island and slot wrappers', () => {
    expect(
      normalize(
        '<astro-island><astro-slot><p>a</p></astro-slot><astro-static-slot><p>b</p></astro-static-slot></astro-island>'
      )
    ).toBe('<p>a</p><p>b</p>');
  });

  it('turns an aside into a blockquote led by its type and title', () => {
    expect(
      normalize(
        '<aside data-aside="tip"><p data-aside-title>Faster builds</p><div data-aside-body><p>Cache it.</p></div></aside>'
      )
    ).toBe('<blockquote><p><strong>Tip: Faster builds</strong></p><p>Cache it.</p></blockquote>');
  });

  it('replaces a tab group with its labeled panels', () => {
    expect(
      normalize(
        '<div data-tabs-root><button role="tab" data-value="a">npm</button><button role="tab" data-value="b">pnpm</button><div role="tabpanel" data-value="a">x</div><div role="tabpanel" data-value="b" hidden>y</div></div>'
      )
    ).toBe('<div><p><strong>npm</strong></p>\nx\n<p><strong>pnpm</strong></p>\ny</div>');
  });
});
