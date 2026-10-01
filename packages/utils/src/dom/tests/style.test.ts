import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  addAnchorName,
  getAnchorNames,
  readCSSLength,
  resolveCSSLength,
  restoreInlineStyles,
  snapshotInlineStyles,
  withInlineStyles,
} from '../style';

describe('getAnchorNames', () => {
  it('returns normalized anchor names', () => {
    const el = document.createElement('button');

    el.style.setProperty('anchor-name', '--menu,  --tooltip');

    expect(getAnchorNames(el)).toEqual(['--menu', '--tooltip']);
  });

  it('returns no names for none', () => {
    const el = document.createElement('button');

    el.style.setProperty('anchor-name', 'none');

    expect(getAnchorNames(el)).toEqual([]);
  });
});

describe('addAnchorName', () => {
  it('composes anchor names and cleans up only its own name', () => {
    const el = document.createElement('button');
    const cleanupMenu = addAnchorName(el, 'settings-menu');
    const cleanupTooltip = addAnchorName(el, 'settings-tooltip');

    expect(getAnchorNames(el)).toEqual(['--settings-menu', '--settings-tooltip']);

    cleanupMenu();
    expect(getAnchorNames(el)).toEqual(['--settings-tooltip']);

    cleanupTooltip();
    expect(getAnchorNames(el)).toEqual([]);
  });

  it('preserves a pre-existing anchor name on cleanup', () => {
    const el = document.createElement('button');

    el.style.setProperty('anchor-name', '--settings-menu');

    const cleanup = addAnchorName(el, 'settings-menu');

    cleanup();

    expect(getAnchorNames(el)).toEqual(['--settings-menu']);
  });
});

describe('inline style snapshots', () => {
  it('normalizes property names and restores values and priorities', () => {
    const element = document.createElement('div');

    element.style.setProperty('min-width', '20px', 'important');
    // jsdom drops min-width priority; margin-left also exercises camel-case normalization and preserves priority.
    element.style.setProperty('margin-left', '5px', 'important');
    const snapshot = snapshotInlineStyles(element, ['minWidth', 'marginLeft', '--custom-size']);

    element.style.setProperty('min-width', '40px');
    element.style.setProperty('margin-left', '10px');
    element.style.setProperty('--custom-size', '10px');
    restoreInlineStyles(element, snapshot);

    expect(element.style.getPropertyValue('min-width')).toBe('20px');
    expect(element.style.getPropertyValue('margin-left')).toBe('5px');
    expect(element.style.getPropertyPriority('margin-left')).toBe('important');
    expect(element.style.getPropertyValue('--custom-size')).toBe('');
  });

  it('restores styles when a synchronous callback throws', () => {
    const element = document.createElement('div');

    element.style.width = '20px';

    expect(() =>
      withInlineStyles(element, { width: '40px' }, () => {
        expect(element.style.width).toBe('40px');
        throw new Error('stop');
      })
    ).toThrow('stop');
    expect(element.style.width).toBe('20px');
  });
});

describe('readCSSLength', () => {
  it('distinguishes absent values and preserves zero', () => {
    const element = document.createElement('div');

    expect(readCSSLength(element, '--size', { source: 'inline' })).toBeNull();

    element.style.setProperty('--size', '0px');
    expect(readCSSLength(element, '--size', { source: 'inline' })).toBe(0);
  });
});

describe('resolveCSSLength', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Returns px values directly', () => {
    const el = document.createElement('div');

    expect(resolveCSSLength(el, '8px')).toBe(8);
  });

  it('Resolves rem values using the root font size', () => {
    const el = document.createElement('div');
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(
      (target: Element) =>
        ({
          fontSize: target === document.documentElement ? '16px' : '14px',
        }) as CSSStyleDeclaration
    );

    expect(resolveCSSLength(el, '0.5rem')).toBe(8);

    getComputedStyleSpy.mockRestore();
  });

  it('Resolves em values using the element font size', () => {
    const el = document.createElement('div');
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(
      () =>
        ({
          fontSize: '14px',
        }) as CSSStyleDeclaration
    );

    expect(resolveCSSLength(el, '1em')).toBe(14);

    getComputedStyleSpy.mockRestore();
  });

  it('Falls back to measurement for other CSS lengths', () => {
    const el = document.createElement('div');
    const createElement = document.createElement.bind(document);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const node = createElement(tagName);

      if (tagName === 'div') {
        vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => {
          const width = node.style.inlineSize === '10vw' ? 24 : 0;

          return {
            x: 0,
            y: 0,
            width,
            height: 0,
            top: 0,
            left: 0,
            right: width,
            bottom: 0,
            toJSON() {},
          };
        });
      }

      return node;
    });

    expect(resolveCSSLength(el, '10vw')).toBe(24);
    expect(appendChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });

  it('Preserves measured zero pixel values', () => {
    const el = document.createElement('div');
    const createElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const node = createElement(tagName);

      if (tagName === 'div') {
        vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => ({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          toJSON() {},
        }));
      }

      return node;
    });

    expect(resolveCSSLength(el, 'calc(1px - 1px)')).toBe(0);

    createElementSpy.mockRestore();
  });

  it('Returns zero for invalid CSS lengths', () => {
    const el = document.createElement('div');
    const createElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const node = createElement(tagName);

      if (tagName === 'div') {
        vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => ({
          x: 0,
          y: 0,
          width: 640,
          height: 0,
          top: 0,
          left: 0,
          right: 640,
          bottom: 0,
          toJSON() {},
        }));
      }

      return node;
    });

    expect(resolveCSSLength(el, 'not-a-length')).toBe(0);

    createElementSpy.mockRestore();
  });

  it('Returns zero when a CSS length resolves to auto', () => {
    const el = document.createElement('div');
    const createElement = document.createElement.bind(document);
    const getComputedStyleSpy = vi
      .spyOn(globalThis, 'getComputedStyle')
      .mockImplementation((target: Element) =>
        target === el
          ? ({ length: 0, fontSize: '14px' } as CSSStyleDeclaration)
          : ({ inlineSize: 'auto' } as CSSStyleDeclaration)
      );
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const node = createElement(tagName);

      if (tagName === 'div') {
        vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => ({
          x: 0,
          y: 0,
          width: 640,
          height: 0,
          top: 0,
          left: 0,
          right: 640,
          bottom: 0,
          toJSON() {},
        }));
      }

      return node;
    });

    expect(resolveCSSLength(el, 'var(--missing-size)')).toBe(0);

    createElementSpy.mockRestore();
    getComputedStyleSpy.mockRestore();
  });

  it('Falls back to measurement for calc values', () => {
    const el = document.createElement('div');
    const createElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const node = createElement(tagName);

      if (tagName === 'div') {
        vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => ({
          x: 0,
          y: 0,
          width: node.style.inlineSize.startsWith('calc(') ? 8 : 0,
          height: 0,
          top: 0,
          left: 0,
          right: 8,
          bottom: 0,
          toJSON() {},
        }));
      }

      return node;
    });

    expect(resolveCSSLength(el, 'calc(0.5 * 16px)')).toBe(8);

    createElementSpy.mockRestore();
  });

  it('Copies custom properties from the source element when measuring', () => {
    const el = document.createElement('div');

    const createElement = document.createElement.bind(document);
    const getComputedStyleSpy = vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(
      () =>
        ({
          length: 1,
          fontSize: '14px',
          item(index: number) {
            return index === 0 ? '--size' : '';
          },
          getPropertyValue(name: string) {
            return name === '--size' ? '16px' : '';
          },
        }) as CSSStyleDeclaration
    );
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const node = createElement(tagName);

      if (tagName === 'div') {
        vi.spyOn(node, 'getBoundingClientRect').mockImplementation(() => ({
          x: 0,
          y: 0,
          width: node.style.getPropertyValue('--size') === '16px' ? 8 : 0,
          height: 0,
          top: 0,
          left: 0,
          right: 8,
          bottom: 0,
          toJSON() {},
        }));
      }

      return node;
    });

    expect(resolveCSSLength(el, 'calc(0.5 * var(--size))')).toBe(8);

    createElementSpy.mockRestore();
    getComputedStyleSpy.mockRestore();
  });
});
