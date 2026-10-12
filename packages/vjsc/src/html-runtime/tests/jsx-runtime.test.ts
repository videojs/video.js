import { describe, expect, it } from 'vite-plus/test';

import * as runtime from '../jsx-runtime';

describe('jsx', () => {
  it('resolves scoped IDs uniquely for repeated component instances', async () => {
    const component = () =>
      runtime.jsx(runtime.Scope, {
        prefix: 'fixture',
        children: runtime.jsx('button', { id: '__vjsc-id-fixture-trigger' }),
      });
    const output = runtime.jsx(runtime.Fragment, { children: [component(), component()] });

    expect(String(output)).toBe(
      '<button id="vjs-fixture-trigger"></button><button id="vjs-fixture-2-trigger"></button>'
    );
  });

  it('forwards host attributes to one dynamic element child', async () => {
    const output = runtime.jsx(runtime.Host, {
      class: ['trigger', 'active'],
      id: 'trigger',
      children: runtime.jsx('button', { className: 'button' }),
    });

    expect(String(output)).toBe('<button class="button trigger active" id="trigger"></button>');
  });

  it('flattens class arrays after HTML attribute normalization', async () => {
    const output = runtime.jsx('media-icon', { class: ['icon', ['active', false, undefined]] });

    expect(String(output)).toBe('<media-icon class="icon active"></media-icon>');
  });

  it('escapes attribute and child text with the shared HTML contract', async () => {
    const value = `&<>"'\``;
    const output = runtime.jsx('span', { title: value, children: value });

    expect(String(output)).toBe('<span title="&amp;&lt;&gt;&quot;&#39;&#96;">&amp;&lt;&gt;&quot;&#39;&#96;</span>');
  });

  it('serializes SVG attribute names without corrupting case-sensitive names', async () => {
    const output = runtime.jsx('svg', {
      viewBox: '0 0 18 18',
      preserveAspectRatio: 'xMidYMid meet',
      strokeWidth: 2,
      xlinkHref: '#icon',
    });

    expect(String(output)).toBe(
      '<svg viewBox="0 0 18 18" preserveAspectRatio="xMidYMid meet" stroke-width="2" xlink:href="#icon"></svg>'
    );
  });

  it('serializes HTML void elements without children or closing tags', () => {
    const output = runtime.jsx(runtime.Fragment, {
      children: [
        runtime.jsx('img', { alt: '', children: 'ignored' }),
        runtime.jsx('source', { src: '/video.mp4' }),
        runtime.jsx('media-icon', {}),
      ],
    });

    expect(String(output)).toBe('<img alt=""><source src="/video.mp4"><media-icon></media-icon>');
  });
});
