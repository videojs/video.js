import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { applyShadowStyles, createShadowStyle, ensureGlobalStyle } from '../shadow-styles';

describe('createShadowStyle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a CSSStyleSheet when constructable stylesheets are available', () => {
    const result = createShadowStyle('div { color: red; }');

    expect(result).toBeInstanceOf(CSSStyleSheet);

    // SAFETY: The instance assertion above establishes the constructed-sheet branch.
    const sheet = result as CSSStyleSheet;

    expect(sheet.cssRules).toHaveLength(1);
    // SAFETY: The single authored rule is a style rule for the div selector.
    const rule = sheet.cssRules[0] as CSSStyleRule;

    expect(rule.selectorText).toBe('div');
    expect(rule.style.getPropertyValue('color')).toBe('red');
  });

  it('returns raw CSS string when CSSStyleSheet is unavailable', () => {
    vi.stubGlobal('CSSStyleSheet', undefined);

    const css = 'div { color: red; }';
    const result = createShadowStyle(css);

    expect(result).toBe(css);
  });

  it('returns raw CSS string when CSSStyleSheet exists but cannot be constructed', () => {
    // Safari before 16.4 exposes the interface but throws `Illegal constructor`.
    vi.stubGlobal(
      'CSSStyleSheet',
      class {
        constructor() {
          throw new TypeError('Illegal constructor');
        }
      }
    );

    const css = 'div { color: red; }';

    expect(createShadowStyle(css)).toBe(css);
  });
});

describe('applyShadowStyles', () => {
  function createHost(): HTMLElement {
    const host = document.createElement('div');

    host.attachShadow({ mode: 'open' });
    document.body.appendChild(host);
    return host;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('uses adoptedStyleSheets when supported and all styles are constructable', () => {
    const host = createHost();
    const shadowRoot = host.shadowRoot!;
    const sheet = new CSSStyleSheet();

    sheet.replaceSync('div { color: red; }');

    let assigned: CSSStyleSheet[] = [];

    Object.defineProperty(shadowRoot, 'adoptedStyleSheets', {
      get: () => assigned,
      set: (value: CSSStyleSheet[]) => {
        assigned = value;
      },
      configurable: true,
    });

    applyShadowStyles(shadowRoot, [sheet]);
    expect(assigned).toContain(sheet);
    expect(shadowRoot.querySelectorAll('style').length).toBe(0);
  });

  it('falls back to <style> injection for string styles', () => {
    const host = createHost();
    const css = 'div { color: blue; }';

    applyShadowStyles(host.shadowRoot!, [css]);
    const styleEls = host.shadowRoot!.querySelectorAll('style');

    expect(styleEls.length).toBe(1);
    expect(styleEls[0]!.textContent).toBe(css);
  });

  it('falls back to <style> injection when styles are mixed', () => {
    const host = createHost();
    const shadowRoot = host.shadowRoot!;
    const sheet = new CSSStyleSheet();

    sheet.replaceSync('div { color: red; }');
    const css = 'div { color: blue; }';
    const adopt = vi.fn();

    Object.defineProperty(shadowRoot, 'adoptedStyleSheets', {
      get: () => [],
      set: adopt,
      configurable: true,
    });

    applyShadowStyles(shadowRoot, [sheet, css]);

    expect(adopt).not.toHaveBeenCalled();
    expect([...shadowRoot.querySelectorAll('style')].map((style) => style.textContent)).toEqual([
      'div { color: red; }',
      css,
    ]);
  });
});

describe('ensureGlobalStyle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.head.innerHTML = '';
  });

  it('injects a <style> tag into document.head', () => {
    ensureGlobalStyle('test-style', 'body { margin: 0; }');

    const el = document.getElementById('test-style');

    expect(el).toBeInstanceOf(HTMLStyleElement);
    expect(el!.textContent).toBe('body { margin: 0; }');
  });

  it('does not duplicate when called twice with the same id', () => {
    ensureGlobalStyle('test-dedup', 'a { color: red; }');
    ensureGlobalStyle('test-dedup', 'a { color: blue; }');

    expect(document.querySelectorAll('#test-dedup').length).toBe(1);
    expect(document.getElementById('test-dedup')!.textContent).toBe('a { color: red; }');
  });

  it('does nothing when document is unavailable', () => {
    vi.stubGlobal('document', undefined);
    expect(() => ensureGlobalStyle('ssr', 'body {}')).not.toThrow();
  });
});
