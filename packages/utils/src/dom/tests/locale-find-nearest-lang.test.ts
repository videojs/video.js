import { afterEach, describe, expect, it } from 'vite-plus/test';

import { findNearestLang } from '../locale/find-nearest-lang';

describe('findNearestLang', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
  });

  it('returns undefined for null start', () => {
    expect(findNearestLang(null)).toBeUndefined();
  });

  it('reads lang on the start element', () => {
    const el = document.createElement('div');

    el.setAttribute('lang', 'fr');
    document.body.appendChild(el);
    expect(findNearestLang(el)).toBe('fr');
  });

  it('walks ancestors and prefers closest lang', () => {
    const outer = document.createElement('section');

    outer.setAttribute('lang', 'de');
    const inner = document.createElement('div');

    inner.setAttribute('lang', 'fr');
    const leaf = document.createElement('span');

    inner.appendChild(leaf);
    outer.appendChild(inner);
    document.body.appendChild(outer);
    expect(findNearestLang(leaf)).toBe('fr');
  });

  it('inherits from an ancestor when start has no lang', () => {
    const outer = document.createElement('section');

    outer.setAttribute('lang', 'de');
    const inner = document.createElement('div');

    outer.appendChild(inner);
    document.body.appendChild(outer);
    expect(findNearestLang(inner)).toBe('de');
  });

  it('ignores empty lang and continues walking', () => {
    const outer = document.createElement('section');

    outer.setAttribute('lang', 'de');
    const inner = document.createElement('div');

    inner.setAttribute('lang', '  ');
    outer.appendChild(inner);
    document.body.appendChild(outer);
    expect(findNearestLang(inner)).toBe('de');
  });

  it('reads lang IDL property on html when set via documentElement.lang', () => {
    document.documentElement.lang = 'fr';
    const inner = document.createElement('div');

    document.body.appendChild(inner);
    expect(findNearestLang(inner)).toBe('fr');
  });
});
