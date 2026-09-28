// @vitest-environment node
import { getContainerRenderer } from '@astrojs/react/container-renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { describe, expect, it } from 'vite-plus/test';

import InstallationAgentStart from '../InstallationAgentStart.astro';

async function renderPrompt(framework: string): Promise<string> {
  const container = await AstroContainer.create({ renderers: await loadRenderers([getContainerRenderer()]) });
  const html = await container.renderToString(InstallationAgentStart, { params: { framework } });
  const code = html.match(/<code[^>]*data-agent-prompt[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? '';

  return code.replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&');
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
        'run `npx @videojs/cli agents skills` and follow the steps for the agent you are running in'
      );
      expect(prompt).toContain('follow the install instructions at https://github.com/videojs/skills instead');

      for (const command of init) expect(prompt).toContain(command);
    }
  );
});
