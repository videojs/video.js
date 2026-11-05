// @vitest-environment node
import { getContainerRenderer } from '@astrojs/react/container-renderer';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { describe, expect, it } from 'vite-plus/test';

import MigrationAgentStart from '../MigrationAgentStart.astro';

async function renderPrompt(framework: string): Promise<string> {
  const container = await AstroContainer.create({ renderers: await loadRenderers([getContainerRenderer()]) });
  const html = await container.renderToString(MigrationAgentStart, {
    params: { framework },
    props: { source: 'media-chrome' },
  });
  const code = html.match(/<code[^>]*data-agent-prompt[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? '';

  return code.replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&');
}

describe('MigrationAgentStart', () => {
  it.each([
    ['react', '@videojs/react'],
    ['html', '@videojs/html'],
  ])('gives the %s prompt a fallback for each CLI command', async (framework, packageName) => {
    const prompt = await renderPrompt(framework);

    expect(prompt).toContain('Run `npx @videojs/cli agents skills`');
    expect(prompt).toContain(
      "If the command can't run or is blocked, install the skill from https://github.com/videojs/skills instead."
    );
    expect(prompt).toContain(
      "if yours can't, read https://raw.githubusercontent.com/videojs/skills/main/skills/videojs/SKILL.md and the reference files it links"
    );
    expect(prompt).toContain(`\`npx @videojs/cli agents init --framework ${framework} --project existing\``);
    expect(prompt).toContain(
      "If you can't run them, read the installation guide for your chosen method and framework. It lists the same options"
    );
    expect(prompt).toContain(`switch to node_modules/${packageName}/docs/llms.txt`);
  });
});
