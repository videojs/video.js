import type { RegistryStylesOptions } from 'vjsc/shadcn';

import { registryDocsUrl } from '../docs.ts';
import type { VideojsRegistryMeta } from '../meta.ts';
import type { RegistryTarget } from '../targets.ts';

export function registryStyles(target: RegistryTarget): RegistryStylesOptions {
  const meta = {
    role: 'support',
    framework: target.framework,
    styling: target.styling,
    theme: target.theme,
    public: false,
  } satisfies VideojsRegistryMeta;

  const shared = {
    meta,
  } satisfies Pick<NonNullable<RegistryStylesOptions['theme']>, 'meta'>;

  const themes = [
    {
      ...shared,
      name: '_style-neutral',
      target: 'styles/themes/neutral.css',
      files: { './styles/themes/neutral.css': 'styles/themes/neutral.css' },
      title: 'Video.js Neutral theme',
      description: 'Editable token overrides used only by Neutral skins.',
    },
    {
      ...shared,
      name: '_style-video',
      target: 'styles/video/base.css',
      files: {
        './styles/video/base.css': 'styles/video/base.css',
        './styles/video/captions.css': 'styles/video/captions.css',
        './styles/video/theme.css': 'styles/video/theme.css',
      },
      title: 'Video.js video styles',
      description: 'Editable resets and token overrides used only by video skins.',
      registryDependencies: ['@videojs/_style-theme'],
    },
    {
      ...shared,
      name: '_style-video-neutral',
      target: 'styles/video/neutral.css',
      files: { './styles/video/neutral.css': 'styles/video/neutral.css' },
      title: 'Video.js Neutral video styles',
      description: 'Neutral video stylesheet entry.',
      registryDependencies: ['@videojs/_style-neutral', '@videojs/_style-video'],
    },
    {
      ...shared,
      name: '_style-audio',
      target: 'styles/audio/base.css',
      files: {
        './styles/audio/base.css': 'styles/audio/base.css',
        './styles/audio/theme.css': 'styles/audio/theme.css',
      },
      title: 'Video.js audio styles',
      description: 'Editable resets and token overrides used only by audio skins.',
      registryDependencies: ['@videojs/_style-theme'],
    },
    {
      ...shared,
      name: '_style-audio-neutral',
      target: 'styles/audio/neutral.css',
      files: { './styles/audio/neutral.css': 'styles/audio/neutral.css' },
      title: 'Video.js Neutral audio styles',
      description: 'Neutral audio stylesheet entry.',
      registryDependencies: ['@videojs/_style-audio', '@videojs/_style-neutral'],
    },
  ] satisfies NonNullable<RegistryStylesOptions['themes']>;

  return {
    theme: {
      ...shared,
      docs: themeContextDocs(target),
      name: '_style-theme',
      target: 'styles/base.css',
      files: {
        './styles/base.css': 'styles/base.css',
        './styles/themes/preferences.css': 'styles/themes/preferences.css',
        './styles/themes/theme.css': 'styles/themes/theme.css',
      },
      title: 'Video.js media theme',
      description: 'Editable shared media tokens, resets, preferences, and Tailwind compiler integration.',
      tailwind: target.styling === 'tailwind' ? './styles/tailwind.css' : undefined,
    },
    themes: themes.filter(({ name }) => target.theme === 'neutral' || !name.endsWith('-neutral')),
    files: target.framework === 'react' && target.styling === 'css' ? 'styles' : undefined,
  };
}

/** Keep this on the shared theme item so transitive CLI output includes the contract only once. */
function themeContextDocs(target: RegistryTarget): string {
  return `Installed automatically with Video.js skins and UI components. Use UI components inside an installed skin, or set \`data-theme="${target.theme}"\` and \`data-preset\` on a custom \`Container\`. See [Customize skins](${registryDocsUrl(target, 'how-to/customize-skins')}) for theme customization.`;
}
