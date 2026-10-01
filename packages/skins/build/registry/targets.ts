import corePackage from '../../../core/package.json' with { type: 'json' };
import htmlPackage from '../../../html/package.json' with { type: 'json' };
import reactPackage from '../../../react/package.json' with { type: 'json' };
import type { SkinStyle } from '../../src/meta.ts';

export type RegistryTarget =
  | {
      readonly framework: 'react';
      readonly styling: 'css' | 'tailwind';
      readonly theme: SkinStyle['theme'];
      readonly output: string;
    }
  | {
      readonly framework: 'html';
      readonly styling: 'css';
      readonly theme: SkinStyle['theme'];
      readonly output: string;
    };

export const registryPaths = {
  install: '@components/videojs',
  import: '@/components/videojs',
} as const;

export const registryTargets = [
  { framework: 'react', styling: 'tailwind', theme: 'default', output: 'r/react' },
  { framework: 'react', styling: 'tailwind', theme: 'neutral', output: 'r/react/neutral' },
  { framework: 'react', styling: 'css', theme: 'default', output: 'r/react/css' },
  { framework: 'react', styling: 'css', theme: 'neutral', output: 'r/react/css/neutral' },
  { framework: 'html', styling: 'css', theme: 'default', output: 'r/html' },
  { framework: 'html', styling: 'css', theme: 'neutral', output: 'r/html/neutral' },
  { framework: 'react', styling: 'tailwind', theme: 'compat', output: 'r/react/compat' },
  { framework: 'react', styling: 'css', theme: 'compat', output: 'r/react/css/compat' },
  { framework: 'html', styling: 'css', theme: 'compat', output: 'r/html/compat' },
] as const satisfies readonly RegistryTarget[];

export const packageRequirements = {
  core: `${corePackage.name}@${corePackage.version}`,
  html: `${htmlPackage.name}@${htmlPackage.version}`,
  react: `${reactPackage.name}@${reactPackage.version}`,
} as const;

export const registryPackages = {
  [corePackage.name]: packageRequirements.core,
  [htmlPackage.name]: packageRequirements.html,
  [reactPackage.name]: packageRequirements.react,
};
