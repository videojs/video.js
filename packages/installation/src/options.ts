import { INSTALLATION_DEMO_SOURCE_URL } from './defaults';
import { INSTALLATION_EXTENSIONS } from './extensions';
import {
  CLI_OPTION_SYNTAX,
  INSTALLATION_PROJECTS,
  installationParameterForKey,
  PACKAGE_MANAGERS,
  type InstallationInputKey,
  type InstallationOptionSyntax,
} from './parameters';
import { INSTALLATION_PRESETS, INSTALLATION_SKIN_FLAGS } from './presets';
import {
  defaultInstallationTemplate,
  installationTemplates,
  type InstallationFramework,
  type InstallationTemplate,
} from './projects';
import { RENDERERS, type Renderer } from './renderers';
import {
  installationMethodsForFramework,
  installationTemplatesForMethod,
  sourceFrameworkFor,
  type InstallationMethod,
  type PresetFlag,
  type SkinFlag,
} from './selection';
import { defaultRegistryStyling, registryStylings, type RegistryStyling } from './shadcn';

export interface InstallationOptionDefinition {
  flag: string;
  query?: string;
  values?: readonly string[];
  default: string;
  description: string;
  appliesWhen?: string;
}

function optionDefinition(
  key: InstallationInputKey,
  definition: Omit<InstallationOptionDefinition, 'flag' | 'query'>
): InstallationOptionDefinition {
  const parameter = installationParameterForKey(key);

  return { ...definition, flag: parameter.flag, query: parameter.query };
}

export interface InstallationOptionContext {
  methods: readonly InstallationMethod[];
  frameworks: readonly InstallationFramework[];
}

export interface InstallationDecision {
  title: string;
  guidance: string;
}

export interface InstallationCompatibility {
  methodsByFramework: Readonly<Record<InstallationFramework, readonly InstallationMethod[]>>;
  templatesByFramework: Readonly<Record<InstallationFramework, readonly InstallationTemplate[]>>;
  mediaByPreset: Readonly<Record<PresetFlag, readonly Renderer[]>>;
  shadcn: {
    presets: readonly PresetFlag[];
    skins: readonly SkinFlag[];
    stylingsByFramework: Readonly<Partial<Record<InstallationFramework, readonly RegistryStyling[]>>>;
  };
}

export interface InstallationDiscoveryCompatibility {
  methodsByFramework: Readonly<Partial<InstallationCompatibility['methodsByFramework']>>;
  templatesByFramework: Readonly<Partial<InstallationCompatibility['templatesByFramework']>>;
  mediaByPreset: InstallationCompatibility['mediaByPreset'];
  shadcn: {
    presets: InstallationCompatibility['shadcn']['presets'];
    skins: InstallationCompatibility['shadcn']['skins'];
    stylingsByFramework: Readonly<Partial<InstallationCompatibility['shadcn']['stylingsByFramework']>>;
  };
}

const SHADCN_PRESETS = Object.values(INSTALLATION_PRESETS)
  .map(({ flag }) => flag)
  .filter((flag) => flag !== 'background-video');

export const installationCompatibility: InstallationCompatibility = {
  methodsByFramework: {
    react: installationMethodsForFramework('react'),
    html: installationMethodsForFramework('html'),
    vue: installationMethodsForFramework('vue'),
    svelte: installationMethodsForFramework('svelte'),
  },
  templatesByFramework: {
    react: installationTemplates('react'),
    html: installationTemplates('html'),
    vue: installationTemplates('vue'),
    svelte: installationTemplates('svelte'),
  },
  mediaByPreset: {
    video: INSTALLATION_PRESETS['default-video'].renderers,
    audio: INSTALLATION_PRESETS['default-audio'].renderers,
    'live-video': INSTALLATION_PRESETS['live-video'].renderers,
    'live-audio': INSTALLATION_PRESETS['live-audio'].renderers,
    'background-video': INSTALLATION_PRESETS['background-video'].renderers,
  },
  shadcn: {
    presets: SHADCN_PRESETS,
    skins: INSTALLATION_SKIN_FLAGS.filter((skin) => skin !== 'none'),
    stylingsByFramework: {
      react: registryStylings('react'),
      html: registryStylings('html'),
    },
  },
};

export function installationCompatibilityFor(
  frameworks: readonly InstallationFramework[]
): InstallationDiscoveryCompatibility {
  return {
    methodsByFramework: Object.fromEntries(
      frameworks.map((framework) => [framework, installationCompatibility.methodsByFramework[framework]])
    ),
    templatesByFramework: Object.fromEntries(
      frameworks.map((framework) => [framework, installationCompatibility.templatesByFramework[framework]])
    ),
    mediaByPreset: installationCompatibility.mediaByPreset,
    shadcn: {
      presets: installationCompatibility.shadcn.presets,
      skins: installationCompatibility.shadcn.skins,
      stylingsByFramework: Object.fromEntries(
        frameworks.flatMap((framework) => {
          const stylings = installationCompatibility.shadcn.stylingsByFramework[framework];

          return stylings ? [[framework, stylings]] : [];
        })
      ),
    },
  };
}

function formatChoices(values: readonly string[]): string {
  if (values.length < 2) return values[0] ?? '';

  if (values.length === 2) return `${values[0]} or ${values[1]}`;

  return `${values.slice(0, -1).join(', ')}, or ${values.at(-1)}`;
}

function unique<Choice extends string>(values: readonly Choice[]): Choice[] {
  return [...new Set(values)];
}

/** The ordered choices an agent should resolve before requesting one complete installation plan. */
export function installationDecisionOrderFor(
  { methods, frameworks }: InstallationOptionContext,
  syntax: InstallationOptionSyntax = CLI_OPTION_SYNTAX
): readonly InstallationDecision[] {
  const skinlessGuidance =
    methods.length === 1 && methods[0] === 'shadcn'
      ? ''
      : `Use none only when the project builds its own controls${methods.includes('shadcn') ? ', which Shadcn does not support' : ''}. `;
  const methodGuidance =
    methods.length === 1
      ? methods[0] === 'packaged'
        ? 'This guide uses packaged modules, which need a bundler. Match the package manager to the project lockfile. For an existing HTML site without a build step, use CDN scripts instead.'
        : methods[0] === 'shadcn'
          ? 'This guide uses Shadcn to copy editable skin source. React uses the React source catalog; plain HTML uses the HTML source catalog. Vue and Svelte use packaged modules.'
          : 'This guide uses CDN scripts for plain HTML. Use an existing page when one is available, and scaffold a minimal Vite app only when no app exists.'
      : frameworks.length === 1 && frameworks[0] === 'react'
        ? 'Use packaged modules by default or Shadcn when the project should own editable skin source. CDN scripts are available for plain HTML only.'
        : frameworks.includes('react')
          ? 'Use packaged modules by default, or Shadcn when a React or plain HTML project should own editable skin source. CDN scripts are for plain HTML only; packaged modules need a bundler, so use CDN for an existing site without a build step. Vue and Svelte use packaged modules. CDN can use any existing HTML page or app; only scaffold a minimal Vite app when no app exists. The HTML source registry uses CSS styling.'
          : 'Use packaged modules by default, Shadcn when a plain HTML project should own editable skin source, or CDN for a plain HTML integration. Packaged modules need a bundler, so use CDN for an existing site without a build step. Vue and Svelte use packaged modules. CDN can use any existing HTML page or app; only scaffold a minimal Vite app when no app exists. The HTML source registry uses CSS styling.';

  const stylingDecisions: InstallationDecision[] =
    methods.includes('shadcn') && frameworks.includes('react')
      ? [
          {
            title: 'Choose the styling',
            guidance: `${methods.length === 1 ? '' : 'Only for Shadcn. '}For React, use tailwind in a new app or an existing Tailwind app; otherwise use css. HTML source uses css.`,
          },
        ]
      : [];

  return [
    {
      title: 'Inspect the project',
      guidance:
        'Read package.json, framework config, and lockfiles to infer the framework, app setup, and package manager. React installs @videojs/react; HTML, Vue, and Svelte install @videojs/html.',
    },
    {
      title: 'Choose the starting point',
      guidance:
        'Use existing when adapting a compatible project. Use new only when the user wants a new app or the intended workspace has no app. Confirm the choice when the workspace and request do not make it clear.',
    },
    {
      title: 'Choose the player',
      guidance:
        'Use video unless the request signals another experience: audio, music, or podcasts use audio; a live stream uses live-video or live-audio; a muted, looping decorative video uses background-video. Ask only when those signals conflict.',
    },
    {
      title: 'Choose the skin',
      guidance: `Use default unless the request asks for a minimal, cleaner, or more subtle look, which uses neutral; both contain the same controls. ${skinlessGuidance}Ask only when those signals conflict.`,
    },
    {
      title: 'Choose the media',
      guidance:
        'Infer the adapter from the source when possible. Mux wins for Mux playback URLs: stream.mux.com/<playback-id>.m3u8 or a bare playback ID uses mux-video, mux-audio, or mux-background-video rather than hls. Mux static renditions such as .mp4 or .m4a files use html5-video or html5-audio. Other .m3u8 URLs use hls.',
    },
    {
      title: 'Choose extensions',
      guidance:
        'Mux Data is included by default for Mux video and audio sources. Add Google Cast when a standard or live video player with a ready-made skin should cast a compatible source. Use none when no extension is needed.',
    },
    { title: 'Choose how to install', guidance: methodGuidance },
    ...stylingDecisions,
    {
      title: 'Return one explicit plan',
      guidance: `Confirm the choices once, then pass every applicable ${syntax.noun}, including \`${syntax.options(['extensions', 'none'])}\` when no extension is needed and \`${syntax.options(['sourceUrl', INSTALLATION_DEMO_SOURCE_URL])}\` when there is no media URL yet. Check that Defaulted options says none. Adapt conditional setup steps and existing paths before changing files.`,
    },
  ];
}

export function installationOptionDefinitionsFor(
  context: InstallationOptionContext,
  syntax: InstallationOptionSyntax = CLI_OPTION_SYNTAX
): readonly InstallationOptionDefinition[] {
  const { methods, frameworks } = context;
  const shadcnOnly = methods.length === 1 && methods[0] === 'shadcn';
  const supportsShadcn = methods.includes('shadcn');
  const sourceFrameworks = unique(frameworks.map(sourceFrameworkFor));
  const cdnOnly = methods.length === 1 && methods[0] === 'cdn';
  const templates = unique(
    methods.flatMap((method) => frameworks.flatMap((framework) => installationTemplatesForMethod(framework, method)))
  );
  const templateDefaults = cdnOnly ? (['none'] as const) : unique(frameworks.map(defaultInstallationTemplate));
  const stylings = unique(sourceFrameworks.flatMap((framework) => registryStylings(framework)));
  // Only describe `none` where one of the listed paths offers it; React has no `none` app setup.
  const templateDescription = [
    'The app setup and file layout.',
    ...(templates.includes('none')
      ? [
          methods.includes('cdn') ? 'CDN defaults to `none` for an existing page and `vite` for a new app.' : null,
          methods.includes('packaged')
            ? 'Packaged `none` needs an existing bundler; use CDN for a site without a build step.'
            : null,
          supportsShadcn ? '`none` is unavailable with Shadcn.' : null,
        ]
      : []),
  ]
    .filter((sentence) => sentence !== null)
    .join(' ');
  const definitions: InstallationOptionDefinition[] = [
    optionDefinition('method', {
      values: methods,
      default: methods[0]!,
      description: `Choose ${formatChoices(
        methods.map((method) =>
          method === 'packaged' ? 'packaged modules' : method === 'shadcn' ? 'editable Shadcn source' : 'CDN scripts'
        )
      )}.`,
    }),
    optionDefinition('framework', {
      values: frameworks,
      default: frameworks[0]!,
      description:
        'The application framework that will host the player. React installs @videojs/react; HTML, Vue, and Svelte install @videojs/html.',
    }),
    optionDefinition('project', {
      values: INSTALLATION_PROJECTS,
      default: 'existing',
      description: 'Whether to adapt the current project or scaffold a new one. New projects need a named app setup.',
    }),
    optionDefinition('preset', {
      values: shadcnOnly
        ? installationCompatibility.shadcn.presets
        : Object.values(INSTALLATION_PRESETS).map(({ flag }) => flag),
      default: 'video',
      description: 'The player configuration and control set.',
    }),
    optionDefinition('skin', {
      values: shadcnOnly ? installationCompatibility.shadcn.skins : INSTALLATION_SKIN_FLAGS,
      default: 'default',
      description: 'The visual skin. Neutral has cleaner surfaces and the same controls as Default.',
      appliesWhen: `${syntax.options(['preset'])} is not background-video`,
    }),
    optionDefinition('media', {
      values: RENDERERS,
      default: "the selected preset's first compatible media source",
      description: 'The media source or playback adapter. See the preset compatibility map below.',
    }),
    optionDefinition('extensions', {
      values: ['none', ...INSTALLATION_EXTENSIONS],
      default: 'mux-data for Mux media; none otherwise (reported as defaulted)',
      description:
        'A comma-separated list of optional player extensions compatible with the selected player. Pass `none` when no extension is needed.',
    }),
    optionDefinition('sourceUrl', {
      default: 'the Video.js demo source for the selected media (reported as defaulted)',
      description: `The http:// or https:// media URL placed in the generated player example. Pass \`${INSTALLATION_DEMO_SOURCE_URL}\` to choose the Video.js demo source for the selected media explicitly.`,
    }),
  ];

  definitions.push(
    optionDefinition('packageManager', {
      values: PACKAGE_MANAGERS,
      default:
        'the packageManager field or lockfile; otherwise the invoking bun, pnpm, or yarn; otherwise pnpm when it is on PATH; otherwise npm',
      description: 'The command runner used for app setup, packages, Shadcn, and the development server.',
      appliesWhen: `${syntax.options(['method'])} is not cdn with ${syntax.options(['template'])} none`,
    }),
    optionDefinition('template', {
      values: templates,
      default: templateDefaults.length === 1 ? templateDefaults[0]! : 'next for React; vite otherwise',
      description: templateDescription,
    })
  );

  if (supportsShadcn) {
    definitions.push(
      optionDefinition('styling', {
        values: stylings,
        default:
          sourceFrameworks.length === 1
            ? defaultRegistryStyling(sourceFrameworks[0]!)
            : 'tailwind for React; css otherwise',
        description: 'The Shadcn source styling. Compatible values depend on the framework.',
        appliesWhen: syntax.options(['method', 'shadcn']),
      })
    );
  }

  definitions.push({
    flag: '--json',
    default: 'false',
    description: 'Return one structured JSON document instead of Markdown.',
  });

  return definitions;
}
