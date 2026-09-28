import { describe, expect, it } from 'vite-plus/test';

import { extractScriptsAndStyles } from '../extractScriptsAndStyles';

describe('extractScriptsAndStyles', () => {
  it('returns an empty string when the fragment has no scripts or styles', () => {
    expect(extractScriptsAndStyles('<div class="contents"><p>Hello</p></div>')).toBe('');
    expect(extractScriptsAndStyles('')).toBe('');
  });

  it('keeps script and style elements in document order and drops the markup around them', () => {
    const html = [
      '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>',
      '<script>(self.Astro||(self.Astro={})).idle=(a)=>a();</script>',
      '<astro-island uid="x" client="idle"><button>Play</button></astro-island>',
      '<script type="module" src="/src/components/Demo.astro?astro&type=script&index=0&lang.ts"></script>',
    ].join('');

    expect(extractScriptsAndStyles(html)).toBe(
      '<style>astro-island,astro-slot,astro-static-slot{display:contents}</style>' +
        '<script>(self.Astro||(self.Astro={})).idle=(a)=>a();</script>' +
        '<script type="module" src="/src/components/Demo.astro?astro&type=script&index=0&lang.ts"></script>'
    );
  });

  it('keeps script bodies that contain angle brackets and closing tags of other elements', () => {
    const script = '<script>if (a < b) { document.body.innerHTML = "</div>"; }</script>';

    expect(extractScriptsAndStyles(`<div>${script}</div>`)).toBe(script);
  });

  it('ignores escaped script tags inside code blocks', () => {
    expect(extractScriptsAndStyles('<pre><code>&lt;script&gt;alert(1)&lt;/script&gt;</code></pre>')).toBe('');
  });

  it('does not treat elements whose names merely start with script or style as matches', () => {
    expect(extractScriptsAndStyles('<scripted-thing>x</scripted-thing><styled-box>y</styled-box>')).toBe('');
  });
});
