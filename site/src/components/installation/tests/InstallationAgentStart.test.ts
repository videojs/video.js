// @vitest-environment node
import { getContainerRenderer } from '@astrojs/react/container-renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { describe, expect, it } from 'vite-plus/test';

import InstallationAgentStart from '../InstallationAgentStart.astro';

async function renderPage(path: string, framework: string): Promise<string> {
  const container = await AstroContainer.create({ renderers: await loadRenderers([getContainerRenderer()]) });

  return container.renderToString(InstallationAgentStart, {
    params: { framework },
    request: new Request(`https://videojs.org${path}`),
  });
}

function decode(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');
}

/** The prompt the Markdown twin publishes. */
async function renderPrompt(framework: string, path = `/docs/guides/installation/${framework}`): Promise<string> {
  const html = await renderPage(path, framework);

  return decode(html.match(/<code[^>]*data-agent-prompt-markdown[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? '');
}

describe('InstallationAgentStart', () => {
  it.each([
    ['react', ['`npx @videojs/cli agents init --framework react`']],
    ['html', ['`npx @videojs/cli agents init --framework html`']],
    ['cdn', ['`npx @videojs/cli agents init --method cdn --framework html`']],
    ['vue', ['`npx @videojs/cli agents init --framework vue`']],
    ['svelte', ['`npx @videojs/cli agents init --framework svelte`']],
    [
      'shadcn',
      [
        '`npx @videojs/cli agents init --method shadcn --framework react` for React',
        '`npx @videojs/cli agents init --method shadcn --framework html` for plain HTML',
      ],
    ],
  ])(
    'sends the %s prompt to agents skills, the skill repository, and the route installation command',
    async (route, init) => {
      const prompt = await renderPrompt(route);

      expect(prompt).toContain(
        'Install the Video.js skill: `npx @videojs/cli agents skills`. Run it and follow the steps for the agent you are running in'
      );
      expect(prompt).toContain('follow the install instructions at https://github.com/videojs/skills instead');

      for (const command of init) expect(prompt).toContain(command);
    }
  );

  it('keeps the docs framework command in the Build with AI Markdown prompt', async () => {
    const prompt = await renderPrompt('html', '/docs/framework/html/guides/build-with-ai');

    expect(prompt).toContain('`npx @videojs/cli agents init --framework html`');
  });

  it("prerenders the reader's prompt with only the look and media stated", async () => {
    const html = await renderPage('/docs/guides/installation/vue', 'vue');

    // The command shows the options it states exactly as copied; the CLI detects or guides the rest.
    expect(decode(html)).toContain('`npx @videojs/cli agents init --skin default --source-url demo`');
    expect(decode(html)).toContain('2. Add a Video.js player to this project:');
    // The Markdown twin drops the interactive prompt and keeps the route-level one.
    expect(html).toMatch(/<div data-llms-ignore>(?:(?!<\/div>)[\s\S])*<astro-island[^>]*AgentPrompt/);
  });
});
