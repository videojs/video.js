// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { planInstall, renderInstallChoices, TOOL_OPTION_SYNTAX } from '../plan-install';

describe('TOOL_OPTION_SYNTAX', () => {
  it('names options as plan_install arguments', () => {
    expect(TOOL_OPTION_SYNTAX.options(['framework', 'react'], ['skin'])).toBe('framework: "react", skin');
  });
});

describe('renderInstallChoices', () => {
  it('lists every choice under its argument name, never as a CLI flag', () => {
    const markdown = renderInstallChoices('10.2.0');

    expect(markdown).toContain('## Decide in this order');
    expect(markdown).toContain('- `framework`:');
    expect(markdown).toContain('- `sourceUrl`:');
    expect(markdown).toContain('## Compatibility');
    expect(markdown).not.toMatch(/`--[a-z]/);
  });
});

describe('planInstall', () => {
  it('returns the choices when no argument is given', () => {
    expect(planInstall({}, '10.2.0')).toEqual({ ok: true, markdown: renderInstallChoices('10.2.0') });
  });

  it('returns one plan for a valid selection', () => {
    const result = planInstall({ framework: 'react', preset: 'video', media: 'hls', extensions: 'none' }, '10.2.0');

    expect(result.ok).toBe(true);
    expect(result.markdown).toContain('@videojs/react');
  });

  it('names the arguments to change for an invalid selection', () => {
    const result = planInstall({ framework: 'vue', method: 'cdn' }, '10.2.0');

    expect(result.ok).toBe(false);
    expect(result.markdown).toContain('Invalid installation arguments:');
    expect(result.markdown).toContain('- method');
    expect(result.markdown).toContain('method: "packaged"');
  });
});
