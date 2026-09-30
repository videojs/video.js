import {
  CDN_MEDIA_SUBPATHS,
  defaultInstallationExtensions,
  fitSelectionToPreset,
  getInstallationPreset,
  getInstallationRenderer,
  INSTALLATION_DEMO_SOURCE_URL,
  INSTALLATION_EXTENSION_DEFINITIONS,
  INSTALLATION_SKIN_FLAGS,
  installationCommandParts,
  installationCompatibility,
  installationExtensionsFor,
  installationReproduceInput,
  isMuxRenderer,
  rendererSupportsCdn,
  resolveInstallationSelection,
  serializeInstallationExtensions,
  SKILLS_REPOSITORY_URL,
  skillsCommand,
  skillsCommandParts,
  skinToFlag,
  type InstallationCommandParts,
  type InstallationExtension,
  type InstallationFramework,
  type InstallationInput,
  type InstallationInputKey,
  type InstallationMethod,
  type InstallationSelection,
  type Renderer,
  type SkillAgent,
  type SkillsCommandParts,
  type SkillsSelection,
  type SkinFlag,
  type UseCase,
} from '@videojs/installation';

import { INSTALLATION_ROUTES, type InstallationRouteSegment } from './routes';
import {
  DEFAULT_SELECTION,
  parseInstallationSearchForRoute,
  resolveInstallationInputWithFallbacks,
  type InstallationUiSelection,
} from './url-state';

/** The installation method and framework a prompt describes. Installation guides fix both through their route. */
export interface AgentPromptTarget {
  method: InstallationMethod;
  framework: InstallationFramework;
}

/**
 * The guides the installed player package ships, which match the project's version where the live site documents the
 * latest release. The CLI detects the framework, so the prompt names both packages: React's, or the HTML package that
 * Vue and Svelte build on. Before the package is installed, the skill falls back to the live docs on its own.
 */
const PACKAGE_GUIDES_DIRECTORY = 'node_modules/@videojs/<react|html>/docs/guides/';

/** Where Mux documents its MCP server, which lets a coding agent upload videos, run live streams, and query Mux Data. */
export const MUX_MCP_DOCS_URL = 'https://www.mux.com/docs/integrations/mcp-server';

/**
 * The prompt's prose in the order the page shows it: two numbered steps, each introducing a command. Copied, it is
 * Markdown: the steps are paragraphs, and the features the reader asks for are a list inside the second. Each command
 * sits in backticks, closed with a period, and backticks in the prose mark inline code.
 */
export const AGENT_PROMPT_TEXT = {
  installSkill: 'Install the Video.js skill:',
  afterSkillsCommand: `Run it and follow the steps for the agent you are running in. If you can't run commands, follow the install instructions at ${SKILLS_REPOSITORY_URL} instead.`,
  useSkill: 'Then use the Video.js skill when you work on video or audio in this project.',
  beforeRequest: "Here is what I'm building:",
  afterCommand: 'Run it to print version-matched instructions for these choices without changing files.',
  beforeFeatures: 'Include the following features:',
  featureGuides: `Each feature's guide is in \`${PACKAGE_GUIDES_DIRECTORY}\`, for whichever player package the project uses.`,
  conflicts: 'If a choice conflicts with the project, ask me before changing it.',
  muxMcp: `For Mux tasks such as uploading videos, creating live streams, or finding playback IDs, use the Mux MCP server if it is connected, or point me to ${MUX_MCP_DOCS_URL} to set it up.`,
} as const;

/** The skill instructions with the plain `agents skills` command, for readers such as agents that cannot pick. */
export const AGENT_PROMPT_SKILL_INSTRUCTIONS = [
  AGENT_PROMPT_TEXT.installSkill,
  `\`${skillsCommand()}\`.`,
  AGENT_PROMPT_TEXT.afterSkillsCommand,
  AGENT_PROMPT_TEXT.useSkill,
].join(' ');

/**
 * Options the prompt leaves for `agents init` unless the reader chose them. The CLI detects the package manager,
 * framework, app setup, and method from the project, and its output guides the starting point, styling, preset, and
 * media. The skin and media URL are always stated, so the reader sees the look they chose and where their media goes.
 */
const CLI_DECIDED_OPTIONS = [
  'packageManager',
  'project',
  'framework',
  'template',
  'method',
  'styling',
  'preset',
  'media',
] as const satisfies readonly InstallationInputKey[];

type CliDecidedOption = (typeof CLI_DECIDED_OPTIONS)[number];

function isCliDecidedOption(key: InstallationInputKey): key is CliDecidedOption {
  return CLI_DECIDED_OPTIONS.some((option) => option === key);
}

/** The method and framework a page's prompt describes: a guide's route fixes both, elsewhere packaged modules do. */
export function agentPromptTarget(
  route: InstallationRouteSegment | null,
  pageFramework: InstallationFramework
): AgentPromptTarget {
  return { method: route ? INSTALLATION_ROUTES[route].method : 'packaged', framework: pageFramework };
}

/**
 * The options the prompt leaves to the CLI. A preset or media the reader chose, one that differs from the defaults,
 * stays in the command, as does the media a media URL decides; everything else the CLI detects or guides.
 */
export function agentPromptLeftOut(selection: InstallationSelection): ReadonlySet<CliDecidedOption> {
  const leftOut = new Set<CliDecidedOption>(CLI_DECIDED_OPTIONS);
  const preset = getInstallationPreset(selection.useCase);

  if (selection.useCase !== DEFAULT_SELECTION.useCase) leftOut.delete('preset');

  if (selection.sourceUrl || selection.media !== preset.renderers[0]) leftOut.delete('media');

  return leftOut;
}

const CLI_DECIDED_PHRASES = {
  packageManager: 'package manager',
  project: 'starting point',
  framework: 'framework',
  template: 'app setup',
  method: 'installation method',
  styling: 'styling',
  preset: 'preset',
  media: 'media',
} as const satisfies Record<CliDecidedOption, string>;

/**
 * The options `agents init` detects from the project: the package manager and framework from its files, the app setup
 * from its dependencies, and CDN scripts for a page without a package.json. The rest it defaults, and its output
 * explains how to choose them.
 */
const CLI_DETECTED_OPTIONS: readonly CliDecidedOption[] = ['packageManager', 'framework', 'template', 'method'];

const LIST_FORMAT = new Intl.ListFormat('en', { type: 'conjunction' });

/** Join items into a sentence's list, as in `a, b, and c`. */
function formatList(items: readonly string[]): string {
  return LIST_FORMAT.format(items);
}

/**
 * Point the agent at what the command does with the options it leaves out, in the order the command lists options.
 * `agents init` already detects some and prints guidance for choosing the rest, so the prompt defers to it rather than
 * asking the agent to work them out a second way.
 */
export function agentPromptDetectSentence(options: readonly CliDecidedOption[]): string | null {
  const phrasesFor = (detected: boolean) =>
    CLI_DECIDED_OPTIONS.filter(
      (option) => options.includes(option) && CLI_DETECTED_OPTIONS.includes(option) === detected
    ).map((option) => CLI_DECIDED_PHRASES[option]);
  const detected = phrasesFor(true);
  const guided = phrasesFor(false);

  if (detected.length > 0 && guided.length > 0) {
    return `The command detects the ${formatList(detected)} from the project and explains how to choose the ${formatList(guided)}, so follow its output for those.`;
  }

  if (detected.length > 0) return `The command detects the ${formatList(detected)} from the project.`;

  if (guided.length > 0)
    return `The command explains how to choose the ${formatList(guided)}, so follow its output for those.`;

  return null;
}

/** What the prompt asks the agent to do once the skill is installed. */
export const AGENT_PROMPT_GOALS = [
  'skill',
  'add',
  'migrate-video-js-8',
  'migrate-mux-player',
  'migrate-plyr',
  'migrate-media-chrome',
  'customize-skin',
] as const;
export type AgentPromptGoal = (typeof AGENT_PROMPT_GOALS)[number];

interface GoalDefinition {
  label: string;
  /** The player a migration starts from. */
  from?: string;
  /** The guide the agent follows, by slug. */
  guide?: string;
}

export const AGENT_PROMPT_GOAL_DEFINITIONS = {
  skill: { label: 'Install the skill' },
  add: { label: 'Add a player' },
  'migrate-video-js-8': { label: 'Migrate from Video.js 8', from: 'Video.js 8', guide: 'migrate-from-video-js-8' },
  'migrate-mux-player': { label: 'Migrate from Mux Player', from: 'Mux Player', guide: 'migrate-from-mux-player' },
  'migrate-plyr': { label: 'Migrate from Plyr', from: 'Plyr', guide: 'migrate-from-plyr' },
  'migrate-media-chrome': {
    label: 'Migrate from Media Chrome',
    from: 'Media Chrome',
    guide: 'migrate-from-media-chrome',
  },
  'customize-skin': { label: 'Customize the skin', guide: 'customize-skins' },
} as const satisfies Record<AgentPromptGoal, GoalDefinition>;

/** An installation guide's reader came to add a player; elsewhere, such as Build with AI, the skill is the point. */
export function defaultAgentPromptGoal(route: InstallationRouteSegment | null): AgentPromptGoal {
  return route ? 'add' : 'skill';
}

/** The prompt's second step, which introduces the `agents init` command with what the reader wants done. */
export function agentPromptStepHeading(goal: AgentPromptGoal): string {
  const definition: GoalDefinition = AGENT_PROMPT_GOAL_DEFINITIONS[goal];
  if (definition.from) return `Migrate this project's ${definition.from} player to Video.js 10:`;

  switch (goal) {
    case 'add':
      return 'Add a Video.js player to this project:';
    case 'customize-skin':
      return "Customize the player's skin:";
    default:
      // Without a task, the command records the reader's choices for when installation comes up.
      return 'When you install Video.js, use these choices:';
  }
}

function guideSentence(goal: AgentPromptGoal): string | null {
  const definition: GoalDefinition = AGENT_PROMPT_GOAL_DEFINITIONS[goal];
  if (!definition.guide) return null;

  const path = `\`${PACKAGE_GUIDES_DIRECTORY}${definition.guide}.md\``;

  return `Follow the ${definition.from ? 'migration' : 'skin'} guide at ${path}.`;
}

/** Player features the prompt can ask for, each with the guide that shows how. */
export const AGENT_PROMPT_FEATURES = [
  'captions',
  'quality',
  'thumbnails',
  'poster',
  'autoplay',
  'keyboard-shortcuts',
  'user-preferences',
  'internationalization',
] as const;
export type AgentPromptFeature = (typeof AGENT_PROMPT_FEATURES)[number];

interface FeatureDefinition {
  label: string;
  /** How the prompt's feature list names the feature. */
  item: string;
  guide: string;
}

export const AGENT_PROMPT_FEATURE_DEFINITIONS = {
  captions: { label: 'Captions', item: 'Captions', guide: 'captions' },
  quality: { label: 'Quality menu', item: 'A quality menu', guide: 'quality' },
  thumbnails: { label: 'Thumbnail previews', item: 'Thumbnail previews', guide: 'thumbnails' },
  poster: { label: 'Poster', item: 'A poster', guide: 'poster' },
  autoplay: { label: 'Autoplay', item: 'Autoplay', guide: 'autoplay' },
  'keyboard-shortcuts': { label: 'Keyboard shortcuts', item: 'Keyboard shortcuts', guide: 'keyboard-shortcuts' },
  'user-preferences': {
    label: 'User preferences',
    item: 'Remembered volume and caption preferences',
    guide: 'user-preferences',
  },
  internationalization: { label: 'Translations', item: 'Translated labels', guide: 'internationalization' },
} as const satisfies Record<AgentPromptFeature, FeatureDefinition>;

const AUDIO_FEATURES: readonly AgentPromptFeature[] = [
  'autoplay',
  'keyboard-shortcuts',
  'user-preferences',
  'internationalization',
];

/**
 * The features that fit a preset: audio has no picture for posters or thumbnails, live streams have no seek previews,
 * and background video plays without controls.
 */
export function agentPromptFeaturesFor(useCase: UseCase): readonly AgentPromptFeature[] {
  switch (useCase) {
    case 'default-audio':
    case 'live-audio':
      return AUDIO_FEATURES;
    case 'live-video':
      return AGENT_PROMPT_FEATURES.filter((feature) => feature !== 'thumbnails');
    case 'background-video':
      return ['poster'];
    default:
      return AGENT_PROMPT_FEATURES;
  }
}

/**
 * A suggestion for the request field: a short title, the request it fills in, words that also find it, and the player
 * it sets up. Picking one applies its preset, media, extensions, and features, so the command states them; the request
 * describes the product rather than repeating them.
 */
export interface AgentPromptRequestExample {
  label: string;
  request: string;
  /**
   * Searched but not shown, such as products readers compare theirs to. Naming them in the request would read as the
   * media source to the agent, and promise features the player does not have.
   */
  keywords: readonly string[];
  /** The preset, when not the default video player. */
  useCase?: UseCase;
  /** The media, when the preset's first would be wrong: a quality menu or casting needs a stream, not a file. */
  media?: Renderer;
  minimal?: boolean;
  /** Extensions beyond the ones the media installs by default. */
  extensions?: readonly InstallationExtension[];
  features?: readonly AgentPromptFeature[];
}

export interface AgentPromptRequestExampleGroup {
  label: string;
  items: readonly AgentPromptRequestExample[];
}

/**
 * Suggestions for the request field, the most common first. Each describes a product in a reader's words and sets up
 * the player it needs. Platforms appear by name only where the content is hosted on them, and thumbnail previews only
 * where the media provides storyboards, which today is Mux.
 */
export const AGENT_PROMPT_REQUEST_EXAMPLES: readonly AgentPromptRequestExampleGroup[] = [
  {
    label: 'Your media',
    items: [
      {
        label: 'Product videos',
        request: 'Short product videos for a store or landing page',
        keywords: ['demo', 'shop', 'ecommerce', 'shopify', 'marketing', 'mp4', 'self hosted', 'cdn'],
        features: ['poster'],
      },
      {
        label: 'Course lessons',
        request: 'Lesson videos for an online course',
        keywords: [
          'udemy',
          'coursera',
          'lms',
          'video course',
          'a11y',
          'wcag',
          'screen reader',
          'keyboard',
          'translations',
          'languages',
          'localization',
          'i18n',
          'multilingual',
          'subtitles',
        ],
        media: 'hls',
        features: ['captions', 'quality', 'keyboard-shortcuts', 'internationalization'],
      },
      {
        label: 'Podcast',
        request: 'A podcast site with an episode archive',
        keywords: ['apple podcasts', 'overcast', 'audio player', 'mp3', 'episode'],
        useCase: 'default-audio',
        features: ['user-preferences'],
      },
      {
        label: 'Live event',
        request: 'A live event stream for a conference site',
        keywords: ['webinar', 'livestream', 'live stream', 'broadcast'],
        useCase: 'live-video',
        features: ['captions'],
      },
      {
        label: 'Homepage background',
        request: 'A homepage hero with video behind the headline',
        keywords: ['hero', 'ambient', 'banner', 'background video'],
        useCase: 'background-video',
        features: ['poster'],
      },
      {
        label: 'Community clips',
        request: 'Vertical clips shared by members of a community site',
        keywords: ['uploads', 'ugc', 'user generated content', 'reels', 'shorts', 'tiktok', 'phones'],
        minimal: true,
        features: ['autoplay'],
      },
      {
        label: 'Video library',
        request: 'A library of movies and shows for a streaming site',
        keywords: ['netflix', 'disney', 'hulu', 'ott', 'chromecast', 'a11y', 'wcag', 'screen reader', 'keyboard'],
        media: 'hls',
        extensions: ['google-cast'],
        features: ['captions', 'quality', 'keyboard-shortcuts'],
      },
      {
        label: 'Live radio',
        request: 'A live radio station hosted on Mux',
        keywords: ['radio', 'station', 'live audio', 'internet radio'],
        useCase: 'live-audio',
        media: 'mux-audio',
      },
      {
        label: 'Mux',
        request: 'Videos hosted on Mux, with analytics included',
        keywords: ['uploads', 'ugc', 'mux data', 'analytics', 'adaptive streaming'],
        media: 'mux-video',
        features: ['quality', 'thumbnails'],
      },
      {
        label: 'Cloudflare Stream',
        request: 'Videos hosted on Cloudflare Stream',
        keywords: ['cloudflare', 'video hosting'],
        media: 'cloudflare',
      },
    ],
  },
  {
    label: 'Platform embeds',
    items: [
      {
        label: 'YouTube videos',
        request: 'YouTube videos in a player styled to match the brand',
        keywords: ['youtube', 'tutorials', 'branded player'],
        media: 'youtube',
      },
      {
        label: 'Vimeo portfolio',
        request: 'A studio portfolio of Vimeo videos',
        keywords: ['vimeo', 'showcase', 'studio'],
        media: 'vimeo',
      },
      {
        label: 'Twitch channel',
        request: 'A Twitch channel embedded on a community site',
        keywords: ['twitch', 'streamer', 'gaming'],
        media: 'twitch',
      },
      {
        label: 'TikTok video',
        request: 'A TikTok video embedded on a campaign page',
        keywords: ['tiktok', 'social video', 'campaign'],
        media: 'tiktok',
      },
      {
        label: 'Spotify single',
        request: "A band's Spotify single alongside tour dates",
        keywords: ['spotify', 'music', 'band', 'song'],
        useCase: 'default-audio',
        media: 'spotify',
      },
    ],
  },
];

/** Whether an installation method can build the player an example sets up. */
export function agentPromptExampleFits(example: AgentPromptRequestExample, method: InstallationMethod): boolean {
  const preset = getInstallationPreset(example.useCase ?? 'default-video').flag;

  if (method === 'shadcn') return installationCompatibility.shadcn.presets.some((flag) => flag === preset);

  if (method === 'cdn' && example.media) return rendererSupportsCdn(example.media, CDN_MEDIA_SUBPATHS);

  return true;
}

/**
 * The installation picks the prompt sets, which it shares with the guide: the player and its media. A suggested request
 * replaces them, and Reset returns only these, leaving the guide's other choices alone.
 */
export type AgentPromptPlayerPicks = Pick<
  InstallationUiSelection,
  'useCase' | 'skin' | 'media' | 'extensions' | 'sourceUrl'
>;

export function agentPromptPlayerPicks({
  useCase,
  skin,
  media,
  extensions,
  sourceUrl,
}: AgentPromptPlayerPicks): AgentPromptPlayerPicks {
  return { useCase, skin, media, extensions, sourceUrl };
}

/** Whether two sets of player picks match, such as the ones an example applied and the current ones. */
export function agentPromptPlayerPicksEqual(a: AgentPromptPlayerPicks, b: AgentPromptPlayerPicks): boolean {
  return (
    a.useCase === b.useCase &&
    a.skin === b.skin &&
    a.media === b.media &&
    a.sourceUrl === b.sourceUrl &&
    [...a.extensions].sort().join() === [...b.extensions].sort().join()
  );
}

/**
 * The player picks an example sets up, replacing the preset, look, media, and extensions. The reader's media URL stays
 * when its media is the one the example names, or, for an example that names none, plays in the example's preset.
 */
export function agentPromptExamplePicks(
  example: AgentPromptRequestExample,
  current: Pick<InstallationUiSelection, 'media' | 'sourceUrl'>
): AgentPromptPlayerPicks {
  const useCase = example.useCase ?? 'default-video';
  const renderers: readonly Renderer[] = getInstallationPreset(useCase).renderers;
  const keepsSource =
    current.sourceUrl !== '' && (example.media ? example.media === current.media : renderers.includes(current.media));
  const { skin, media } = fitSelectionToPreset(
    useCase,
    example.minimal ? 'minimal-video' : 'video',
    example.media ?? (keepsSource ? current.media : renderers[0]!)
  );
  const defaults = defaultInstallationExtensions(media);
  const extensions = installationExtensionsFor(useCase, skin, media).filter(
    (extension) => defaults.includes(extension) || example.extensions?.includes(extension)
  );

  return { useCase, skin, media, extensions, sourceUrl: keepsSource ? current.sourceUrl : '' };
}

/**
 * What an example set up, in the form's words, so the reader sees what picking it changed. The extensions are the ones
 * the picks install, including the media's defaults, such as Mux Data with Mux.
 */
export function agentPromptExampleSummary(example: AgentPromptRequestExample, applied: AgentPromptPlayerPicks): string {
  return formatList([
    ...(example.useCase ? [`${getInstallationPreset(example.useCase).label} player`] : []),
    ...(example.media ? [getInstallationRenderer(applied.media).label] : []),
    ...(example.minimal ? ['Minimal look'] : []),
    ...applied.extensions.map((extension) => INSTALLATION_EXTENSION_DEFINITIONS[extension].label),
    ...(example.features ?? []).map((feature) => AGENT_PROMPT_FEATURE_DEFINITIONS[feature].label),
  ]);
}

/** Whether Mux Data measures viewers, or `null` for media it is not offered for. */
export function agentPromptAnalytics({ useCase, skin, media, extensions }: InstallationSelection): boolean | null {
  if (!installationExtensionsFor(useCase, skin, media).includes('mux-data')) return null;

  return extensions.includes('mux-data');
}

/** Media hosted on another platform, which a Mux upload would not replace. */
const HOSTED_ELSEWHERE: readonly Renderer[] = ['youtube', 'vimeo', 'twitch', 'tiktok', 'cloudflare', 'spotify'];

/**
 * Why Mux would help the picks, if it would: a live preset needs an ingest point, a quality menu an adaptive stream
 * rather than a file, and thumbnail previews a storyboard, which only Mux media provides automatically. Otherwise, demo
 * media that a Mux upload could replace. Nothing for media already on Mux or hosted on another platform.
 */
export type AgentPromptMuxHint = 'live' | 'quality' | 'thumbnails' | 'demo';

export function agentPromptMuxHint(
  selection: InstallationSelection,
  features: readonly AgentPromptFeature[]
): AgentPromptMuxHint | null {
  const { media, sourceUrl, useCase } = selection;
  if (HOSTED_ELSEWHERE.includes(media) || (isMuxRenderer(media) && sourceUrl)) return null;

  const available = agentPromptFeaturesFor(useCase);
  const wants = (feature: AgentPromptFeature) => features.includes(feature) && available.includes(feature);

  if (getInstallationPreset(useCase).live && !sourceUrl) return 'live';

  if (wants('quality') && media === 'html5-video') return 'quality';

  if (wants('thumbnails') && !isMuxRenderer(media)) return 'thumbnails';

  return sourceUrl ? null : 'demo';
}

export const AGENT_PROMPT_REQUEST_MAX_LENGTH = 500;

/** Keep a request to one sentence in its paragraph, and short enough to share in a link. */
function normalizeAgentPromptRequest(request: string): string {
  return request.replace(/\s+/g, ' ').trim().slice(0, AGENT_PROMPT_REQUEST_MAX_LENGTH);
}

/** What the reader asks for beyond the skill: a goal, their own words, and features to include. */
export interface AgentPromptTask {
  goal: AgentPromptGoal;
  request: string;
  features: readonly AgentPromptFeature[];
}

/** A task as the prompt words it after the installation command. */
export interface AgentPromptTaskText {
  /** The goal's guide and the reader's request. */
  sentences: string[];
  /** The features the preset can use, one list item each with its guide. */
  features: string[];
}

export function agentPromptTaskText(task: AgentPromptTask, useCase: UseCase): AgentPromptTaskText {
  const request = normalizeAgentPromptRequest(task.request);
  const available = agentPromptFeaturesFor(useCase);
  const sentences = [guideSentence(task.goal)];

  if (request) sentences.push(`${AGENT_PROMPT_TEXT.beforeRequest} ${/[.!?]$/.test(request) ? request : `${request}.`}`);

  return {
    sentences: sentences.filter((sentence) => sentence !== null),
    features: AGENT_PROMPT_FEATURES.filter(
      (feature) => task.features.includes(feature) && available.includes(feature)
    ).map((feature) => {
      const { item, guide } = AGENT_PROMPT_FEATURE_DEFINITIONS[feature];

      return `${item}: \`${guide}.md\``;
    }),
  };
}

/**
 * The copied prompt's separators. The steps are Markdown paragraphs, and the second step's later blocks are indented to
 * its text so the feature list stays inside it.
 */
export const AGENT_PROMPT_SEPARATORS = {
  step: '\n\n',
  block: '\n\n   ',
  item: '- ',
  nextItem: '\n   - ',
} as const;

/** The coding agent the prompt installs the skill for, or `null` to list every agent's steps. */
export interface AgentPromptSkills {
  agent: SkillAgent | null;
}

/** The `agents skills` selection. Without an agent the command lists every agent's steps and the agent follows its own. */
export function agentPromptSkillsSelection({ agent }: AgentPromptSkills): SkillsSelection {
  return agent ? { agents: [agent] } : {};
}

export function agentPromptSkillsCommand(skills: AgentPromptSkills): SkillsCommandParts {
  return skillsCommandParts(agentPromptSkillsSelection(skills));
}

/**
 * Resolve the page's picks for one target, the way an installation guide reads its URL: a pick the target cannot use
 * falls back to its default.
 */
export function agentPromptSelection(target: AgentPromptTarget, picks: InstallationUiSelection): InstallationSelection {
  const input: InstallationInput = {
    ...target,
    project: picks.project,
    preset: getInstallationPreset(picks.useCase).flag,
    media: picks.media,
    extensions: serializeInstallationExtensions(picks.extensions),
    template: picks.template,
  };

  // Background video has one purpose-built skin, so the CLI rejects a skin for it.
  if (picks.useCase !== 'background-video') input.skin = skinToFlag(picks.skin);

  if (picks.installMethod !== 'cdn') input.packageManager = picks.installMethod;

  if (picks.styling) input.styling = picks.styling;

  const selection = resolveInstallationInputWithFallbacks(input);

  if (!picks.sourceUrl) return selection;

  // On the page a source URL only suggests media, so the command carries it only when the CLI accepts it alongside the
  // picked media.
  const withSource = resolveInstallationSelection({
    ...installationReproduceInput(selection),
    sourceUrl: picks.sourceUrl,
  });

  return withSource.ok ? withSource.selection : selection;
}

/**
 * Every option that applies to the selection, so the agent's plan never depends on defaults or project detection.
 * Without a media URL, the command names the Video.js demo source explicitly.
 */
function agentPromptInput(selection: InstallationSelection): InstallationInput {
  return { ...installationReproduceInput(selection), sourceUrl: selection.sourceUrl || INSTALLATION_DEMO_SOURCE_URL };
}

/** The order the prompt lists options in: the project and app, how to install, then the player and its media. */
const OPTION_ORDER = {
  packageManager: 0,
  project: 1,
  framework: 2,
  template: 3,
  method: 4,
  styling: 5,
  preset: 6,
  skin: 7,
  media: 8,
  sourceUrl: 9,
  extensions: 10,
} as const satisfies Record<InstallationInputKey, number>;

export function agentPromptCommand(selection: InstallationSelection): InstallationCommandParts {
  const { command, options } = installationCommandParts(agentPromptInput(selection));

  return { command, options: [...options].sort((a, b) => OPTION_ORDER[a.key] - OPTION_ORDER[b.key]) };
}

interface CommandOption {
  flag: string;
  /** Absent for a flag that takes no value. */
  value?: string;
}

function commandText({ command, options }: { command: string; options: readonly CommandOption[] }): string {
  return `${command}${agentPromptOptionsText(options)}`;
}

/** Whether the extensions are the media's own defaults, which the CLI adds without the flag. */
function agentPromptExtensionsAreDefault(selection: InstallationSelection): boolean {
  return (
    serializeInstallationExtensions(selection.extensions) ===
    serializeInstallationExtensions(defaultInstallationExtensions(selection.media))
  );
}

/**
 * The `agents init` command without the options left to the CLI, or the media's default extensions, which say nothing
 * the CLI would not do anyway.
 */
export function agentPromptStatedCommand(
  selection: InstallationSelection,
  leftOut: ReadonlySet<CliDecidedOption> = agentPromptLeftOut(selection)
): InstallationCommandParts {
  const command = agentPromptCommand(selection);
  const defaultExtensions = agentPromptExtensionsAreDefault(selection);

  return {
    ...command,
    options: command.options.filter(
      ({ key }) => !(isCliDecidedOption(key) && leftOut.has(key)) && !(key === 'extensions' && defaultExtensions)
    ),
  };
}

/** The flags a command states, as copied after the command itself. */
function agentPromptOptionsText(options: readonly CommandOption[]): string {
  return options.map(({ flag, value }) => (value === undefined ? ` ${flag}` : ` ${flag} ${value}`)).join('');
}

/** One numbered step: a heading, the command it introduces, and the prose after it. */
export interface AgentPromptStep {
  heading: string;
  command: { command: string; options: readonly CommandOption[] };
  prose: string;
}

/**
 * The prompt as both the page and the copied Markdown present it, so the two cannot drift apart. The second step can
 * end in a feature list, followed by a closing paragraph.
 */
export interface AgentPromptView {
  steps: readonly [AgentPromptStep, AgentPromptStep];
  /** The features, one Markdown list item each. */
  features: readonly string[];
  /** The paragraph after the feature list, or `null` without one. */
  closing: string | null;
}

/**
 * The prompt for the picks and task. Options left to the CLI stay out of the `agents init` command, and a sentence
 * points the agent at what the command detects and how it explains the rest.
 */
export function agentPromptView(
  selection: InstallationSelection,
  skills: AgentPromptSkills,
  task: AgentPromptTask
): AgentPromptView {
  const text = AGENT_PROMPT_TEXT;
  const leftOutOptions = agentPromptLeftOut(selection);
  const leftOut = agentPromptCommand(selection).options.flatMap(({ key }) =>
    isCliDecidedOption(key) && leftOutOptions.has(key) ? [key] : []
  );
  const { sentences, features } = agentPromptTaskText(task, selection.useCase);
  const join = (parts: readonly (string | null)[]) => parts.filter((part) => part !== null).join(' ');

  return {
    steps: [
      {
        heading: text.installSkill,
        command: agentPromptSkillsCommand(skills),
        prose: join([text.afterSkillsCommand, text.useSkill]),
      },
      {
        heading: agentPromptStepHeading(task.goal),
        command: agentPromptStatedCommand(selection, leftOutOptions),
        prose: join([
          text.afterCommand,
          agentPromptDetectSentence(leftOut),
          ...sentences,
          isMuxRenderer(selection.media) ? text.muxMcp : null,
          features.length > 0 ? null : text.conflicts,
        ]),
      },
    ],
    features,
    closing: features.length > 0 ? `${text.featureGuides} ${text.conflicts}` : null,
  };
}

/** The prompt as copied: Markdown whose steps are paragraphs, each command in backticks and closed with a period. */
export function agentPromptMarkdown({ steps, features, closing }: AgentPromptView): string {
  const { step, block, item, nextItem } = AGENT_PROMPT_SEPARATORS;
  const text = steps
    .map(({ heading, command, prose }, index) => `${index + 1}. ${heading} \`${commandText(command)}\`. ${prose}`)
    .join(step);

  if (closing === null) return text;

  return [text, AGENT_PROMPT_TEXT.beforeFeatures, `${item}${features.join(nextItem)}`, closing].join(block);
}

export function agentPromptText(
  selection: InstallationSelection,
  skills: AgentPromptSkills,
  task: AgentPromptTask
): string {
  return agentPromptMarkdown(agentPromptView(selection, skills, task));
}

/** The media the target can install for the picked preset, which a pasted URL may pick from. */
export function agentPromptMediaChoices({ method, useCase }: InstallationSelection): readonly Renderer[] {
  const renderers = getInstallationPreset(useCase).renderers;

  return method === 'cdn'
    ? renderers.filter((renderer) => rendererSupportsCdn(renderer, CDN_MEDIA_SUBPATHS))
    : renderers;
}

/** The looks the target can install: Shadcn registries always ship a skin. */
export function agentPromptSkinChoices({ method }: InstallationSelection): readonly SkinFlag[] {
  return method === 'shadcn' ? installationCompatibility.shadcn.skins : INSTALLATION_SKIN_FLAGS;
}

/**
 * The picks a page starts from: an installation guide's defaults for its route, keeping the Shadcn guide's framework,
 * or the shared defaults elsewhere.
 */
export function agentPromptDefaultPicks(
  route: InstallationRouteSegment | null,
  framework: InstallationFramework
): InstallationUiSelection {
  if (!route) return DEFAULT_SELECTION;

  return parseInstallationSearchForRoute(route, route === 'shadcn' ? `?framework=${framework}` : '');
}

/** Quote text as one POSIX shell word. */
function shellQuote(text: string): string {
  return `'${text.replaceAll("'", `'\\''`)}'`;
}

/** The command each coding agent's CLI runs under, which takes a first message as its argument. */
const AGENT_CLI_COMMANDS = {
  'claude-code': 'claude',
  codex: 'codex',
  cursor: 'agent',
} as const satisfies Partial<Record<SkillAgent, string>>;

export type AgentPromptCli = keyof typeof AGENT_CLI_COMMANDS;

/** Start a coding agent's CLI with the prompt as its first message. */
export function agentPromptShellCommand(agent: AgentPromptCli, prompt: string): string {
  return `${AGENT_CLI_COMMANDS[agent]} ${shellQuote(prompt)}`;
}

/** Open the prompt in an app that takes one through a link. */
export function agentPromptOpenUrl(app: 'cursor' | 'claude' | 'chatgpt', prompt: string): string {
  const text = encodeURIComponent(prompt);

  switch (app) {
    case 'cursor':
      return `https://cursor.com/link/prompt?text=${text}`;
    case 'claude':
      return `https://claude.ai/new?q=${text}`;
    case 'chatgpt':
      return `https://chatgpt.com/?prompt=${text}`;
  }
}
