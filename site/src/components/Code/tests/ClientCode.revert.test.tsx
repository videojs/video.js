import { act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import ClientCode from '../ClientCode';
import serverHighlighter from '../serverHighlighter';
import Shared from '../Shared';

// A file of its own keeps the highlighter cold, as it is when a reader first changes the code.
describe('ClientCode', () => {
  let root: Root | null = null;

  afterEach(async () => {
    if (root) await act(() => root?.unmount());

    root = null;
    document.body.replaceChildren();
  });

  it('shows code that changes back to the server code before the highlighter loads', async () => {
    const code = 'const command = "pnpm dev";';
    const replacement = 'const command = "pnpm build";';
    const container = document.createElement('div');

    container.innerHTML = renderToString(
      createElement(Shared, { code, lang: 'typescript', highlighter: serverHighlighter })
    );
    document.body.append(container);

    await act(async () => {
      root = hydrateRoot(container, createElement(ClientCode, { code, lang: 'typescript' }));
    });

    // Synchronous acts commit each change before the highlighter's lazy chunks can load.
    act(() => root?.render(createElement(ClientCode, { code: replacement, lang: 'typescript' })));
    act(() => root?.render(createElement(ClientCode, { code, lang: 'typescript' })));

    expect(container.querySelector('code')?.textContent).toBe(code);

    await waitFor(() => expect(container.querySelectorAll('.line span[style]')).not.toHaveLength(0));
    expect(container.querySelector('code')?.textContent).toBe(code);
  });
});
