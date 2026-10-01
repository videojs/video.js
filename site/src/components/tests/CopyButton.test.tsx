import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PostHogClient } from '@/utils/analytics';

import CopyButton from '../CopyButton';

let posthog: PostHogClient;

beforeEach(() => {
  posthog = { init: vi.fn(), capture: vi.fn() };
  window.posthog = posthog;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => {}) } });
});

afterEach(() => {
  delete window.posthog;
});

type CopyProps = Parameters<typeof CopyButton>[0];

function CodeTabs({ analytics, cta }: Pick<CopyProps, 'analytics' | 'cta'>) {
  return (
    <div data-tabs-root>
      <div role="tablist">
        <button type="button" role="tab" aria-selected="false" data-value="npm">
          npm
        </button>
        <button type="button" role="tab" aria-selected="true" data-value="pnpm">
          <span>pnpm</span>
          <span>pnpm</span>
        </button>
      </div>
      <div role="tabpanel">pnpm add @videojs/html</div>
      <CopyButton
        analytics={analytics}
        cta={cta}
        copyFrom={{ container: '[data-tabs-root]', target: '[role="tabpanel"]' }}
      >
        Copy
      </CopyButton>
    </div>
  );
}

describe('CopyButton', () => {
  it('reports the copied block and its selected tab', async () => {
    render(<CodeTabs analytics={{ block: 'package-manager' }} cta="copy-code" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() =>
      expect(posthog.capture).toHaveBeenCalledWith('code_copied', { block: 'package-manager', tab: 'pnpm' })
    );
    expect(posthog.capture).not.toHaveBeenCalledWith('agent_handoff', expect.anything());
  });

  it('also reports an agent handoff when the copy is one', async () => {
    render(<CodeTabs analytics={{ block: 'agent-prompt' }} cta="copy-agent-prompt" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => expect(posthog.capture).toHaveBeenCalledWith('agent_handoff', { method: 'copy-agent-prompt' }));
  });

  it('omits the tab when there is only one', async () => {
    render(
      <div data-tabs-root>
        <div role="tablist">
          <button type="button" role="tab" aria-selected="true" data-value="code">
            Terminal
          </button>
        </div>
        <div role="tabpanel">npx skills add videojs/skills</div>
        <CopyButton
          analytics={{ block: 'terminal-code' }}
          copyFrom={{ container: '[data-tabs-root]', target: '[role="tabpanel"]' }}
        >
          Copy
        </CopyButton>
      </div>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => expect(posthog.capture).toHaveBeenCalledWith('code_copied', { block: 'terminal-code' }));
  });

  it('reports nothing without analytics', async () => {
    render(<CodeTabs />);

    fireEvent.click(await screen.findByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
