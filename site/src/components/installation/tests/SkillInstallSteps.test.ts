// @vitest-environment node
import { getContainerRenderer } from '@astrojs/react/container-renderer';
import { SKILL_AGENTS, type SkillAgent } from '@videojs/installation';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { describe, expect, it } from 'vite-plus/test';

import SkillInstallSteps from '../SkillInstallSteps.astro';

async function render(agent: SkillAgent): Promise<string> {
  const container = await AstroContainer.create({ renderers: await loadRenderers([getContainerRenderer()]) });
  const html = await container.renderToString(SkillInstallSteps, { props: { agent } });

  return html
    .replace(/<[^>]+>/g, '')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');
}

describe('SkillInstallSteps', () => {
  it('renders the terminal commands and follow-up for a command-line agent', async () => {
    const text = await render('claude-code');

    expect(text).toContain('claude plugin marketplace add videojs/skills');
    expect(text).toContain('claude plugin install videojs@videojs');
    expect(text).toContain('Start a new Claude Code session, or run /reload-plugins in the current session.');
    expect(text).toContain('/videojs:videojs');
  });

  it('renders the repository URL an editor agent asks for', async () => {
    const text = await render('cursor');

    expect(text).toContain('Open Customize, select Plugins, choose From GitHub Repository, and enter:');
    expect(text).toContain('https://github.com/videojs/skills');
  });

  it('renders every agent', async () => {
    for (const agent of SKILL_AGENTS) expect(await render(agent), agent).toContain('Start a new ');
  });
});
