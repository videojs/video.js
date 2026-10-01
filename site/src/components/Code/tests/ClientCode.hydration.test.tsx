import { act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import ClientCode from '../ClientCode';
import serverHighlighter from '../serverHighlighter';
import Shared from '../Shared';

// Vitest isolates this module from the streaming suite, which warms ClientCode's lazy highlighter.
describe('ClientCode', () => {
  let root: Root | null = null;

  afterEach(async () => {
    if (root) await act(() => root?.unmount());

    root = null;
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('preserves cold server-highlighted markup and highlights subsequent code changes', async () => {
    const code = 'const command = "pnpm dev";\nconsole.log(command);';
    const replacement = 'const command = "pnpm build";\nconsole.info(command);';
    const container = document.createElement('div');
    const errors = vi.spyOn(console, 'error');

    container.innerHTML = renderToString(
      createElement(Shared, { code, lang: 'typescript', highlighter: serverHighlighter })
    );
    document.body.append(container);

    const serverMarkup = container.innerHTML;

    expect(container.querySelectorAll('.line span[style]')).not.toHaveLength(0);
    expect(container.querySelector('code')?.textContent).toBe(code);

    await act(async () => {
      root = hydrateRoot(container, createElement(ClientCode, { code, lang: 'typescript' }));
    });

    expect(container.innerHTML).toBe(serverMarkup);
    expect(container.querySelector('code')?.textContent).toBe(code);
    expect(errors).not.toHaveBeenCalled();

    await act(async () => {
      root?.render(createElement(ClientCode, { code: replacement, lang: 'typescript' }));
    });

    await waitFor(() => {
      expect(container.querySelector('code')?.textContent).toBe(replacement);
      expect(container.querySelectorAll('.line')).toHaveLength(2);
      expect(container.querySelectorAll('.line span[style]')).not.toHaveLength(0);
    });

    expect(errors).not.toHaveBeenCalled();
  });
});
