import { rendererSupportsCdn } from './cdn-code';
import { CDN_MEDIA_SUBPATHS, cdnBaseForVersion, INSTALLATION_DEMO_SOURCE_URL } from './defaults';
import {
  defaultInstallationExtensions,
  INSTALLATION_EXTENSIONS,
  installationExtensionsFor,
  isInstallationExtension,
  parseInstallationExtensions,
  serializeInstallationExtensions,
  type InstallationExtension,
} from './extensions';
import {
  CLI_OPTION_SYNTAX,
  INSTALLATION_PROJECTS,
  PACKAGE_MANAGERS,
  type InstallationInput,
  type InstallationOptionSyntax,
  type InstallationInputKey,
  type InstallationProject,
  type PackageManager,
} from './parameters';
import {
  getInstallationPreset,
  INSTALLATION_PRESETS,
  INSTALLATION_SKIN_FLAGS,
  USE_CASES,
  type Skin,
  type UseCase,
} from './presets';
import {
  defaultInstallationTemplate,
  INSTALLATION_FRAMEWORKS,
  installationTemplates,
  type InstallationFramework,
  type InstallationTemplate,
} from './projects';
import { RENDERERS, type Renderer } from './renderers';
import { resolveRenderer, resolveRendererCandidates } from './resolve-renderer';
import { defaultRegistryStyling, registryStylings, type RegistryFramework, type RegistryStyling } from './shadcn';

export const INSTALLATION_METHODS = ['packaged', 'shadcn', 'cdn'] as const;
export type InstallationMethod = (typeof INSTALLATION_METHODS)[number];

export type InstallMethod = 'cdn' | PackageManager;

const INSTALLATION_METHODS_BY_FRAMEWORK = {
  react: ['packaged', 'shadcn'],
  html: ['packaged', 'shadcn', 'cdn'],
  vue: ['packaged'],
  svelte: ['packaged'],
} as const satisfies Record<InstallationFramework, readonly InstallationMethod[]>;

export type PlayerOwner = 'html' | 'react';
export type PresetFlag = (typeof INSTALLATION_PRESETS)[UseCase]['flag'];
export type SkinFlag = (typeof INSTALLATION_SKIN_FLAGS)[number];

export interface InstallationSelection {
  owner: PlayerOwner;
  method: InstallationMethod;
  framework: InstallationFramework;
  project: InstallationProject;
  sourceFramework: RegistryFramework;
  useCase: UseCase;
  preset: PresetFlag;
  skin: Skin;
  skinFlag: SkinFlag;
  media: Renderer;
  extensions: readonly InstallationExtension[];
  sourceUrl: string;
  packageManager: PackageManager;
  template: InstallationTemplate;
  styling: RegistryStyling | null;
  cdnBase: string;
  defaulted: readonly InstallationInputKey[];
  /** Where a detected default came from, keyed by the defaulted option. */
  defaultSources: Readonly<Partial<Record<InstallationInputKey, string>>>;
}

export type SelectionErrorField = InstallationInputKey | 'arguments';

export interface SelectionError {
  field: SelectionErrorField;
  message: string;
  /** The rejected input. Renderers must escape it; it is never part of `message`. */
  value?: string;
  /** A CLI-oriented suggestion, such as the preset a media source needs. */
  hint?: string;
}

export type SelectionResult =
  | { ok: true; selection: InstallationSelection }
  | { ok: false; errors: readonly SelectionError[] };

function includes<const Values extends readonly string[]>(values: Values, value: string): value is Values[number] {
  return values.includes(value);
}

function resolveChoice<const Values extends readonly string[]>(
  field: InstallationInputKey,
  requested: string,
  values: Values,
  fallback: Values[number],
  errors: SelectionError[]
): Values[number] {
  if (includes(values, requested)) return requested;

  errors.push({ field, value: requested, message: `Expected one of: ${values.join(', ')}` });

  return fallback;
}

export function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);

    return (
      codePoint !== undefined &&
      (codePoint <= 0x1f || codePoint === 0x7f || codePoint === 0x85 || codePoint === 0x2028 || codePoint === 0x2029)
    );
  });
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '';
  } catch {
    return false;
  }
}

export function useCaseFromPreset(preset: string): UseCase | undefined {
  return USE_CASES.find((useCase) => INSTALLATION_PRESETS[useCase].flag === preset);
}

export function installationMethodsForFramework(framework: InstallationFramework): readonly InstallationMethod[] {
  return INSTALLATION_METHODS_BY_FRAMEWORK[framework];
}

/** App setups supported by one installation path. Shadcn needs a concrete app layout for aliases and generated files. */
export function installationTemplatesForMethod(
  framework: InstallationFramework,
  method: InstallationMethod
): readonly InstallationTemplate[] {
  const templates = installationTemplates(framework);

  if (method === 'shadcn') return templates.filter((template) => template !== 'none');

  if (method === 'cdn') return framework === 'html' ? (['vite', 'none'] as const) : [];

  return templates;
}

export function resolveInstallationTemplateForMethod(
  framework: InstallationFramework,
  template: InstallationTemplate | null,
  method: InstallationMethod
): InstallationTemplate {
  const templates = installationTemplatesForMethod(framework, method);
  const fallback = method === 'cdn' ? 'none' : defaultInstallationTemplate(framework);

  return template && includes(templates, template) ? template : fallback;
}

export function isInstallationFramework(value: string | null | undefined): value is InstallationFramework {
  return value != null && includes(INSTALLATION_FRAMEWORKS, value);
}

export function isInstallationProject(value: string | null | undefined): value is InstallationProject {
  return value != null && includes(INSTALLATION_PROJECTS, value);
}

export function isPackageManager(value: string): value is PackageManager {
  return includes(PACKAGE_MANAGERS, value);
}

export function isSkinFlag(value: string): value is SkinFlag {
  return includes(INSTALLATION_SKIN_FLAGS, value);
}

export function skinFromFlag(flag: SkinFlag, useCase: UseCase): Skin {
  if (flag === 'none') return 'none';

  const suffix = getInstallationPreset(useCase).mediaType;

  return flag === 'neutral' ? `neutral-${suffix}` : suffix;
}

export function skinToFlag(skin: Skin): SkinFlag {
  if (skin === 'none') return 'none';

  return skin.startsWith('neutral-') ? 'neutral' : 'default';
}

/** Keep a skin tier and media choice valid when the selected preset changes. */
export function fitSelectionToPreset(useCase: UseCase, skin: Skin, media: Renderer) {
  const renderers = getInstallationPreset(useCase).renderers;

  return {
    skin: skinFromFlag(skinToFlag(skin), useCase),
    media: renderers.includes(media) ? media : renderers[0]!,
  };
}

export function sourceFrameworkFor(framework: InstallationFramework): RegistryFramework {
  return framework === 'react' ? 'react' : 'html';
}

/** The player package a framework installs: React uses `@videojs/react`; HTML, Vue, and Svelte use `@videojs/html`. */
export function playerOwnerFor(framework: InstallationFramework): PlayerOwner {
  return framework === 'react' ? 'react' : 'html';
}

/** A value detected from the project, with where it was found for the defaulted-options summary. */
export interface DetectedInstallationDefault<Value extends string | null> {
  value: Value;
  source: string;
}

export interface InstallationSelectionDefaults {
  /** Installation method used when the input omits one and the selected framework supports it. */
  method?: DetectedInstallationDefault<InstallationMethod>;
  /**
   * App setup used when the input omits one and it fits the selected framework and method. A `null` value records that
   * detection found nothing, so the fallback can say so.
   */
  template?: DetectedInstallationDefault<InstallationTemplate | null>;
  /** Package manager used when the input omits one. */
  packageManager?: DetectedInstallationDefault<PackageManager>;
  /** Project framework used when the input omits one. */
  framework?: DetectedInstallationDefault<InstallationFramework>;
}

/** Presets whose media list includes a renderer, for hints that point at the preset a source needs. */
function presetsFor(renderer: Renderer): PresetFlag[] {
  return USE_CASES.filter((useCase) => getInstallationPreset(useCase).renderers.includes(renderer)).map(
    (useCase) => INSTALLATION_PRESETS[useCase].flag
  );
}

function presetHint(renderer: Renderer, syntax: InstallationOptionSyntax): string | undefined {
  const presets = presetsFor(renderer);
  if (presets.length === 0) return undefined;

  return `Use ${presets.map((preset) => syntax.options(['preset', preset])).join(' or ')} for ${renderer}.`;
}

function unsupportedMethodError(method: InstallationMethod, syntax: InstallationOptionSyntax): SelectionError {
  return method === 'cdn'
    ? {
        field: 'method',
        value: method,
        message: 'CDN installation is available for plain HTML only.',
        hint: `Use ${syntax.options(['method', 'packaged'])}, or ${syntax.options(['framework', 'html'])} for a plain HTML page.`,
      }
    : {
        field: 'method',
        value: method,
        message:
          'Shadcn installation is available for React and plain HTML. Use packaged installation for Vue or Svelte.',
      };
}

/**
 * Resolve one requested installation. Errors report root causes first: when a choice is invalid, checks that only
 * compare other options against its fallback value are skipped instead of reported as a cascade. Messages name options
 * in `syntax`, as CLI flags by default or as query parameters for a Markdown guide URL.
 */
export function resolveInstallationSelection(
  input: InstallationInput,
  packageVersion = 'latest',
  defaults: InstallationSelectionDefaults = {},
  syntax: InstallationOptionSyntax = CLI_OPTION_SYNTAX
): SelectionResult {
  const errors: SelectionError[] = [];
  const derivedErrors: SelectionError[] = [];
  const defaulted: InstallationInputKey[] = [];
  const defaultSources: Partial<Record<InstallationInputKey, string>> = {};
  const defaultValue = <Key extends InstallationInputKey>(key: Key, value: NonNullable<InstallationInput[Key]>) => {
    if (input[key] === undefined) defaulted.push(key);

    return input[key] ?? value;
  };

  // A detected method only applies when the framework it will be paired with supports it.
  const requestedFramework = input.framework ?? defaults.framework?.value ?? 'html';
  const detectedMethod =
    defaults.method &&
    includes(INSTALLATION_FRAMEWORKS, requestedFramework) &&
    installationMethodsForFramework(requestedFramework).includes(defaults.method.value)
      ? defaults.method
      : undefined;
  const methodValue = defaultValue('method', detectedMethod?.value ?? 'packaged');
  const methodValid = includes(INSTALLATION_METHODS, methodValue);
  const method = resolveChoice('method', methodValue, INSTALLATION_METHODS, 'packaged', errors);

  if (input.method === undefined && detectedMethod) defaultSources.method = detectedMethod.source;

  const frameworkValue = defaultValue('framework', defaults.framework?.value ?? 'html');
  const frameworkValid = includes(INSTALLATION_FRAMEWORKS, frameworkValue);
  const framework = resolveChoice('framework', frameworkValue, INSTALLATION_FRAMEWORKS, 'html', errors);

  if (input.framework === undefined && defaults.framework) defaultSources.framework = defaults.framework.source;

  const methodSupported = methodValid && frameworkValid && installationMethodsForFramework(framework).includes(method);

  if (methodValid && frameworkValid && !methodSupported) errors.push(unsupportedMethodError(method, syntax));

  // CDN only scaffolds Vite for a new app, so asking for Vite there implies one.
  const projectValue = defaultValue('project', method === 'cdn' && input.template === 'vite' ? 'new' : 'existing');
  const projectValid = includes(INSTALLATION_PROJECTS, projectValue);
  const project = resolveChoice('project', projectValue, INSTALLATION_PROJECTS, 'existing', errors);

  const presetValue = defaultValue('preset', 'video');
  const presetFlags = Object.values(INSTALLATION_PRESETS).map(({ flag }) => flag);
  const presetValid = includes(presetFlags, presetValue);
  const preset = resolveChoice('preset', presetValue, presetFlags, 'video', errors);
  const useCase = useCaseFromPreset(preset) ?? 'default-video';

  const skinValue = useCase === 'background-video' ? 'default' : defaultValue('skin', 'default');
  const skinValid = includes(INSTALLATION_SKIN_FLAGS, skinValue);
  const skinFlag = resolveChoice('skin', skinValue, INSTALLATION_SKIN_FLAGS, 'default', errors);

  if (useCase === 'background-video' && input.skin !== undefined) {
    errors.push({
      field: 'skin',
      value: input.skin,
      message: 'does not apply to the background-video preset, which has one purpose-built skin.',
    });
  }

  const skin = skinFromFlag(skinFlag, useCase);

  const requestedSourceUrl = input.sourceUrl?.trim() ?? '';
  // An explicit `demo` resolves like an omitted URL, but it is a choice rather than a default.
  const sourceUrl = requestedSourceUrl === INSTALLATION_DEMO_SOURCE_URL ? '' : requestedSourceUrl;
  const sourceUrlError = !sourceUrl
    ? null
    : containsControlCharacter(sourceUrl)
      ? 'Must not contain control characters or line breaks.'
      : isHttpUrl(sourceUrl)
        ? null
        : `Expected an http:// or https:// media URL, or \`${INSTALLATION_DEMO_SOURCE_URL}\` for the Video.js demo source.`;
  const validSourceUrl = sourceUrl !== '' && !sourceUrlError;

  if (!requestedSourceUrl) defaulted.push('sourceUrl');

  if (sourceUrlError) errors.push({ field: 'sourceUrl', value: sourceUrl, message: sourceUrlError });

  const availableMedia = getInstallationPreset(useCase).renderers;
  const sourceCandidates = validSourceUrl ? resolveRendererCandidates(sourceUrl) : [];
  const compatibleSourceCandidates = sourceCandidates.filter((candidate) => availableMedia.includes(candidate));
  const sourceMedia = validSourceUrl ? resolveRenderer(sourceUrl, useCase) : null;
  const mediaValue = defaultValue('media', sourceMedia ?? availableMedia[0]!);
  const mediaValid = includes(RENDERERS, mediaValue);
  const media = resolveChoice('media', mediaValue, RENDERERS, availableMedia[0]!, errors);
  const mediaAvailable = presetValid && mediaValid && availableMedia.includes(media);

  if (presetValid && mediaValid && !mediaAvailable) {
    const hint = presetHint(media, syntax);

    errors.push({
      field: 'media',
      value: media,
      message: `Not available for the ${preset} preset. Expected one of: ${availableMedia.join(', ')}`,
      ...(hint ? { hint } : {}),
    });
  }

  if (presetValid && validSourceUrl && sourceCandidates.length > 0 && (mediaAvailable || !mediaValid)) {
    if (!sourceMedia) {
      const candidate = sourceCandidates[0]!;
      const hint = presetHint(candidate, syntax);

      errors.push({
        field: 'sourceUrl',
        value: sourceUrl,
        message: `Does not match a media source available for the ${preset} preset.`,
        ...(hint ? { hint: `The URL matches ${candidate}. ${hint}` } : {}),
      });
    } else if (input.media !== undefined && mediaAvailable && !compatibleSourceCandidates.includes(media)) {
      errors.push({
        field: 'media',
        value: media,
        message: `Does not match the supplied source URL. Expected one of: ${compatibleSourceCandidates.join(', ')}`,
      });
    }
  }

  const availableExtensions = installationExtensionsFor(useCase, skin, media);
  const extensionValues =
    input.extensions === undefined
      ? defaultInstallationExtensions(media)
      : [...new Set(parseInstallationExtensions(input.extensions))];
  // Extension compatibility depends on the preset, skin, and media, so it is only checked once they are valid.
  const extensionErrors = mediaAvailable && skinValid ? errors : derivedErrors;

  if (input.extensions === undefined) defaulted.push('extensions');

  const requestedExtensions = new Set<InstallationExtension>();

  for (const extension of extensionValues) {
    if (!isInstallationExtension(extension)) {
      errors.push({
        field: 'extensions',
        value: extension,
        message: 'Expected a comma-separated list containing google-cast, mux-data, or none.',
      });
    } else if (!availableExtensions.includes(extension)) {
      extensionErrors.push({
        field: 'extensions',
        value: extension,
        message: `${extension} does not apply to the selected preset, skin, and media source.`,
        hint: `Use ${syntax.options(['extensions', serializeInstallationExtensions(availableExtensions)])}.`,
      });
    } else {
      requestedExtensions.add(extension);
    }
  }

  const extensions = INSTALLATION_EXTENSIONS.filter((extension) => requestedExtensions.has(extension));

  const sourceFramework = sourceFrameworkFor(framework);
  // App setups depend on a supported method and framework, which are reported above when they are not.
  const templateErrors = methodSupported ? errors : derivedErrors;
  const availableTemplates = installationTemplatesForMethod(framework, method);
  const detectedTemplate = defaults.template?.value;
  const detectedTemplateFits =
    detectedTemplate != null &&
    includes(availableTemplates, detectedTemplate) &&
    !(method === 'cdn' && project === 'existing' && detectedTemplate !== 'none');
  const fallbackTemplate = method === 'cdn' && project === 'existing' ? 'none' : defaultInstallationTemplate(framework);
  const defaultTemplate = detectedTemplateFits ? detectedTemplate : fallbackTemplate;
  const templateValue = defaultValue('template', defaultTemplate);

  if (input.template === undefined && defaults.template) {
    defaultSources.template = detectedTemplateFits
      ? defaults.template.source
      : 'the default; no matching app setup was detected';
  }

  const templateValid = includes(availableTemplates, templateValue);
  const template = resolveChoice('template', templateValue, availableTemplates, defaultTemplate, templateErrors);

  if (
    methodSupported &&
    projectValid &&
    templateValid &&
    method === 'cdn' &&
    template === 'vite' &&
    project === 'existing'
  ) {
    templateErrors.push({
      field: 'template',
      value: template,
      message: `CDN scripts go on an existing page with ${syntax.options(['template', 'none'])}, or into a new Vite app with ${syntax.options(['project', 'new'])}.`,
      hint: `For an existing Vite app, use ${syntax.options(['method', 'packaged'])}.`,
    });
  }

  if (methodSupported && projectValid && templateValid && template === 'none' && project === 'new') {
    errors.push({
      field: 'project',
      value: project,
      message: `A new project needs a named app setup. Choose a template, or use ${syntax.options(['project', 'existing'], ['template', 'none'])}.`,
    });
  }

  const defaultPackageManager = defaults.packageManager?.value ?? 'pnpm';
  const packageManagerValue =
    method === 'cdn' && template === 'none'
      ? (input.packageManager ?? defaultPackageManager)
      : defaultValue('packageManager', defaultPackageManager);
  const packageManager = resolveChoice('packageManager', packageManagerValue, PACKAGE_MANAGERS, 'pnpm', errors);

  if (defaulted.includes('packageManager') && defaults.packageManager) {
    defaultSources.packageManager = defaults.packageManager.source;
  }

  let styling: RegistryStyling | null = null;

  if (methodSupported && method === 'cdn' && mediaValid && !rendererSupportsCdn(media, CDN_MEDIA_SUBPATHS)) {
    errors.push({
      field: 'media',
      value: media,
      message: `${media} is not published by @videojs/cdn.`,
      hint: `Use ${syntax.options(['method', 'packaged'])} for ${media}.`,
    });
  }

  if (method === 'shadcn') {
    if (presetValid && useCase === 'background-video') {
      errors.push({
        field: 'preset',
        value: preset,
        message: 'Background Video is not available from the Shadcn registry.',
        hint: `Use ${syntax.options(['method', 'packaged'])} for background video.`,
      });
    }

    if (skinValid && skinFlag === 'none') {
      errors.push({
        field: 'skin',
        value: skinFlag,
        message: 'Shadcn installs editable skin source, so the `none` skin is not available.',
        hint: `Use ${syntax.options(['skin', 'default'])} or ${syntax.options(['skin', 'neutral'])}, or ${syntax.options(['method', 'packaged'])} for a skinless player.`,
      });
    }

    const stylingValue = defaultValue('styling', defaultRegistryStyling(sourceFramework));
    const stylings = registryStylings(sourceFramework);

    styling = resolveChoice(
      'styling',
      stylingValue,
      stylings,
      defaultRegistryStyling(sourceFramework),
      methodSupported ? errors : derivedErrors
    );
  } else if (methodValid && input.styling !== undefined) {
    errors.push({ field: 'styling', value: input.styling, message: 'only applies to Shadcn installation.' });
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    selection: {
      owner: playerOwnerFor(framework),
      method,
      framework,
      project,
      sourceFramework,
      useCase,
      preset,
      skin,
      skinFlag,
      media,
      extensions,
      sourceUrl,
      packageManager,
      template,
      styling,
      cdnBase: cdnBaseForVersion(packageVersion),
      defaulted,
      defaultSources,
    },
  };
}

export function selectionToInput(selection: InstallationSelection): Required<InstallationInput> {
  return {
    method: selection.method,
    framework: selection.framework,
    project: selection.project,
    preset: selection.preset,
    skin: selection.skinFlag,
    media: selection.media,
    extensions: serializeInstallationExtensions(selection.extensions),
    sourceUrl: selection.sourceUrl,
    packageManager: selection.packageManager,
    template: selection.template,
    styling: selection.styling ?? '',
  };
}
