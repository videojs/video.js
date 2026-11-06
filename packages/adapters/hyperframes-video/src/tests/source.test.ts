import { describe, expect, it } from 'vite-plus/test';

import {
  buildCompositionDocument,
  buildInlineDocument,
  getMountContainer,
  getSourceSrc,
  isSameSource,
  resolveCompositionRoot,
} from '../source';

const RUNTIME = 'https://cdn.example.com/hyperframe.runtime.iife.js';
const BASE = 'https://example.com/compositions/intro/index.html';

describe('getSourceSrc', () => {
  it('names inline markup after its composition, since it has no URL', () => {
    expect(getSourceSrc({ content: '<div></div>' })).toBe('hyperframes:main');
    expect(getSourceSrc({ id: 'intro', content: '<div></div>' })).toBe('hyperframes:intro');
  });

  it('reports a document by its URL, and an inline document by name', () => {
    expect(getSourceSrc({ src: BASE })).toBe(BASE);
    expect(getSourceSrc({ id: 'doc', html: '<html></html>' })).toBe('hyperframes:doc');
    expect(getSourceSrc(null)).toBe('');
  });
});

describe('isSameSource', () => {
  it('takes a rebuilt mount function and timeline under the same id as the same composition', () => {
    const a = {
      id: 'intro',
      content: () => {},
      timeline: () => ({ duration: () => 1, seek: () => {}, pause: () => {} }),
    };
    const b = {
      id: 'intro',
      content: () => {},
      timeline: () => ({ duration: () => 2, seek: () => {}, pause: () => {} }),
    };

    expect(isSameSource(a, b)).toBe(true);
  });

  it('takes a new id, document, or markup as a new composition', () => {
    expect(isSameSource({ id: 'a', content: () => {} }, { id: 'b', content: () => {} })).toBe(false);
    expect(isSameSource({ html: '<p>1</p>' }, { html: '<p>2</p>' })).toBe(false);
    expect(isSameSource({ src: BASE }, { src: `${BASE}?v=2` })).toBe(false);
    expect(isSameSource({ content: '<p>1</p>' }, { content: '<p>2</p>' })).toBe(false);
    expect(isSameSource({ content: '<p>1</p>' }, { html: '<p>1</p>' })).toBe(false);
  });

  it('compares a template by identity, so its edits need an explicit reload', () => {
    const template = document.createElement('template');

    expect(isSameSource({ content: template }, { content: template })).toBe(true);
    expect(isSameSource({ content: template }, { content: document.createElement('template') })).toBe(false);
  });
});

describe('buildCompositionDocument', () => {
  it('puts the runtime first in the head, ahead of the document scripts, with a base for relative URLs', () => {
    const doc = buildCompositionDocument(
      '<!doctype html><html><head><script src="gsap.js"></script></head><body></body></html>',
      RUNTIME,
      BASE
    );

    expect(doc).toBe(
      `<!doctype html><html><head><base href="${BASE}" /><script src="${RUNTIME}"></script><script src="gsap.js"></script></head><body></body></html>`
    );
  });

  it('leaves a document that already carries the runtime and a base alone', () => {
    const html = `<html><head><base href="/x/"><script src="${RUNTIME}"></script></head></html>`;

    expect(buildCompositionDocument(html, RUNTIME, BASE)).toBe(html);
  });

  it('wraps a fragment in a document whose head carries the runtime', () => {
    expect(buildCompositionDocument('<div data-start="0"></div>', RUNTIME, BASE)).toBe(
      `<!doctype html><html><head><base href="${BASE}" /><script src="${RUNTIME}"></script></head><body><div data-start="0"></div></body></html>`
    );
  });
});

describe('resolveCompositionRoot', () => {
  function mount(markup: string): HTMLElement {
    const doc = document.implementation.createHTMLDocument();

    doc.documentElement.innerHTML = buildInlineDocument(markup, BASE);
    return getMountContainer(doc)!;
  }

  it('makes the mount container the root when the markup declares none', () => {
    const container = mount('<div class="clip" data-start="0" data-duration="1"></div>');
    const root = resolveCompositionRoot(container, { id: 'intro', width: 1280, height: 720, content: '' });

    expect(root).toBe(container);
    expect(root.getAttribute('data-composition-id')).toBe('intro');
    expect([root.getAttribute('data-width'), root.getAttribute('data-height')]).toEqual(['1280', '720']);
    expect([container.style.width, container.style.height]).toEqual(['1280px', '720px']);
  });

  it('keeps a root the markup declares, and sizes the container to it', () => {
    const container = mount('<div data-composition-id="mine" data-width="640" data-height="360"></div>');
    const root = resolveCompositionRoot(container, { content: '' });

    expect(root).not.toBe(container);
    expect(root.getAttribute('data-composition-id')).toBe('mine');
    expect(container.hasAttribute('data-composition-id')).toBe(false);
    expect([container.style.width, container.style.height]).toEqual(['640px', '360px']);
  });
});
