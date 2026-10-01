import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';

import { getClientHighlighter } from '../clientHighlighter';
import serverHighlighter from '../serverHighlighter';
import Shared from '../Shared';

describe('getClientHighlighter', () => {
  it('load every generated installation language', async () => {
    const client = await getClientHighlighter();

    expect(client.getLoadedLanguages()).toEqual(expect.arrayContaining(['astro', 'json']));
    expect(serverHighlighter.getLoadedLanguages()).toContain('astro');
  });
});

describe('Shared', () => {
  it('focuses selected generated lines without changing their copyable text', () => {
    const code = '{\n  "components": "@/components"\n}';
    const markup = renderToString(
      createElement(Shared, { code, focusLines: [2], lang: 'json', highlighter: serverHighlighter })
    );

    const container = document.createElement('div');

    container.innerHTML = markup;

    const lines = [...container.querySelectorAll('.line')];

    expect(container.querySelector('code')?.textContent).toBe(code);
    expect(lines).toHaveLength(3);
    expect(lines.map((line) => line.classList.contains('focused'))).toEqual([false, true, false]);
  });
});
