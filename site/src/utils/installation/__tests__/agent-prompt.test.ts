import { installationFeaturesFor } from '@videojs/installation';
import { describe, expect, it } from 'vitest';

import {
  AGENT_PROMPT_REQUEST_EXAMPLES,
  agentPromptAnalytics,
  agentPromptCommand,
  agentPromptDetectSentence,
  agentPromptExampleFits,
  agentPromptExampleSummary,
  agentPromptExamplePicks,
  agentPromptLeftOut,
  agentPromptMarkdown,
  agentPromptMediaChoices,
  agentPromptHostingHint,
  agentPromptPlayerPicksEqual,
  agentPromptOpenUrl,
  agentPromptSelection,
  agentPromptSkinChoices,
  agentPromptShellCommand,
  agentPromptSkillsSelection,
  agentPromptStatedCommand,
  agentPromptStepHeading,
  agentPromptTarget,
  agentPromptTaskSentences,
  agentPromptText,
  agentPromptView,
  type AgentPromptRequestExample,
  type AgentPromptTask,
} from '../agent-prompt';
import { DEFAULT_SELECTION, type InstallationUiSelection } from '../url-state';

/** What a prompt for Mux media adds, pointing the agent at Mux's MCP server. */
const MUX_MCP_SENTENCE =
  'For Mux tasks such as uploading videos, creating live streams, or finding playback IDs, use the Mux MCP server if it is connected, or point me to https://www.mux.com/docs/integrations/mcp-server to set it up.';

/** A task with nothing beyond installing the skill. */
const SKILL_ONLY_TASK: AgentPromptTask = { goal: 'skill', request: '', features: [] };

function picks(overrides: Partial<InstallationUiSelection> = {}): InstallationUiSelection {
  return { ...DEFAULT_SELECTION, ...overrides };
}

function example(label: string): AgentPromptRequestExample {
  return AGENT_PROMPT_REQUEST_EXAMPLES.flatMap((group) => group.items).find((item) => item.label === label)!;
}

function flags(selection: ReturnType<typeof agentPromptSelection>): Record<string, string> {
  return Object.fromEntries(agentPromptCommand(selection).options.map(({ flag, value }) => [flag, value]));
}

describe('agentPromptSelection', () => {
  it('fills every option that applies to the target from the picks', () => {
    const selection = agentPromptSelection({ method: 'packaged', framework: 'vue' }, picks());

    expect(agentPromptCommand(selection).options.map(({ flag }) => flag)).toEqual([
      '--package-manager',
      '--project',
      '--framework',
      '--template',
      '--method',
      '--preset',
      '--skin',
      '--media',
      '--source-url',
      '--extensions',
    ]);
    // The stored React app setup does not fit Vue, so the prompt shows Vue's default.
    expect(flags(selection)).toMatchObject({ '--framework': 'vue', '--template': 'vite', '--extensions': 'none' });
  });

  it('drops options the selection does not use', () => {
    const background = agentPromptSelection(
      { method: 'packaged', framework: 'react' },
      picks({ useCase: 'background-video', skin: 'video', media: 'background-video' })
    );
    const cdnPage = agentPromptSelection({ method: 'cdn', framework: 'html' }, picks({ template: 'none' }));
    const shadcn = agentPromptSelection({ method: 'shadcn', framework: 'react' }, picks());

    expect(flags(background)).not.toHaveProperty('--skin');
    expect(flags(cdnPage)).not.toHaveProperty('--package-manager');
    expect(flags(cdnPage)).toMatchObject({ '--project': 'existing', '--template': 'none' });
    expect(flags(shadcn)).toMatchObject({ '--styling': 'tailwind' });
  });

  it('falls back to defaults for picks the target cannot use', () => {
    const selection = agentPromptSelection(
      { method: 'shadcn', framework: 'html' },
      picks({ skin: 'none', template: 'none', styling: 'tailwind' })
    );

    expect(flags(selection)).toMatchObject({ '--skin': 'default', '--template': 'vite', '--styling': 'css' });
  });

  it('carries a source URL only when the CLI accepts it with the picked media', () => {
    const file = agentPromptSelection(
      { method: 'packaged', framework: 'react' },
      picks({ sourceUrl: 'https://example.com/movie.mp4' })
    );
    const mismatched = agentPromptSelection(
      { method: 'packaged', framework: 'react' },
      picks({ sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    );

    expect(flags(file)['--source-url']).toBe('https://example.com/movie.mp4');
    // Without a URL the CLI accepts, the command names the demo source instead of leaving it to a default.
    expect(flags(mismatched)['--source-url']).toBe('demo');
  });
});

describe('agentPromptTarget', () => {
  it("fixes a guide's method through its route, and uses packaged modules elsewhere", () => {
    expect(agentPromptTarget('cdn', 'html')).toEqual({ method: 'cdn', framework: 'html' });
    expect(agentPromptTarget(null, 'react')).toEqual({ method: 'packaged', framework: 'react' });
  });
});

describe('agentPromptLeftOut', () => {
  const target = { method: 'packaged', framework: 'react' } as const;
  const stated = (overrides: Partial<InstallationUiSelection>) =>
    agentPromptStatedCommand(agentPromptSelection(target, picks(overrides))).options.map(({ flag }) => flag);

  it('states the skin and media URL, and leaves what the CLI detects or guides out', () => {
    expect([...agentPromptLeftOut(agentPromptSelection(target, picks()))].sort()).toEqual(
      ['framework', 'media', 'method', 'packageManager', 'preset', 'project', 'styling', 'template'].sort()
    );
    expect(stated({})).toEqual(['--skin', '--source-url']);
  });

  it('states a preset or media that differs from the defaults, and the media a URL decides', () => {
    expect(stated({ useCase: 'default-audio', skin: 'audio', media: 'html5-audio' })).toEqual([
      '--preset',
      '--skin',
      '--source-url',
    ]);
    expect(stated({ media: 'hls' })).toEqual(['--skin', '--media', '--source-url']);
    expect(stated({ sourceUrl: 'https://example.com/movie.mp4' })).toEqual(['--skin', '--media', '--source-url']);
  });

  it("leaves out the media's default extensions and states any others", () => {
    expect(stated({ media: 'mux-video', extensions: ['mux-data'] })).toEqual(['--skin', '--media', '--source-url']);
    expect(stated({ media: 'mux-video', extensions: [] })).toEqual([
      '--skin',
      '--media',
      '--source-url',
      '--extensions',
    ]);
  });
});

describe('agentPromptText', () => {
  const mux = () =>
    agentPromptSelection(
      { method: 'packaged', framework: 'react' },
      picks({ media: 'mux-video', extensions: ['google-cast', 'mux-data'] })
    );

  it('writes each step as a paragraph with its command in backticks', () => {
    expect(agentPromptText(mux(), { agent: null }, SKILL_ONLY_TASK)).toBe(
      "1. Install the Video.js skill: `npx @videojs/cli agents skills`. Run it and follow the steps for the agent you are running in. If you can't run commands, follow the install instructions at https://github.com/videojs/skills instead. Then use the Video.js skill when you work on video or audio in this project.\n\n2. When you install Video.js, use these choices: `npx @videojs/cli agents init --skin default --media mux-video --source-url demo --extensions 'google-cast,mux-data'`. Run it to print version-matched instructions for these choices without changing files. The command detects the package manager, framework, app setup, and installation method from the project and explains how to choose the starting point and preset, so follow its output for those. For Mux tasks such as uploading videos, creating live streams, or finding playback IDs, use the Mux MCP server if it is connected, or point me to https://www.mux.com/docs/integrations/mcp-server to set it up. If a choice conflicts with the project, ask me before changing it."
    );
  });

  it('installs the skill for the chosen coding agent', () => {
    expect(agentPromptText(mux(), { agent: 'claude-code' }, SKILL_ONLY_TASK)).toContain(
      'skill: `npx @videojs/cli agents skills --agent claude-code`. Run it'
    );
  });

  it('introduces the installation command with the goal, stating the features as a flag', () => {
    const selection = agentPromptSelection(
      { method: 'packaged', framework: 'react' },
      picks({ media: 'mux-video', extensions: ['google-cast', 'mux-data'] }),
      { goal: 'add', features: ['quality', 'captions'] }
    );
    const text = agentPromptText(
      selection,
      { agent: null },
      { goal: 'add', request: 'A product page trailer', features: ['captions', 'quality'] }
    );

    expect(text).toContain(
      "when you work on video or audio in this project.\n\n2. Add a Video.js player to this project: `npx @videojs/cli agents init --skin default --media mux-video --source-url demo --extensions 'google-cast,mux-data' --features 'captions,quality'`."
    );
    expect(
      text.endsWith(
        `Here is what I'm building: A product page trailer. ${MUX_MCP_SENTENCE} If a choice conflicts with the project, ask me before changing it.`
      )
    ).toBe(true);
  });

  it('migrates with --from, leaving the skin, media, and extensions to the existing player', () => {
    const task = { goal: 'migrate-vidstack', request: '', features: [] } as const;
    const text = agentPromptText(
      agentPromptSelection({ method: 'packaged', framework: 'react' }, picks(), task),
      { agent: null },
      task
    );

    expect(text).toContain(
      "2. Migrate this project's Vidstack player to Video.js 10: `npx @videojs/cli agents init --from vidstack --project existing`."
    );
    expect(text).toContain('explains how to choose the preset, skin, media, media URL, and extensions');
  });
});

describe('agentPromptStepHeading', () => {
  it('introduces the installation command with the goal', () => {
    expect(agentPromptStepHeading('add')).toBe('Add a Video.js player to this project:');
    expect(agentPromptStepHeading('migrate-video-js-8')).toBe(
      "Migrate this project's Video.js 8 player to Video.js 10:"
    );
    expect(agentPromptStepHeading('customize-skin')).toBe("Customize the player's skin:");
    expect(agentPromptStepHeading('skill')).toBe('When you install Video.js, use these choices:');
  });
});

describe('agentPromptTaskSentences', () => {
  const task = (overrides: Partial<AgentPromptTask>): AgentPromptTask => ({ ...SKILL_ONLY_TASK, ...overrides });

  it('points the skin goal at its guide, and leaves migrations to the command', () => {
    expect(agentPromptTaskSentences(task({ goal: 'customize-skin' }))).toEqual([
      'Follow the skin guide at `node_modules/@videojs/<react|html>/docs/guides/customize-skins.md`.',
    ]);
    expect(agentPromptTaskSentences(task({ goal: 'migrate-plyr' }))).toEqual([]);
  });

  it('keeps a request on one line and ends it as a sentence', () => {
    expect(agentPromptTaskSentences(task({ request: '  A podcast\n  player  ' }))).toEqual([
      "Here is what I'm building: A podcast player.",
    ]);
    expect(agentPromptTaskSentences(task({ request: 'Is this possible?' }))).toEqual([
      "Here is what I'm building: Is this possible?",
    ]);
  });
});

describe('agentPromptSelection', () => {
  it('states only the features the preset can use', () => {
    const audio = agentPromptSelection(
      { method: 'packaged', framework: 'react' },
      picks({ useCase: 'default-audio' }),
      {
        goal: 'add',
        features: ['thumbnails', 'autoplay'],
      }
    );

    expect(audio.features).toEqual(['autoplay']);
    expect(installationFeaturesFor('background-video')).toEqual(['poster']);
  });
});

describe('agentPromptShellCommand', () => {
  it("quotes the prompt as one shell word for the agent's CLI", () => {
    expect(agentPromptShellCommand('claude-code', "Run `npx x --extensions 'a,b'` if you can't.")).toBe(
      `claude 'Run \`npx x --extensions '\\''a,b'\\''\` if you can'\\''t.'`
    );
    expect(agentPromptShellCommand('codex', 'Hi')).toBe("codex 'Hi'");
    // Cursor's CLI runs as `agent`.
    expect(agentPromptShellCommand('cursor', 'Hi')).toBe("agent 'Hi'");
  });
});

describe('agentPromptOpenUrl', () => {
  it('encodes the prompt into each app link', () => {
    expect(agentPromptOpenUrl('cursor', 'Hi & bye')).toBe('https://cursor.com/link/prompt?text=Hi%20%26%20bye');
    expect(agentPromptOpenUrl('claude', 'Hi')).toBe('https://claude.ai/new?q=Hi');
    expect(agentPromptOpenUrl('chatgpt', 'Hi')).toBe('https://chatgpt.com/?prompt=Hi');
  });
});

describe('agentPromptDetectSentence', () => {
  it('defers to what the command detects and how it says to choose the rest, in command order', () => {
    expect(agentPromptDetectSentence(['template', 'packageManager'])).toBe(
      'The command detects the package manager and app setup from the project.'
    );
    expect(agentPromptDetectSentence(['preset', 'framework', 'styling'])).toBe(
      'The command detects the framework from the project and explains how to choose the styling and preset, so follow its output for those.'
    );
    expect(agentPromptDetectSentence(['media'])).toBe(
      'The command explains how to choose the media, so follow its output for those.'
    );
    expect(agentPromptDetectSentence([])).toBeNull();
  });
});

describe('agentPromptSkillsSelection', () => {
  it("lists every agent's steps until the reader picks one", () => {
    expect(agentPromptSkillsSelection({ agent: null })).toEqual({});
    expect(agentPromptSkillsSelection({ agent: 'cursor' })).toEqual({ agents: ['cursor'] });
  });
});

describe('agentPromptMediaChoices', () => {
  it("offers the preset's media the method can install", () => {
    const audio = agentPromptSelection({ method: 'packaged', framework: 'react' }, picks({ useCase: 'default-audio' }));
    const cdn = agentPromptSelection({ method: 'cdn', framework: 'html' }, picks());

    expect(agentPromptMediaChoices(audio)).toEqual(['html5-audio', 'mux-audio', 'spotify']);
    expect(agentPromptMediaChoices(cdn)).toContain('youtube');
  });
});

describe('agentPromptSkinChoices', () => {
  it('leaves out building your own for Shadcn registries, which always ship a skin', () => {
    const shadcn = agentPromptSelection({ method: 'shadcn', framework: 'react' }, picks());
    const packaged = agentPromptSelection({ method: 'packaged', framework: 'react' }, picks());

    expect(agentPromptSkinChoices(shadcn)).not.toContain('none');
    expect(agentPromptSkinChoices(packaged)).toContain('none');
  });
});

describe('agentPromptView', () => {
  it('holds what the copied Markdown says, step by step', () => {
    const selection = agentPromptSelection({ method: 'packaged', framework: 'react' }, picks());
    const view = agentPromptView(selection, { agent: null }, { goal: 'add', request: '', features: [] });

    expect(view.steps.map(({ heading }) => heading)).toEqual([
      'Install the Video.js skill:',
      'Add a Video.js player to this project:',
    ]);
    expect(agentPromptMarkdown(view)).toBe(
      agentPromptText(selection, { agent: null }, { goal: 'add', request: '', features: [] })
    );
  });
});

describe('agentPromptPlayerPicksEqual', () => {
  it('compares the player picks, whatever order the extensions are in', () => {
    const base = { useCase: 'default-video', skin: 'video', media: 'mux-video', sourceUrl: '' } as const;

    expect(
      agentPromptPlayerPicksEqual(
        { ...base, extensions: ['google-cast', 'mux-data'] },
        { ...base, extensions: ['mux-data', 'google-cast'] }
      )
    ).toBe(true);
    expect(
      agentPromptPlayerPicksEqual({ ...base, extensions: [] }, { ...base, skin: 'neutral-video', extensions: [] })
    ).toBe(false);
  });
});
describe('AGENT_PROMPT_REQUEST_EXAMPLES', () => {
  it('asks only for features its preset can use', () => {
    for (const item of AGENT_PROMPT_REQUEST_EXAMPLES.flatMap((group) => group.items)) {
      const available = installationFeaturesFor(item.useCase ?? 'default-video');

      expect(item.features?.filter((feature) => !available.includes(feature)) ?? [], item.label).toEqual([]);
    }
  });
});

describe('agentPromptExamplePicks', () => {
  const demo = { media: 'html5-video', sourceUrl: '' } as const;

  it('sets up the preset, media, and extensions an example describes', () => {
    expect(agentPromptExamplePicks(example('Podcast'), demo)).toEqual({
      useCase: 'default-audio',
      skin: 'audio',
      media: 'html5-audio',
      extensions: [],
      sourceUrl: '',
    });
    expect(agentPromptExamplePicks(example('Video library'), demo)).toMatchObject({
      media: 'hls',
      extensions: ['google-cast'],
    });
    expect(agentPromptExamplePicks(example('Mux'), demo)).toMatchObject({ extensions: ['mux-data'] });
    expect(agentPromptExamplePicks(example('Community clips'), demo)).toMatchObject({ skin: 'neutral-video' });
  });

  it("keeps the reader's media URL unless the example names other media or a preset it cannot play in", () => {
    const own = { media: 'mux-video', sourceUrl: 'https://stream.mux.com/abc.m3u8' } as const;

    expect(agentPromptExamplePicks(example('Product videos'), own)).toMatchObject(own);
    // An example that names the same media keeps the URL too.
    expect(agentPromptExamplePicks(example('Mux'), own)).toMatchObject(own);
    expect(agentPromptExamplePicks(example('YouTube videos'), own)).toMatchObject({ media: 'youtube', sourceUrl: '' });
    expect(agentPromptExamplePicks(example('Podcast'), own)).toMatchObject({ media: 'html5-audio', sourceUrl: '' });
  });
});

describe('agentPromptExampleSummary', () => {
  it('names what an example set, with the extensions its media installs by default', () => {
    const demo = { media: 'html5-video', sourceUrl: '' } as const;
    const summary = (label: string) =>
      agentPromptExampleSummary(example(label), agentPromptExamplePicks(example(label), demo));

    expect(summary('Mux')).toBe('Mux, Mux Data, Quality menu, and Thumbnail previews');
    expect(summary('Live radio')).toBe('Live Audio player, Mux, and Mux Data');
    expect(summary('Video library')).toBe('HLS, Google Cast, Captions, Quality menu, and Keyboard shortcuts');
  });
});

describe('agentPromptExampleFits', () => {
  it('leaves out examples an installation method cannot build', () => {
    expect(agentPromptExampleFits(example('Homepage background'), 'shadcn')).toBe(false);
    expect(agentPromptExampleFits(example('Homepage background'), 'cdn')).toBe(true);
    expect(agentPromptExampleFits(example('Podcast'), 'shadcn')).toBe(true);
  });
});

describe('agentPromptHostingHint', () => {
  const select = (overrides: Partial<InstallationUiSelection>) =>
    agentPromptSelection({ method: 'packaged', framework: 'react' }, picks(overrides));

  it('says why Mux would help: an ingest point, an adaptive stream, or a storyboard', () => {
    expect(agentPromptHostingHint(select({ useCase: 'live-video', media: 'hls' }), [])).toBe('live');
    expect(agentPromptHostingHint(select({}), ['quality'])).toBe('quality');
    expect(agentPromptHostingHint(select({ media: 'hls' }), ['thumbnails'])).toBe('thumbnails');
  });

  it('says nothing when no pick needs Mux, or once the media is on Mux or another platform', () => {
    expect(agentPromptHostingHint(select({}), [])).toBeNull();
    // A quality menu works with the demo HLS stream.
    expect(agentPromptHostingHint(select({ media: 'hls' }), ['quality'])).toBeNull();
    expect(
      agentPromptHostingHint(select({ media: 'mux-video', sourceUrl: 'https://stream.mux.com/abc.m3u8' }), [
        'thumbnails',
      ])
    ).toBeNull();
    expect(agentPromptHostingHint(select({ media: 'youtube' }), ['quality'])).toBeNull();
  });
});

describe('agentPromptAnalytics', () => {
  it('reports Mux Data for Mux media, and nothing for media it is not offered for', () => {
    const select = (overrides: Partial<InstallationUiSelection>) =>
      agentPromptSelection({ method: 'packaged', framework: 'react' }, picks(overrides));

    expect(agentPromptAnalytics(select({ media: 'mux-video', extensions: ['mux-data'] }))).toBe(true);
    expect(agentPromptAnalytics(select({ media: 'mux-video', extensions: [] }))).toBe(false);
    expect(agentPromptAnalytics(select({ media: 'hls' }))).toBeNull();
  });
});
