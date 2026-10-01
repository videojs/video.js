import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { promptFeatures, promptGoal, promptRequest, resetAgentPrompt, skillAgent } from '@/stores/agentPrompt';
import {
  extensions,
  framework,
  installMethod,
  media,
  project,
  skin,
  sourceUrl,
  styling,
  template,
  useCase,
} from '@/stores/installation';

// The prompt store reads storage when it loads, and this environment has none, so a stand-in goes in first.
const storage = vi.hoisted(() => {
  const values = new Map<string, string>();
  const stub = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
    clear: () => values.clear(),
  };

  Object.defineProperty(globalThis, 'localStorage', { value: stub, configurable: true });

  return stub;
});

vi.mock('../MuxUploaderPanel', () => ({ default: () => <div>Mux upload</div> }));
vi.mock('../InstallationPreview', () => ({ default: () => <div>Player preview</div> }));

import AgentPrompt from '../AgentPrompt';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Popups and dialog bodies render asynchronously, which can take a while when the whole site suite runs in parallel.
const RENDER_WAIT = { timeout: 5000 };

async function copyPrompt(): Promise<string> {
  await userEvent.setup().click(screen.getByRole('button', { name: 'Copy prompt' }));

  return navigator.clipboard.readText();
}

/** Show the answers beyond the request, which wait under More options. */
async function openOptions(user = userEvent.setup()): Promise<void> {
  await user.click(screen.getByRole('button', { name: /^More options/ }));
}

/** The line that says what a picked suggestion set up, if one shows. */
function setupLine(): HTMLElement | null {
  return screen.queryByText((_, element) => element?.tagName === 'P' && element.textContent.startsWith('Set up for'));
}

/** The `agents init` command as the prompt shows it. */
function initCommand(): string {
  return (
    [...document.querySelectorAll('[data-agent-prompt] p')]
      .map((paragraph) => paragraph.textContent ?? '')
      .find((text) => text.includes('agents init')) ?? ''
  );
}

function copySelection(): ReturnType<typeof vi.fn> {
  const prompt = document.querySelector('[data-agent-prompt]')!;
  const range = document.createRange();
  const setData = vi.fn();

  range.selectNodeContents(prompt);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);
  fireEvent.copy(prompt, { clipboardData: { setData } });

  return setData;
}

describe('AgentPrompt', { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    cleanup();
    framework.set('react');
    template.set('next');
    project.set('existing');
    useCase.set('default-video');
    skin.set('video');
    media.set('html5-video');
    extensions.set([]);
    sourceUrl.set('');
    installMethod.set('pnpm');
    styling.set(null);
    resetAgentPrompt();
    skillAgent.set(null);
    storage.clear();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('collapses a tall prompt behind Show more, outside the copied text', async () => {
    const user = userEvent.setup();

    // The test environment has no layout, so the prompt reports a height taller than its collapsed one.
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(800);
    render(<AgentPrompt route="react" framework="react" />);

    const prompt = document.querySelector<HTMLElement>('[data-agent-prompt]')!;

    expect(prompt.style.maxHeight).toBe('140px');
    expect(prompt.textContent).not.toContain('Show more');

    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(prompt.style.maxHeight).toBe('');

    await user.click(screen.getByRole('button', { name: 'Show less' }));

    expect(prompt.style.maxHeight).toBe('140px');
  });

  it('shows a prompt close to the collapsed height in full', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(220);
    render(<AgentPrompt route="react" framework="react" />);

    expect(document.querySelector<HTMLElement>('[data-agent-prompt]')!.style.maxHeight).toBe('');
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('shows the commands as a read-only result that states only the skin and media', async () => {
    render(<AgentPrompt route="react" framework="react" />);

    expect(initCommand()).toBe('`npx @videojs/cli agents init --skin default --source-url demo`');
    // Only the request asks for an answer; the rest shows its defaults under More options.
    expect(screen.queryByRole('combobox', { name: 'Goal' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'More options: Add a player, HTML5 Video demo, Default skin, Any agent' })
    ).toHaveAttribute('aria-expanded', 'false');

    await openOptions();

    expect(screen.getByRole('button', { name: 'Media: HTML5 Video demo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skin: Default' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Agent' })).toHaveTextContent('Any agent');
  });

  it('follows the player choices the guide shares, stating those that differ from the defaults', () => {
    render(<AgentPrompt route="react" framework="react" />);

    act(() => useCase.set('default-audio'));

    expect(initCommand()).toBe('`npx @videojs/cli agents init --preset audio --skin default --source-url demo`');

    act(() => useCase.set('background-video'));

    // Background video has one purpose-built skin, so there is no skin to choose.
    expect(screen.queryByRole('button', { name: /^Skin:/ })).not.toBeInTheDocument();
  });

  it('takes the media from a pasted URL', async () => {
    const user = userEvent.setup();
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    render(<AgentPrompt route="react" framework="react" />);
    await openOptions(user);
    await user.click(screen.getByRole('button', { name: 'Media: HTML5 Video demo' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Paste a media URL…' }, RENDER_WAIT));
    await user.click(await screen.findByLabelText('Paste a media URL to detect its source type', {}, RENDER_WAIT));
    await user.paste(url);

    expect(screen.getByText('Mux upload')).toBeInTheDocument();
    expect(initCommand()).toBe(`\`npx @videojs/cli agents init --skin default --media youtube --source-url '${url}'\``);
  });

  it("picks the media from a menu of the preset's sources, going back to its demo", async () => {
    const user = userEvent.setup();

    act(() => {
      media.set('hls');
      sourceUrl.set('https://example.com/stream.m3u8');
    });
    render(<AgentPrompt route="react" framework="react" />);
    await openOptions(user);
    await user.click(screen.getByRole('button', { name: 'Media: example.com/stream.m3u8' }));

    expect(await screen.findByRole('menuitemradio', { name: 'HLS' }, RENDER_WAIT)).toBeChecked();
    expect(screen.getByText('Platforms')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitemradio', { name: 'Vimeo' }));

    expect(media.get()).toBe('vimeo');
    // A Vimeo player can't play the HLS URL, so the command names the demo instead.
    expect(sourceUrl.get()).toBe('');
    expect(initCommand()).toBe('`npx @videojs/cli agents init --skin default --media vimeo --source-url demo`');
    expect(screen.getByRole('button', { name: 'Media: Vimeo demo' })).toBeInTheDocument();
  });

  it('takes the skin from the skin cards', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);
    await openOptions(user);
    await user.click(screen.getByRole('button', { name: 'Skin: Default' }));
    await user.click(await screen.findByRole('radio', { name: /Neutral/ }, RENDER_WAIT));

    expect(screen.getByText('Player preview')).toBeInTheDocument();
    expect(initCommand()).toContain('--skin neutral');
  });

  it('installs the skill for the chosen coding agent and remembers it', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);
    await openOptions(user);
    await user.click(screen.getByRole('combobox', { name: 'Agent' }));
    await user.click(await screen.findByRole('option', { name: 'Cursor' }, RENDER_WAIT));

    expect(skillAgent.get()).toBe('cursor');
    expect(storage.getItem('vjs-site-skill-agent')).toBe('cursor');
    expect(await copyPrompt()).toContain(
      '1. Install the Video.js skill: `npx @videojs/cli agents skills --agent cursor`. Run it and follow the steps'
    );
  });

  it('asks for the goal, request, and features the reader adds', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);

    expect(await copyPrompt()).toContain(
      'in this project.\n\n2. Add a Video.js player to this project: `npx @videojs/cli'
    );

    await openOptions(user);
    await user.click(screen.getByRole('combobox', { name: 'Goal' }));
    await user.click(await screen.findByRole('option', { name: 'Migrate from Plyr' }, RENDER_WAIT));
    await user.type(screen.getByRole('combobox', { name: /What are you building/ }), 'A course site');
    await user.click(screen.getByRole('button', { name: 'Features' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Captions' }, RENDER_WAIT));
    // Checking a feature keeps the menu open for the next one.
    expect(screen.getByRole('menuitemcheckbox', { name: 'Captions' })).toBeChecked();
    await user.keyboard('{Escape}');

    expect(promptGoal.get()).toBe('migrate-plyr');
    expect(promptFeatures.get()).toEqual(['captions']);
    expect(await copyPrompt()).toContain(
      "2. Migrate this project's Plyr player to Video.js 10: `npx @videojs/cli agents init --from plyr --project existing --features captions`."
    );
    expect(await copyPrompt()).toContain("Here is what I'm building: A course site. If a choice conflicts");
  });

  it('suggests requests from the field, narrowed by what the reader types', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);

    const field = screen.getByRole('combobox', { name: /What are you building/ });

    await user.click(field);

    expect(await screen.findByRole('option', { name: /^Podcast/ }, RENDER_WAIT)).toBeInTheDocument();
    expect(screen.getByText('Platform embeds')).toBeInTheDocument();

    await user.type(field, 'quality');

    expect(screen.queryByRole('option', { name: /^Podcast/ })).not.toBeInTheDocument();
    // A group with nothing left to suggest goes too.
    expect(screen.queryByText('Platform embeds')).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /Course lessons/ }));

    expect(promptRequest.get()).toBe('Lesson videos for an online course');
    expect(await copyPrompt()).toContain(
      "Here is what I'm building: Lesson videos for an online course. If a choice conflicts"
    );
  });

  it('sets up the player a suggested request describes', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);

    const field = screen.getByRole('combobox', { name: /What are you building/ });

    await user.click(field);
    await user.click(await screen.findByRole('option', { name: /Course lessons/ }, RENDER_WAIT));

    expect(initCommand()).toBe(
      "`npx @videojs/cli agents init --skin default --media hls --source-url demo --features 'captions,quality,keyboard-shortcuts,internationalization'`"
    );
    expect(promptFeatures.get()).toEqual(['captions', 'quality', 'keyboard-shortcuts', 'internationalization']);
    expect(screen.getByRole('button', { name: /^More options/ })).toHaveTextContent('4 features');

    await openOptions(user);

    expect(screen.getByRole('button', { name: 'Features' })).toHaveTextContent('Captions');

    // Another example replaces the player rather than adding to it.
    await user.clear(field);
    await user.click(field);
    await user.click(await screen.findByRole('option', { name: /^Podcast/ }, RENDER_WAIT));

    expect(useCase.get()).toBe('default-audio');
    expect(initCommand()).toBe(
      '`npx @videojs/cli agents init --preset audio --skin default --source-url demo --features user-preferences`'
    );
    expect(promptFeatures.get()).toEqual(['user-preferences']);
    expect(screen.getByRole('button', { name: 'Media: HTML5 Audio demo' })).toBeInTheDocument();
  });

  it('only fills the request with typed text', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);
    await user.type(screen.getByRole('combobox', { name: /What are you building/ }), 'A podcast player');
    await user.keyboard('{Escape}');

    expect(useCase.get()).toBe('default-video');
    expect(promptFeatures.get()).toEqual([]);
  });

  it('finds an example by a product the reader compares theirs to, without naming it in the request', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);
    await user.type(screen.getByRole('combobox', { name: /What are you building/ }), 'tiktok');

    // Your own clips like TikTok's, and TikTok's own videos, side by side.
    expect(await screen.findByRole('option', { name: /Community clips/ }, RENDER_WAIT)).toHaveTextContent(
      'Vertical clips shared by members of a community site'
    );
    expect(screen.getByRole('option', { name: /TikTok video/ })).toBeInTheDocument();
  });

  it('copies a text selection of the prompt exactly as the copy button does', async () => {
    media.set('mux-video');
    extensions.set(['google-cast']);
    render(<AgentPrompt route="react" framework="react" />);

    const copied = await copyPrompt();

    expect(copied).toContain('--media mux-video --source-url demo --extensions google-cast`.');
    expect(copySelection()).toHaveBeenCalledWith('text/plain', copied);
  });

  it('states the features as a flag, which the command turns into guides', async () => {
    promptFeatures.set(['poster', 'captions']);
    render(<AgentPrompt route="react" framework="react" />);

    const copied = await copyPrompt();

    expect(initCommand()).toContain("--features 'captions,poster'");
    expect(copied).not.toContain('captions.md');
    expect(copySelection()).toHaveBeenCalledWith('text/plain', copied);
  });

  it('starts from the migration a migration guide covers', () => {
    render(<AgentPrompt route={null} framework="html" goal="migrate-vidstack" />);

    expect(initCommand()).toBe('`npx @videojs/cli agents init --from vidstack --project existing`');
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
    // The agent keeps the existing player's media and skin.
    expect(screen.getByRole('button', { name: /^More options/ })).toHaveTextContent(
      'Migrate from Vidstack · Existing media · Existing skin'
    );
  });

  it('copies a lone backtick in the request as it was typed', async () => {
    promptRequest.set('Use the `legacy player');
    render(<AgentPrompt route="react" framework="react" />);

    const copied = await copyPrompt();

    expect(copied).toContain("Here is what I'm building: Use the `legacy player.");
    expect(copySelection()).toHaveBeenCalledWith('text/plain', copied);
  });

  it('reports a copied prompt and a copied terminal command as agent handoffs', async () => {
    const user = userEvent.setup();
    const posthog = { init: vi.fn(), capture: vi.fn() };

    window.posthog = posthog;
    render(<AgentPrompt route="react" framework="react" />);
    await user.click(screen.getByRole('button', { name: 'Copy prompt' }));
    await user.click(screen.getByRole('button', { name: 'More prompt actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /Copy for Codex/ }, RENDER_WAIT));

    expect(posthog.capture).toHaveBeenCalledWith('code_copied', { block: 'agent-prompt' });
    expect(posthog.capture).toHaveBeenCalledWith('agent_handoff', { method: 'copy-agent-prompt' });
    expect(posthog.capture).toHaveBeenCalledWith('agent_handoff', { method: 'copy-agent-command' });
    delete window.posthog;
  });

  it('hands the prompt to a coding agent', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);

    const prompt = await copyPrompt();

    await user.click(screen.getByRole('button', { name: 'More prompt actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /Copy for Claude Code/ }, RENDER_WAIT));

    expect(await navigator.clipboard.readText()).toBe(`claude '${prompt.replaceAll("'", "'\\''")}'`);

    await user.click(screen.getByRole('button', { name: 'More prompt actions' }));

    expect(await screen.findByRole('menuitem', { name: 'Open in Cursor' }, RENDER_WAIT)).toHaveAttribute(
      'href',
      `https://cursor.com/link/prompt?text=${encodeURIComponent(prompt)}`
    );
  });

  it('resets the answers and the player choices it shares with the guide, keeping the remembered agent', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);

    // The prompt shows its defaults, so there is nothing to reset.
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();

    act(() => {
      skillAgent.set('codex');
      promptRequest.set('A trailer');
      useCase.set('default-audio');
    });
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(skillAgent.get()).toBe('codex');
    expect(promptRequest.get()).toBe('');
    expect(useCase.get()).toBe('default-video');
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('says a quality menu needs an adaptive stream when the media is a file, offering a Mux upload', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);

    // Nothing to say about Mux until a pick needs it.
    expect(screen.queryByRole('button', { name: 'Upload to Mux' })).not.toBeInTheDocument();

    act(() => promptFeatures.set(['quality']));

    expect(screen.getByText('Quality menus need an adaptive stream.', { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Upload to Mux' }));

    expect(await screen.findByText('Mux upload', {}, RENDER_WAIT)).toBeVisible();
  });

  it('turns viewer analytics on and off for Mux media', async () => {
    const user = userEvent.setup();

    act(() => {
      media.set('mux-video');
      extensions.set(['mux-data']);
    });
    render(<AgentPrompt route="react" framework="react" />);
    await openOptions(user);
    await user.click(screen.getByRole('button', { name: 'Features' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Viewer analytics (Mux Data)' }, RENDER_WAIT));

    expect(extensions.get()).toEqual([]);
    expect(initCommand()).toContain('--extensions none');
  });

  it("moves a suggestion's stream to Mux, keeping its setup line", async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);
    await user.click(screen.getByRole('combobox', { name: /What are you building/ }));
    await user.click(await screen.findByRole('option', { name: /Course lessons/ }, RENDER_WAIT));
    await user.click(screen.getByRole('button', { name: 'Host on Mux instead' }));

    expect(media.get()).toBe('mux-video');
    expect(initCommand()).toContain('--media mux-video');
    expect(setupLine()).toHaveTextContent('Set up for Course lessons: Mux, Mux Data,');
    expect(screen.queryByRole('button', { name: 'Host on Mux instead' })).not.toBeInTheDocument();
    expect(await copyPrompt()).toContain('use the Mux MCP server if it is connected');
  });

  it('resets only the player choices, leaving the guide choices the prompt leaves to the CLI', async () => {
    const user = userEvent.setup();

    act(() => {
      installMethod.set('npm');
      useCase.set('default-audio');
    });
    render(<AgentPrompt route="react" framework="react" />);
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(useCase.get()).toBe('default-video');
    expect(installMethod.get()).toBe('npm');
  });

  it("drops features a new preset can't use, rather than keeping them unseen", () => {
    act(() => promptFeatures.set(['captions', 'autoplay']));
    render(<AgentPrompt route="react" framework="react" />);

    act(() => useCase.set('default-audio'));

    expect(promptFeatures.get()).toEqual(['autoplay']);

    act(() => useCase.set('default-video'));

    expect(promptFeatures.get()).toEqual(['autoplay']);
  });

  it('drops the setup line once the reader changes what the suggestion set', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);
    await user.click(screen.getByRole('combobox', { name: /What are you building/ }));
    await user.click(await screen.findByRole('option', { name: /^Podcast/ }, RENDER_WAIT));

    expect(setupLine()).toHaveTextContent('Set up for Podcast');

    act(() => skin.set('neutral-audio'));

    expect(setupLine()).toBeNull();
  });

  it("marks a terminal command's copy on the menu, not the prompt's copy button", async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);
    await user.click(screen.getByRole('button', { name: 'More prompt actions' }));
    await user.click(await screen.findByRole('menuitem', { name: /Copy for Codex/ }, RENDER_WAIT));

    expect(screen.getByRole('button', { name: 'Copy prompt' })).not.toHaveTextContent('Copied');
    expect(screen.getByText('Copied the Codex command')).toBeInTheDocument();
  });

  it('says when the clipboard refuses a copy', async () => {
    const user = userEvent.setup();

    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AgentPrompt route="react" framework="react" />);
    await user.click(screen.getByRole('button', { name: 'Copy prompt' }));

    expect(screen.getByRole('button', { name: 'Copy prompt' })).toHaveTextContent('Error');
    expect(screen.getByText("Couldn't copy the prompt")).toBeInTheDocument();
  });

  it('says what a suggested request set up, and replaces it with the next pick', async () => {
    const user = userEvent.setup();

    render(<AgentPrompt route="react" framework="react" />);

    const field = screen.getByRole('combobox', { name: /What are you building/ });

    await user.click(field);
    await user.click(await screen.findByRole('option', { name: /Video library/ }, RENDER_WAIT));

    expect(setupLine()).toHaveTextContent(
      'Set up for Video library: HLS, Google Cast, Captions, Quality menu, and Keyboard shortcuts.'
    );

    await user.clear(field);
    await user.click(field);
    await user.click(await screen.findByRole('option', { name: /^Podcast/ }, RENDER_WAIT));

    expect(useCase.get()).toBe('default-audio');
    expect(setupLine()).toHaveTextContent('Set up for Podcast: Audio player and User preferences.');
    expect(screen.queryByRole('button', { name: /^Undo/ })).not.toBeInTheDocument();
  });
});
