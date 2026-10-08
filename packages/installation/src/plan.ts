import {
  generateHTMLInstallCode,
  generateHTMLUsageCode,
  generateReactCreateCode,
  generateReactInstallCode,
  generateSourceHTMLUsageCode,
  generateSourceMediaInstallCode,
  generateSourceReactCreateCode,
  generateSvelteCreateCode,
  generateSvelteUsageCode,
  generateVueCreateCode,
  generateVueCustomElementConfigCode,
  generateVueUsageCode,
  resolveInstallationSourceUrl,
  type InstallationOptions,
} from './codegen';
import { CDN_MEDIA_SUBPATHS, INSTALLATION_DEMO_SOURCE_URL, INSTALLATION_DEMO_SOURCES } from './defaults';
import {
  installationCompatibilityFor,
  installationDecisionOrderFor,
  installationOptionDefinitionsFor,
  type InstallationDiscoveryCompatibility,
  type InstallationOptionDefinition,
} from './options';
import { INSTALLATION_PARAMETERS, type InstallationInput } from './parameters';
import {
  INSTALLATION_FRAMEWORKS,
  INSTALLATION_NEW_APP_DIRECTORY,
  INSTALLATION_TEMPLATE_LABELS,
  installationHtmlDocumentCode,
  installationHtmlEntrySetup,
  installationHtmlPlayerPageCode,
  installationProjectCreateCommand,
  installationProjectFiles,
  installationProjectRunCommand,
  installationReactPlayerCode,
  installationReactUsageCode,
  installationStarterFiles,
  installationVueConfigFilename,
  type InstallationProjectFiles,
} from './projects';
import { getAdapterPackage } from './renderers';
import {
  INSTALLATION_METHODS,
  selectionToInput,
  type InstallationSelection,
  type InstallationSelectionDefaults,
  type PlayerOwner,
} from './selection';
import {
  registrySkinSelection,
  shadcnAddCommand,
  shadcnInitCommand,
  shadcnProjectConfiguration,
  shadcnProjectSetup,
  shadcnRegistryAddCommand,
  type RegistryStyling,
} from './shadcn';

/** What an agent does with each code block. Discovery publishes these descriptions as the plan vocabulary. */
export const INSTALLATION_BLOCK_OPERATIONS = {
  create: 'Create the file with this content.',
  merge: 'Merge this into the existing file, or create the file when it is missing.',
  replace: 'With `anchor`, replace that exact text in the file. Without `anchor`, replace the whole file.',
  run: 'Run this shell command.',
} as const;

export type InstallationBlockOperation = keyof typeof INSTALLATION_BLOCK_OPERATIONS;

/** Where a merged HTML block belongs in its page. */
export const INSTALLATION_BLOCK_PLACEMENTS = {
  head: 'Inside the page `<head>`.',
  body: 'Inside the page `<body>`, where the player should appear.',
} as const;

export type InstallationBlockPlacement = keyof typeof INSTALLATION_BLOCK_PLACEMENTS;

/** When a conditional step applies. */
export const INSTALLATION_STEP_CONDITIONS = {
  'when-components-json-missing': 'Only when components.json is missing.',
  'when-components-json-missing-or-nonstandard':
    'Only when components.json is missing or does not use the standard https://ui.shadcn.com/schema.json schema.',
  'when-components-json-nonstandard':
    'Only when components.json exists but does not use the standard https://ui.shadcn.com/schema.json schema.',
} as const;

export type InstallationStepCondition = keyof typeof INSTALLATION_STEP_CONDITIONS;

/** The plan fields beyond each step's title, description, and code. */
export const INSTALLATION_PLAN_FIELDS = {
  'steps[].workingDirectory':
    'Directory, relative to where agents init ran, to run the step commands and resolve its filenames from. A new app scaffolded into a subdirectory changes it for every later step.',
  'steps[].condition': 'Run the step only when its condition holds.',
  'steps[].removeFiles': "Starter files to delete, when present, after applying the step's blocks.",
  'steps[].blocks[].operation': 'What to do with the block.',
  'steps[].blocks[].anchor': 'The exact existing text a `replace` operation targets.',
  'steps[].blocks[].placement': 'Where a merged HTML block belongs in its page.',
  'steps[].blocks[].insertContents':
    "After applying the block, replace each `anchor` in the file with the full contents of the `from` file, after that file's own edits.",
  'steps[].blocks[].longRunning':
    'The command keeps running, such as a development server. Start it in the background, verify the result, then stop it.',
} as const;

export interface InstallationCodeBlock {
  language: string;
  code: string;
  filename?: string;
  operation: InstallationBlockOperation;
  anchor?: string;
  placement?: InstallationBlockPlacement;
  insertContents?: readonly { anchor: string; from: string }[];
  longRunning?: true;
}

export interface InstallationStep {
  id: string;
  title: string;
  description?: string;
  condition?: InstallationStepCondition;
  workingDirectory: string;
  removeFiles?: readonly string[];
  blocks: readonly InstallationCodeBlock[];
}

/** A step before `createInstallationPlan` assigns its working directory. */
type InstallationStepContent = Omit<InstallationStep, 'workingDirectory'>;

export interface InstallationPlan {
  schemaVersion: 1;
  kind: 'instructions';
  package: typeof INSTALLATION_CLI_PACKAGE;
  packageVersion: string;
  /** The player package these instructions install. */
  playerPackage: PlayerPackage;
  selection: InstallationSelection;
  resolvedSourceUrl: string;
  reproduceCommand: string;
  steps: readonly InstallationStep[];
  next: readonly { label: string; url: string }[];
  notice: string;
}

export interface InstallationPlanFormat {
  fields: typeof INSTALLATION_PLAN_FIELDS;
  operations: typeof INSTALLATION_BLOCK_OPERATIONS;
  placements: typeof INSTALLATION_BLOCK_PLACEMENTS;
  conditions: typeof INSTALLATION_STEP_CONDITIONS;
}

export interface InstallationDiscovery {
  schemaVersion: 1;
  kind: 'discovery';
  package: typeof INSTALLATION_CLI_PACKAGE;
  packageVersion: string;
  command: string;
  options: readonly InstallationOptionDefinition[];
  compatibility: InstallationDiscoveryCompatibility;
  decisionOrder: readonly { title: string; guidance: string }[];
  /** The vocabulary of the instruction plans that selections return. */
  planFormat: InstallationPlanFormat;
  examples: readonly string[];
  notice: string;
}

/** The package whose `agents init` command prints installation instructions. */
export const INSTALLATION_CLI_PACKAGE = '@videojs/cli';

export const PLAYER_PACKAGES = {
  html: '@videojs/html',
  react: '@videojs/react',
} as const satisfies Record<PlayerOwner, string>;

export type PlayerPackage = (typeof PLAYER_PACKAGES)[PlayerOwner];

function shellQuote(value: string): string {
  return /^[a-z0-9_./:@-]+$/i.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
}

export function installationCommand(input?: InstallationInput, packageVersion: string | null = null): string {
  const packageSpecifier = packageVersion ? `${INSTALLATION_CLI_PACKAGE}@${packageVersion}` : INSTALLATION_CLI_PACKAGE;
  const parts = [`npx ${packageSpecifier} agents init`];

  if (!input) return parts[0]!;

  for (const { key, flag } of INSTALLATION_PARAMETERS) {
    const value = input[key];

    if (value) parts.push(`${flag} ${shellQuote(value)}`);
  }

  return parts.join(' ');
}

/** Every choice that applies to a resolved selection, so a rerun never depends on defaults or project detection. */
export function installationReproduceInput(selection: InstallationSelection): InstallationInput {
  const explicit = selectionToInput(selection);
  const input: InstallationInput = {
    method: explicit.method,
    framework: explicit.framework,
    project: explicit.project,
    preset: explicit.preset,
    media: explicit.media,
    extensions: explicit.extensions,
    sourceUrl: explicit.sourceUrl,
  };

  if (selection.useCase !== 'background-video') input.skin = explicit.skin;

  if (selection.method !== 'cdn' || selection.template !== 'none') {
    input.packageManager = explicit.packageManager;
  }

  input.template = explicit.template;

  if (selection.method === 'shadcn') {
    input.styling = explicit.styling;
  }

  return input;
}

/** The options that apply to a plan, keyed by public option name in flag order, as Markdown and JSON list them. */
export function installationSelectedOptions(plan: InstallationPlan): Record<string, string> {
  const input = installationReproduceInput(plan.selection);

  return Object.fromEntries(
    INSTALLATION_PARAMETERS.flatMap(({ key, query }) => {
      const value = input[key];

      return value === undefined ? [] : [[query, value]];
    })
  );
}

export const INSTALLATION_PLAN_FORMAT: InstallationPlanFormat = {
  fields: INSTALLATION_PLAN_FIELDS,
  operations: INSTALLATION_BLOCK_OPERATIONS,
  placements: INSTALLATION_BLOCK_PLACEMENTS,
  conditions: INSTALLATION_STEP_CONDITIONS,
};

/** The option reference printed by a bare `agents init`, covering every framework and installation method. */
export function createInstallationDiscovery(
  packageVersion: string,
  defaults: InstallationSelectionDefaults = {}
): InstallationDiscovery {
  const command = installationCommand(undefined, packageVersion);
  const packageManager = defaults.packageManager?.value ?? 'pnpm';
  const options = installationOptionDefinitionsFor({
    methods: INSTALLATION_METHODS,
    frameworks: INSTALLATION_FRAMEWORKS,
  }).map((option) => {
    const detected =
      option.flag === '--method'
        ? defaults.method
        : option.flag === '--package-manager'
          ? defaults.packageManager
          : option.flag === '--framework'
            ? defaults.framework
            : option.flag === '--template'
              ? defaults.template
              : undefined;
    if (detected?.value) return { ...option, default: `${detected.value} (from ${detected.source})` };

    if (option.flag !== '--framework') return option;

    return { ...option, default: 'detected from package.json dependencies; otherwise html' };
  });
  const reactInput: InstallationInput = {
    method: 'packaged',
    framework: 'react',
    project: 'existing',
    template: 'next',
    preset: 'video',
    skin: 'default',
    media: 'mux-video',
    extensions: 'mux-data',
    sourceUrl: INSTALLATION_DEMO_SOURCES.videoHls,
    packageManager,
  };
  const htmlInput: InstallationInput = {
    method: 'shadcn',
    framework: 'html',
    project: 'new',
    template: 'vite',
    preset: 'video',
    skin: 'default',
    media: 'html5-video',
    extensions: 'none',
    sourceUrl: INSTALLATION_DEMO_SOURCE_URL,
    packageManager,
    styling: 'css',
  };
  const cdnInput: InstallationInput = {
    method: 'cdn',
    framework: 'html',
    project: 'new',
    template: 'vite',
    preset: 'video',
    skin: 'default',
    media: 'html5-video',
    extensions: 'none',
    sourceUrl: INSTALLATION_DEMO_SOURCE_URL,
    packageManager,
  };

  return {
    schemaVersion: 1,
    kind: 'discovery',
    package: INSTALLATION_CLI_PACKAGE,
    packageVersion,
    command,
    options,
    compatibility: installationCompatibilityFor(INSTALLATION_FRAMEWORKS),
    decisionOrder: installationDecisionOrderFor({ methods: INSTALLATION_METHODS, frameworks: INSTALLATION_FRAMEWORKS }),
    planFormat: INSTALLATION_PLAN_FORMAT,
    examples: [
      installationCommand(reactInput, packageVersion),
      installationCommand(htmlInput, packageVersion),
      installationCommand(cdnInput, packageVersion),
    ],
    notice:
      'This command prints instructions. Packaged and CDN dependencies match this CLI version; Shadcn copies the current registry source. It never installs packages, prompts, saves preferences, or writes files.',
  };
}

type CodeBlockOptions = Omit<InstallationCodeBlock, 'language' | 'code'>;

function command(value: string, options: Omit<CodeBlockOptions, 'operation'> = {}): InstallationCodeBlock {
  return { language: 'bash', code: value, operation: 'run', ...options };
}

function file(language: string, value: string, options: CodeBlockOptions): InstallationCodeBlock {
  return { language, code: value, ...options };
}

/** A file the player adds: created in a new app, merged into an existing app that may already have it. */
function addedFile(selection: InstallationSelection, language: string, value: string, filename: string) {
  return file(language, value, { filename, operation: selection.project === 'new' ? 'create' : 'merge' });
}

/** The page that renders the player: it replaces a new app's starter page and merges into an existing one. */
function pageFile(selection: InstallationSelection, language: string, value: string, filename: string) {
  return file(language, value, { filename, operation: selection.project === 'new' ? 'replace' : 'merge' });
}

/** The HTML page that renders the player; a new app gets a complete document in place of its starter page. */
function htmlPageFile(
  selection: InstallationSelection,
  markup: string,
  project: InstallationProjectFiles,
  options: Pick<CodeBlockOptions, 'insertContents'> = {}
): InstallationCodeBlock {
  const page = installationHtmlPlayerPageCode(markup, selection.template, project.usage!, selection.project);

  return selection.project === 'new'
    ? file('html', page, { filename: project.player, operation: 'replace', ...options })
    : file('html', page, { filename: project.player, operation: 'merge', placement: 'body', ...options });
}

function installationOptions(selection: InstallationSelection): InstallationOptions {
  return {
    useCase: selection.useCase,
    skin: selection.skin,
    media: selection.media,
    extensions: selection.extensions,
    sourceUrl: selection.sourceUrl,
    installMethod: selection.method === 'cdn' ? 'cdn' : selection.packageManager,
  };
}

/** New Laravel apps and Shadcn's own app scaffold land in a named subdirectory; other scaffolds run in place. */
function installationAppDirectory(selection: InstallationSelection, project: InstallationProjectFiles): string {
  if (selection.project !== 'new') return '.';

  if (selection.template === 'laravel') return INSTALLATION_NEW_APP_DIRECTORY;

  if (selection.method !== 'shadcn' || !selection.styling) return '.';

  const configuration = shadcnProjectConfiguration(
    selection.sourceFramework,
    selection.template,
    selection.styling,
    project.componentsAlias
  );

  return shadcnProjectSetup(configuration, selection.project) === 'create-app' ? INSTALLATION_NEW_APP_DIRECTORY : '.';
}

const SUBDIRECTORY_SCAFFOLD_DESCRIPTION = `Run this from the parent directory. It creates \`${INSTALLATION_NEW_APP_DIRECTORY}\`; rename it if needed and use the new name as the working directory of every later step.`;

function packageInstallStep(value: string): InstallationStepContent {
  return { id: 'install', title: 'Install the packages', blocks: [command(value)] };
}

function prepareAppStep(selection: InstallationSelection): InstallationStepContent | null {
  if (selection.project === 'existing') return null;

  const value = installationProjectCreateCommand(selection.framework, selection.template, selection.packageManager);
  if (!value) throw new Error('A new project needs an app setup command.');

  const templateLabel = INSTALLATION_TEMPLATE_LABELS[selection.template];
  const article = selection.template === 'astro' ? 'an' : 'a';

  return {
    id: 'prepare-app',
    title: 'Create the app',
    description:
      selection.method === 'cdn'
        ? 'Scaffold a minimal Vite site in the intended empty app directory, then continue from that directory.'
        : selection.template === 'laravel'
          ? `Make sure PHP, Composer, and the Laravel installer are available. ${SUBDIRECTORY_SCAFFOLD_DESCRIPTION}`
          : `Scaffold ${article} ${templateLabel} app in the intended empty app directory, then continue from that directory.`,
    blocks: [command(value)],
  };
}

function runAppStep(selection: InstallationSelection): InstallationStepContent | null {
  const value = installationProjectRunCommand(selection.template, selection.packageManager);
  if (!value) return null;

  return {
    id: 'run',
    title: 'Run your app',
    description: 'Start the development server and verify that the selected media plays.',
    blocks: [command(value, { longRunning: true })],
  };
}

function playerFileDescription(selection: InstallationSelection): string {
  if (selection.template === 'none') {
    return 'The filenames are generic. Packaged modules need a bundler: add the imports to an entry your existing build already bundles, and load its output with type="module", because an IIFE bundle fails with StoreError: NO_TARGET. If the site has no build step, use --method cdn instead.';
  }

  return selection.project === 'new'
    ? 'Add these files to the new app. Blocks marked replace overwrite the starter files.'
    : `Merge the example into the existing ${INSTALLATION_TEMPLATE_LABELS[selection.template]} route or component that should render the player, and preserve unrelated content.`;
}

/** Drop the steps that do not apply to a selection while keeping the plan order. */
function presentSteps(...steps: readonly (InstallationStepContent | null)[]): InstallationStepContent[] {
  return steps.filter((step) => step !== null);
}

function playerStep(
  selection: InstallationSelection,
  description: string,
  blocks: readonly InstallationCodeBlock[]
): InstallationStepContent {
  const step: InstallationStepContent = { id: 'player', title: 'Add your player', description, blocks };
  const removeFiles =
    selection.project === 'new' ? installationStarterFiles(selection.framework, selection.template) : [];

  if (removeFiles.length > 0) step.removeFiles = removeFiles;

  return step;
}

function htmlEntrySetupStep(
  template: InstallationSelection['template'],
  entryFile: string
): InstallationStepContent | null {
  const entrySetup = installationHtmlEntrySetup(template, entryFile);
  if (entrySetup.length === 0) return null;

  return {
    id: 'configure-app-entry',
    title: 'Configure your app entry',
    description: `Merge the generated player entry into the existing ${entrySetup[0]!.filename} configuration. Keep every existing input, plugin, and option.`,
    blocks: entrySetup.map((block) =>
      file(block.language, block.code, { filename: block.filename, operation: 'merge' })
    ),
  };
}

function reactPlayerBlocks(
  selection: InstallationSelection,
  pageCode: string,
  project: InstallationProjectFiles
): InstallationCodeBlock[] {
  const usage = installationReactUsageCode(selection.template);
  const player = installationReactPlayerCode(pageCode, selection.template);

  // Astro renders the player as a component from its page; every other app setup renders it as the page itself.
  if (!usage || !project.usage) return [pageFile(selection, 'tsx', player, project.player)];

  return [addedFile(selection, 'tsx', player, project.player), pageFile(selection, 'astro', usage, project.usage)];
}

function packagedPlayerSteps(
  selection: InstallationSelection,
  opts: InstallationOptions,
  project: InstallationProjectFiles
): InstallationStepContent[] {
  if (selection.framework === 'react') {
    const player = generateReactCreateCode(opts);

    return [
      playerStep(
        selection,
        playerFileDescription(selection),
        reactPlayerBlocks(selection, player['app/page.tsx'], project)
      ),
    ];
  }

  if (selection.framework === 'vue') {
    const config = generateVueCustomElementConfigCode(opts);
    const component = generateVueCreateCode(opts);
    const usage = generateVueUsageCode({ ...opts, playerImport: project.playerImport });
    const astro = selection.template === 'astro';

    return [
      {
        id: 'configure',
        title: 'Register custom elements',
        description: 'Use the file that matches your Vue toolchain.',
        blocks: [
          file(astro ? 'js' : 'ts', config[installationVueConfigFilename(selection.template)], {
            filename: project.config!,
            operation: 'merge',
          }),
        ],
      },
      playerStep(selection, playerFileDescription(selection), [
        addedFile(selection, 'vue', component.component, project.player),
        pageFile(selection, astro ? 'astro' : 'vue', astro ? usage['index.astro'] : usage['App.vue'], project.usage!),
      ]),
    ];
  }

  if (selection.framework === 'svelte') {
    const component = generateSvelteCreateCode(opts);
    const usage = generateSvelteUsageCode({ ...opts, playerImport: project.playerImport });
    const usageCode =
      selection.template === 'astro'
        ? usage['index.astro']
        : selection.template === 'sveltekit'
          ? usage['+page.svelte']
          : usage['App.svelte'];

    return [
      playerStep(selection, playerFileDescription(selection), [
        addedFile(selection, 'svelte', component.component, project.player),
        pageFile(selection, selection.template === 'astro' ? 'astro' : 'svelte', usageCode, project.usage!),
      ]),
    ];
  }

  const usage = generateHTMLUsageCode(opts);

  return presentSteps(
    htmlEntrySetupStep(selection.template, project.usage!),
    playerStep(selection, playerFileDescription(selection), [
      ...(usage.imports ? [addedFile(selection, 'ts', usage.imports, project.usage!)] : []),
      htmlPageFile(selection, usage.html, project),
    ])
  );
}

function createPackagedSteps(selection: InstallationSelection, packageVersion: string): InstallationStepContent[] {
  const opts = installationOptions(selection);
  const project = installationProjectFiles(selection.framework, selection.template, selection.useCase);
  const install =
    selection.framework === 'react'
      ? generateReactInstallCode(opts, packageVersion)
      : generateHTMLInstallCode(opts, CDN_MEDIA_SUBPATHS, selection.cdnBase, packageVersion);

  return presentSteps(
    prepareAppStep(selection),
    packageInstallStep(install[selection.packageManager]),
    ...packagedPlayerSteps(selection, opts, project),
    runAppStep(selection)
  );
}

function cdnPageSteps(selection: InstallationSelection): InstallationStepContent[] {
  const opts = installationOptions(selection);
  const scripts = generateHTMLInstallCode(opts, CDN_MEDIA_SUBPATHS, selection.cdnBase).cdn;
  const markup = generateHTMLUsageCode(opts).html;

  if (selection.project === 'new') {
    return [
      playerStep(selection, 'Replace the starter page with this page, which loads Video.js and renders the player.', [
        file('html', installationHtmlDocumentCode(markup, scripts), { filename: 'index.html', operation: 'replace' }),
      ]),
    ];
  }

  return [
    {
      id: 'load',
      title: 'Load Video.js',
      description: 'Add these module scripts to the page head. Module scripts are deferred, so they wait for the page.',
      blocks: [file('html', scripts, { filename: 'index.html', operation: 'merge', placement: 'head' })],
    },
    playerStep(selection, 'Add this markup inside the page body where the player should appear.', [
      file('html', markup, { filename: 'index.html', operation: 'merge', placement: 'body' }),
    ]),
  ];
}

function createCdnSteps(selection: InstallationSelection): InstallationStepContent[] {
  return presentSteps(prepareAppStep(selection), ...cdnPageSteps(selection), runAppStep(selection));
}

const SHADCN_INIT_THEME_NOTE =
  '`shadcn init` also rewrites the theme tokens in the global stylesheet, such as app/globals.css or src/index.css; review that diff and restore any project tokens that should stay.';

function shadcnConfigurationSteps(
  selection: InstallationSelection & { styling: RegistryStyling },
  project: InstallationProjectFiles
): InstallationStepContent[] {
  const configuration = shadcnProjectConfiguration(
    selection.sourceFramework,
    selection.template,
    selection.styling,
    project.componentsAlias
  );
  const setup = shadcnProjectSetup(configuration, selection.project);
  const aliasBlocks = configuration.aliasSetup.map((block) =>
    file(block.language, block.code, { filename: block.filename, operation: 'merge' })
  );

  if (configuration.mode === 'components-json') {
    return presentSteps(
      prepareAppStep(selection),
      aliasBlocks.length > 0
        ? {
            id: 'configure-app-aliases',
            title: 'Configure app aliases',
            condition: 'when-components-json-missing-or-nonstandard',
            description: "Merge every app-alias block below, keeping the app's existing plugins and compiler options.",
            blocks: aliasBlocks,
          }
        : null,
      {
        id: 'create-components-json',
        title: 'Create components.json',
        condition: 'when-components-json-missing',
        description: `Create the standard config in the app directory. Its components alias maps registry files to ${project.componentsDirectory}.`,
        blocks: [file('json', configuration.componentsConfig, { filename: 'components.json', operation: 'create' })],
      },
      {
        id: 'convert-components-json',
        title: 'Convert components.json',
        condition: 'when-components-json-nonstandard',
        description:
          'Replace the framework-specific config with the standard config below, but keep the existing values under aliases in place of the generated ones, so registry files install where the app already expects its components.',
        blocks: [file('json', configuration.componentsConfig, { filename: 'components.json', operation: 'replace' })],
      }
    );
  }

  if (setup === 'create-app') {
    return [
      {
        id: 'prepare-app',
        title: 'Create and configure the app',
        description: `${SUBDIRECTORY_SCAFFOLD_DESCRIPTION} Shadcn creates the ${INSTALLATION_TEMPLATE_LABELS[selection.template]} app and components.json together.`,
        blocks: [command(shadcnInitCommand(selection.packageManager, selection.template))],
      },
    ];
  }

  if (setup === 'configure') {
    return [
      {
        id: 'configure-source-registry',
        title: 'Configure Shadcn',
        condition: 'when-components-json-missing',
        description: `Merge the alias configuration below, keeping the app's existing plugins and compiler options, then initialize Shadcn non-interactively. ${SHADCN_INIT_THEME_NOTE} This path assumes the app already uses Tailwind CSS; otherwise, rerun agents init with --styling css.`,
        blocks: [...aliasBlocks, command(shadcnInitCommand(selection.packageManager))],
      },
    ];
  }

  return [
    {
      id: 'create-components-json',
      title: 'Create components.json',
      condition: 'when-components-json-missing',
      description: `The registry steps below need components.json, so create it when the project has none. ${SHADCN_INIT_THEME_NOTE}`,
      blocks: [command(shadcnInitCommand(selection.packageManager))],
    },
  ];
}

function shadcnMediaStep(selection: InstallationSelection, packageVersion: string): InstallationStepContent | null {
  const mediaInstall = generateSourceMediaInstallCode(selection.media, packageVersion, selection.extensions);
  if (!mediaInstall) return null;

  const hasAdapter = getAdapterPackage(selection.media) !== null;
  const title = hasAdapter
    ? selection.extensions.length > 0
      ? 'Install the media adapter and extensions'
      : 'Install the media adapter'
    : 'Install the extensions';

  return {
    id: 'media-adapter',
    title,
    description: 'Install the supporting packages at the version that matches these instructions.',
    blocks: [command(mediaInstall[selection.packageManager])],
  };
}

function shadcnPlayerSteps(
  selection: InstallationSelection & { styling: RegistryStyling },
  opts: InstallationOptions,
  project: InstallationProjectFiles
): InstallationStepContent[] {
  if (selection.framework === 'react') {
    const player = generateSourceReactCreateCode({
      ...opts,
      componentsAlias: project.componentsAlias,
      styling: selection.styling,
    });

    return [
      playerStep(
        selection,
        `Use the aliases.components value from components.json in the skin import when it differs from the generated ${project.componentsAlias} path. ${playerFileDescription(selection)}`,
        reactPlayerBlocks(selection, player['app/page.tsx'], project)
      ),
    ];
  }

  const player = generateSourceHTMLUsageCode({
    ...opts,
    componentsAlias: project.componentsAlias,
    componentsDirectory: project.componentsDirectory,
  });
  const mediaPlaceholder = '<!-- Add a compatible media component here. -->';

  return presentSteps(
    htmlEntrySetupStep(selection.template, project.usage!),
    playerStep(
      selection,
      `Use the aliases.components value from components.json when it differs from the generated ${project.componentsAlias} path: the skin file then lives under the directory that alias maps to instead of ${project.componentsDirectory}, and the skin import uses that alias. Replace the ${mediaPlaceholder} placeholder in ${player.skinFile} with the media snippet below.${player.container ? ` Size the video on the skin's root media-container by replacing its opening ${player.container.anchor} with the snippet below.` : ''} Then replace the ${player.skinPlaceholder} comment in the page with the complete updated skin markup. ${playerFileDescription(selection)}`,
      [
        file('html', player.media, { filename: player.skinFile, operation: 'replace', anchor: mediaPlaceholder }),
        ...(player.container
          ? [
              file('html', player.container.code, {
                filename: player.skinFile,
                operation: 'replace',
                anchor: player.container.anchor,
              }),
            ]
          : []),
        addedFile(selection, 'ts', player.imports, project.usage!),
        htmlPageFile(selection, player.player, project, {
          insertContents: [{ anchor: player.skinPlaceholder, from: player.skinFile }],
        }),
      ]
    )
  );
}

function createShadcnSteps(selection: InstallationSelection, packageVersion: string): InstallationStepContent[] {
  const opts = installationOptions(selection);
  const registry = registrySkinSelection({ useCase: selection.useCase, skin: selection.skin });
  const { styling } = selection;
  if (!registry || !styling) throw new Error('Invalid Shadcn selection');

  const project = installationProjectFiles(selection.framework, selection.template, selection.useCase);

  return presentSteps(
    ...shadcnConfigurationSteps({ ...selection, styling }, project),
    {
      id: 'videojs-registry',
      title: 'Add the Video.js Registry',
      description:
        'This adds the selected @videojs catalog when the namespace is missing. If components.json already defines @videojs with another URL, replace that value with the URL from this command first because Shadcn skips configured namespaces.',
      blocks: [
        command(shadcnRegistryAddCommand(selection.packageManager, selection.sourceFramework, styling, registry.theme)),
      ],
    },
    {
      id: 'skin-source',
      title: 'Add the skin source',
      description: [
        selection.project === 'existing'
          ? 'Make sure the working tree is clean or checkpointed so every added or replaced file is reviewable; ask before committing.'
          : null,
        'The add command overwrites an existing Video.js skin so catalog and theme changes fully apply. Review and remove obsolete Video.js style files left by a previous catalog.',
        selection.sourceFramework === 'html'
          ? 'The later media step restores the selected media component after an overwrite.'
          : null,
      ]
        .filter((sentence) => sentence !== null)
        .join(' '),
      blocks: [command(shadcnAddCommand(selection.packageManager, [registry.item]))],
    },
    shadcnMediaStep(selection, packageVersion),
    ...shadcnPlayerSteps({ ...selection, styling }, opts, project),
    runAppStep(selection)
  );
}

/**
 * @param commandVersion - Version pinned in `reproduceCommand`. Pass `null` when the plan is published ahead of the
 *   package it describes, such as docs built from main, so the command runs the project's installed version.
 */
export function createInstallationPlan(
  selection: InstallationSelection,
  packageVersion: string,
  commandVersion: string | null = packageVersion
): InstallationPlan {
  const resolvedSourceUrl = resolveInstallationSourceUrl(selection.sourceUrl, selection.media, selection.useCase);
  const resolvedSelection = { ...selection, sourceUrl: resolvedSourceUrl };
  const appDirectory = installationAppDirectory(
    selection,
    installationProjectFiles(selection.framework, selection.template, selection.useCase)
  );

  const steps =
    selection.method === 'cdn'
      ? createCdnSteps(selection)
      : selection.method === 'shadcn'
        ? createShadcnSteps(selection, packageVersion)
        : createPackagedSteps(selection, packageVersion);
  const docsFramework = selection.framework === 'react' ? 'react' : 'html';

  return {
    schemaVersion: 1,
    kind: 'instructions',
    package: INSTALLATION_CLI_PACKAGE,
    packageVersion,
    playerPackage: PLAYER_PACKAGES[selection.owner],
    selection: resolvedSelection,
    resolvedSourceUrl,
    reproduceCommand: installationCommand(installationReproduceInput(resolvedSelection), commandVersion),
    // The scaffold runs where agents init ran; everything after it runs inside the app it creates.
    steps: steps.map((step) => ({ ...step, workingDirectory: step.id === 'prepare-app' ? '.' : appDirectory })),
    next: [
      {
        label: 'Customize skins',
        url: `https://videojs.org/docs/framework/${docsFramework}/guides/customize-skins`,
      },
      {
        label: 'Browser support',
        url: `https://videojs.org/docs/framework/${docsFramework}/guides/browser-support`,
      },
    ],
    notice:
      selection.method === 'shadcn'
        ? 'These are instructions only. Review and run the commands in your project; no files were modified. Shadcn copies the current Video.js registry source, while package installs use the version shown above.'
        : 'These are instructions only. Review and run the commands in your project; no files were modified.',
  };
}
