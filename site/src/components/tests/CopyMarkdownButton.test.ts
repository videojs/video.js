import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import CopyMarkdownButton from '../CopyMarkdownButton';

const initialUrl = window.location.href;
const initialHistoryState = window.history.state;
const initialRegistryFramework = document.documentElement.dataset.registryFramework;

afterEach(() => {
  cleanup();
  window.history.replaceState(initialHistoryState, '', initialUrl);

  if (initialRegistryFramework === undefined) delete document.documentElement.dataset.registryFramework;
  else document.documentElement.dataset.registryFramework = initialRegistryFramework;
});

async function expectAssistantLinks(prompt: string): Promise<void> {
  for (const [name, origin, parameter] of [
    ['Open in ChatGPT', 'https://chatgpt.com', 'prompt'],
    ['Open in Claude', 'https://claude.ai', 'q'],
  ]) {
    const link = await screen.findByRole('menuitem', { name });

    await waitFor(() => {
      expect(link).toHaveAttribute('href');

      const href = link.getAttribute('href')!;
      const url = new URL(href);

      expect(url.origin).toBe(origin);
      expect(url.searchParams.get(parameter)).toBe(prompt);
      expect(decodeURIComponent(href)).not.toContain('source-url');
      expect(decodeURIComponent(href)).not.toContain('signed.m3u8');
    });
  }
}

describe('CopyMarkdownButton', () => {
  it.each([
    {
      name: 'preserves installation query parameters on the Markdown twin',
      url: '/docs/guides/installation/shadcn/?framework=html&preset=audio',
      markdown: 'http://localhost:3000/docs/guides/installation/shadcn.md?framework=html&preset=audio',
    },
    {
      name: 'uses the visible saved Shadcn source framework when the URL is not normalized yet',
      url: '/docs/guides/installation/shadcn?preset=audio',
      framework: 'html',
      markdown: 'http://localhost:3000/docs/guides/installation/shadcn.md?framework=html&preset=audio',
    },
    {
      name: 'copies the normalized choices shown by an installation page',
      url: '/docs/guides/installation/shadcn?framework=html&preset=audio&skin=fancy&media=youtube&package-manager=deno&template=next&styling=tailwind',
      framework: 'html',
      markdown: 'http://localhost:3000/docs/guides/installation/shadcn.md?framework=html&preset=audio',
    },
    {
      name: 'keeps compatible Shadcn template and styling choices',
      url: '/docs/guides/installation/shadcn?framework=react&template=vite&styling=css',
      markdown: 'http://localhost:3000/docs/guides/installation/shadcn.md?framework=react&template=vite&styling=css',
    },
    {
      name: 'drops Markdown-only aliases and normalizes unsupported Shadcn combinations',
      url: '/docs/guides/installation/shadcn?framework=react&preset=background-video&skin=none&media=background-video&package-manager=pnpm',
      markdown: 'http://localhost:3000/docs/guides/installation/shadcn.md?framework=react',
    },
    {
      name: 'keeps a private source URL for copying but removes it from assistant links',
      url: '/docs/guides/installation/react?source-url=https%3A%2F%2Fexample.com%2Fsigned.m3u8&preset=audio&template=next&styling=tailwind',
      markdown:
        'http://localhost:3000/docs/guides/installation/react.md?source-url=https%3A%2F%2Fexample.com%2Fsigned.m3u8&preset=audio',
      publicPrompt:
        'Read http://localhost:3000/docs/guides/installation/react.md?preset=audio so I can ask questions about it.',
    },
  ])('$name', async ({ url, framework, markdown, publicPrompt }) => {
    const user = userEvent.setup();

    window.history.replaceState(null, '', url);

    if (framework) document.documentElement.dataset.registryFramework = framework;

    render(createElement(CopyMarkdownButton));
    await user.click(await screen.findByRole('button', { name: 'More ways to use this page' }));

    const link = await screen.findByRole('menuitem', { name: 'View as Markdown' });

    await waitFor(() => expect(link).toHaveAttribute('href', markdown));

    if (publicPrompt) await expectAssistantLinks(publicPrompt);
  });

  it('refreshes menu links from the current URL whenever the menu opens', async () => {
    const user = userEvent.setup();

    window.history.replaceState(null, '', '/docs/guides/installation/shadcn?framework=react');
    render(createElement(CopyMarkdownButton));

    const trigger = await screen.findByRole('button', { name: 'More ways to use this page' });

    await user.click(trigger);
    expect(await screen.findByRole('menuitem', { name: 'View as Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:3000/docs/guides/installation/shadcn.md?framework=react'
    );

    await user.keyboard('{Escape}');
    window.history.replaceState(null, '', '/docs/guides/installation/shadcn?framework=html');
    await user.click(trigger);

    expect(await screen.findByRole('menuitem', { name: 'View as Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:3000/docs/guides/installation/shadcn.md?framework=html'
    );
  });

  it('never sends a private source URL to an assistant', async () => {
    const user = userEvent.setup();

    window.history.replaceState(
      null,
      '',
      '/docs/guides/installation/react?preset=audio&source-url=https%3A%2F%2Fexample.com%2Fsigned.m3u8'
    );
    render(createElement(CopyMarkdownButton));

    await user.click(await screen.findByRole('button', { name: 'More ways to use this page' }));

    const markdownLink = await screen.findByRole('menuitem', { name: 'View as Markdown' });

    await waitFor(() =>
      expect(markdownLink).toHaveAttribute(
        'href',
        'http://localhost:3000/docs/guides/installation/react.md?preset=audio&source-url=https%3A%2F%2Fexample.com%2Fsigned.m3u8'
      )
    );

    await expectAssistantLinks(
      'Read http://localhost:3000/docs/guides/installation/react.md?preset=audio so I can ask questions about it.'
    );
  });
});
