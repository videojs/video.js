import { describe, expect, it } from 'vitest';

import { cleanFeedHtml } from '../feedHtml';

const ENTRY_URL = new URL('https://videojs.org/blog/hello');

describe('cleanFeedHtml', () => {
  it('makes every URL absolute', () => {
    const html = cleanFeedHtml(
      '<a href="/docs/install">install</a><img src="/_astro/shot.webp" srcset="/a.webp 1x, /a@2x.webp 2x" alt="">',
      ENTRY_URL
    );

    expect(html).toContain('href="https://videojs.org/docs/install"');
    expect(html).toContain('src="https://videojs.org/_astro/shot.webp"');
    expect(html).toContain('srcset="https://videojs.org/a.webp 1x, https://videojs.org/a@2x.webp 2x"');
  });

  it('resolves in-page fragments against the entry, since the reader is not on the page', () => {
    expect(cleanFeedHtml('<a href="#setup">setup</a>', ENTRY_URL)).toBe(
      '<a href="https://videojs.org/blog/hello#setup">setup</a>'
    );
  });

  it('leaves absolute URLs and other schemes alone', () => {
    const html = cleanFeedHtml(
      '<a href="https://github.com/videojs/v10">repo</a><a href="mailto:a@b.c">mail</a><img src="data:image/gif;base64,AA" alt="">',
      ENTRY_URL
    );

    expect(html).toContain('href="https://github.com/videojs/v10"');
    expect(html).toContain('href="mailto:a@b.c"');
    expect(html).toContain('src="data:image/gif;base64,AA"');
  });

  it('drops markup that cannot work in a reader', () => {
    expect(
      cleanFeedHtml('<p>kept</p><script>alert(1)</script><style>p{}</style><noscript>x</noscript>', ENTRY_URL)
    ).toBe('<p>kept</p>');
  });

  it('drops decoration hidden from assistive technology', () => {
    expect(cleanFeedHtml('<h2>Setup<svg aria-hidden="true"><path/></svg></h2>', ENTRY_URL)).toBe('<h2>Setup</h2>');
  });

  it('strips presentation hooks, including inline colors that assume a dark background', () => {
    expect(
      cleanFeedHtml(
        '<pre class="astro-code" tabindex="0"><code><span class="line"><span style="color:#B8BB26">npm</span></span></code></pre>',
        ENTRY_URL
      )
    ).toBe('<pre tabindex="0"><code>npm</code></pre>');
    expect(cleanFeedHtml('<p data-llms-content class="mb-2">x</p>', ENTRY_URL)).toBe('<p>x</p>');
  });

  it('keeps the server-rendered markup of an island, minus its wrapper', () => {
    expect(
      cleanFeedHtml(
        '<p>Try it at <astro-island component-url="/x.js"><a href="/docs">videojs.org/docs</a></astro-island>.</p>',
        ENTRY_URL
      )
    ).toBe('<p>Try it at <a href="https://videojs.org/docs">videojs.org/docs</a>.</p>');
  });

  it('honors the same opt-out and text-alternative markers as the Markdown twins', () => {
    expect(
      cleanFeedHtml(
        '<div data-llms-ignore><button>Copy</button></div><p hidden data-llms-only>Run the CLI.</p>',
        ENTRY_URL
      )
    ).toBe('<p>Run the CLI.</p>');
  });

  it('turns an aside into a labeled blockquote', () => {
    expect(
      cleanFeedHtml(
        '<aside data-aside="caution"><div class="w-1.5"></div><div><p data-aside-title>Caution</p><div data-aside-body><p>Careful.</p></div></div></aside>',
        ENTRY_URL
      )
    ).toBe('<blockquote><p><strong>Caution</strong></p><p>Careful.</p></blockquote>');
  });

  it('reduces a code frame to its code, keeping a title the code cannot carry', () => {
    const frame = (label: string) =>
      `<astro-island><div data-tabs-root><div role="tablist"><button role="tab" data-value="code">${label}</button><button>Copy</button></div><astro-island><div role="tabpanel" data-value="code"><astro-slot><pre data-language="ts"><code>x</code></pre></astro-slot></div></astro-island></div></astro-island>`;

    expect(cleanFeedHtml(frame('ts'), ENTRY_URL)).toBe('<pre><code>x</code></pre>');
    expect(cleanFeedHtml(frame('player.ts'), ENTRY_URL)).toBe(
      '<p><strong>player.ts</strong></p>\n<pre><code>x</code></pre>'
    );
  });

  it('unwraps slot placeholders', () => {
    expect(cleanFeedHtml('<figure><astro-slot><pre>x</pre></astro-slot></figure>', ENTRY_URL)).toBe(
      '<figure><pre>x</pre></figure>'
    );
  });

  it('removes layout wrappers once their decoration is gone', () => {
    expect(
      cleanFeedHtml(
        '<section><div class="w-2"></div><div><div><svg aria-hidden="true"></svg></div><p>Note</p></div></section>',
        ENTRY_URL
      )
    ).toBe('<section><p>Note</p></section>');
    expect(cleanFeedHtml('<div class="a">one</div><div class="b">two</div>', ENTRY_URL)).toBe(
      '<div>one</div><div>two</div>'
    );
    expect(cleanFeedHtml('<div><a href="/a">A</a></div><div><code>b</code></div>', ENTRY_URL)).toBe(
      '<div><a href="https://videojs.org/a">A</a></div><div><code>b</code></div>'
    );
  });

  it('flattens code to plain text, keeping its line breaks', () => {
    expect(
      cleanFeedHtml(
        '<pre><code><span class="line">a</span>\n<span class="line"></span>\n<span class="line">b</span></code></pre>',
        ENTRY_URL
      )
    ).toBe('<pre><code>a\n\nb</code></pre>');
  });

  it('removes render markers', () => {
    expect(cleanFeedHtml('<p>Try <a href="/docs">it</a><!--astro:end--></p>', ENTRY_URL)).toBe(
      '<p>Try <a href="https://videojs.org/docs">it</a></p>'
    );
  });
});
