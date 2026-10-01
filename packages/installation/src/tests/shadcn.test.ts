import { describe, expect, it } from 'vite-plus/test';

import {
  defaultRegistryStyling,
  REGISTRY_PRESETS,
  REGISTRY_SKINS,
  installationTemplatesForMethod,
  registryNamespaceUrl,
  registrySkinSelection,
  registryStylings,
  resolveRegistryStyling,
  shadcnAddCommand,
  shadcnCommand,
  shadcnComponentsConfig,
  shadcnInitCommand,
  shadcnProjectConfiguration,
  shadcnProjectSetup,
  shadcnRegistryAddCommand,
} from '../index';

describe('registryNamespaceUrl', () => {
  it('selects the catalog through the URL, not the item name', () => {
    expect(registryNamespaceUrl('react', 'tailwind')).toBe('https://shadcn.videojs.org/r/react/{name}.json');
    expect(registryNamespaceUrl('react', 'css')).toBe('https://shadcn.videojs.org/r/react/css/{name}.json');
    expect(registryNamespaceUrl('html', 'css')).toBe('https://shadcn.videojs.org/r/html/{name}.json');
    expect(registryNamespaceUrl('react', 'tailwind', 'neutral')).toBe(
      'https://shadcn.videojs.org/r/react/neutral/{name}.json'
    );
    expect(registryNamespaceUrl('react', 'css', 'neutral')).toBe(
      'https://shadcn.videojs.org/r/react/css/neutral/{name}.json'
    );
    expect(registryNamespaceUrl('html', 'css', 'neutral')).toBe(
      'https://shadcn.videojs.org/r/html/neutral/{name}.json'
    );
  });
});

describe('registryStylings', () => {
  it('defaults React to Tailwind and HTML to CSS', () => {
    expect(registryStylings('react')).toEqual(['tailwind', 'css']);
    expect(registryStylings('html')).toEqual(['css']);
    expect(defaultRegistryStyling('react')).toBe('tailwind');
    expect(defaultRegistryStyling('html')).toBe('css');
  });

  it('falls back when a choice does not exist for the framework', () => {
    expect(resolveRegistryStyling('html', 'tailwind')).toBe('css');
    expect(resolveRegistryStyling('react', 'css')).toBe('css');
    expect(resolveRegistryStyling('react', null)).toBe('tailwind');
  });
});

describe('shadcnAddCommand', () => {
  it('namespaces every item and follows the package manager', () => {
    expect(shadcnAddCommand('npm', ['video'])).toBe('npx shadcn@latest add @videojs/video --overwrite --yes');
    expect(shadcnAddCommand('pnpm', ['video', 'play-button'])).toBe(
      'pnpm dlx shadcn@latest add @videojs/video @videojs/play-button --overwrite --yes'
    );
    expect(shadcnCommand('bun', 'init')).toBe('bunx --bun shadcn@latest init');
  });
});

describe('shadcnRegistryAddCommand', () => {
  it('sets the selected catalog through the Shadcn CLI', () => {
    expect(shadcnRegistryAddCommand('pnpm', 'react', 'css', 'neutral')).toBe(
      'pnpm dlx shadcn@latest registry add @videojs=https://shadcn.videojs.org/r/react/css/neutral/{name}.json'
    );
    expect(shadcnRegistryAddCommand('npm', 'html', 'css')).toBe(
      'npx shadcn@latest registry add @videojs=https://shadcn.videojs.org/r/html/{name}.json'
    );
  });
});

describe('shadcnInitCommand', () => {
  it('keeps the no-scaffold setup out of Shadcn', () => {
    expect(installationTemplatesForMethod('html', 'packaged')).toContain('none');
    expect(installationTemplatesForMethod('html', 'cdn')).toEqual(['vite', 'none']);
    expect(installationTemplatesForMethod('html', 'shadcn')).toEqual(['vite', 'astro', 'laravel']);
  });

  it('sets the selected project template', () => {
    expect(shadcnInitCommand('pnpm', 'start')).toBe(
      'pnpm dlx shadcn@latest init --template start --no-monorepo --base base --preset nova --name videojs-app --yes\ncd videojs-app'
    );
    expect(shadcnInitCommand('npm', 'vite')).toBe(
      'npx shadcn@latest init --template vite --no-monorepo --base base --preset nova --name videojs-app --yes\ncd videojs-app'
    );
    expect(shadcnInitCommand('npm')).toBe('npx shadcn@latest init --base base --preset nova --yes');
    expect(shadcnInitCommand('yarn', 'vite')).toContain('npm_config_user_agent="yarn/1.22.22"');
  });
});

describe('shadcnComponentsConfig', () => {
  it('preserves React server components for Next.js', () => {
    expect(JSON.parse(shadcnComponentsConfig('react', 'next', '@/components')).rsc).toBe(true);
    expect(JSON.parse(shadcnComponentsConfig('react', 'vite', '@/components')).rsc).toBe(false);
  });

  it('keeps Shadcn from rewriting string literals in copied source', () => {
    expect(JSON.parse(shadcnComponentsConfig('react', 'vite', '@/components')).tailwind.cssVariables).toBe(true);
  });
});

describe('shadcnProjectConfiguration', () => {
  it('uses Shadcn initialization only for React with Tailwind', () => {
    expect(shadcnProjectConfiguration('react', 'vite', 'tailwind', '@/components')).toMatchObject({
      mode: 'shadcn-init',
      aliasSetup: expect.arrayContaining([
        expect.objectContaining({ filename: 'tsconfig.json' }),
        expect.objectContaining({ filename: 'tsconfig.app.json' }),
        expect.objectContaining({ filename: 'vite.config.ts' }),
      ]),
      componentsConfig: null,
    });
    expect(shadcnProjectConfiguration('html', 'vite', 'css', '@/components')).toMatchObject({
      mode: 'components-json',
      componentsConfig: expect.stringContaining('"tsx": true'),
    });
  });

  it('creates the app, configures the project first, or only initializes Shadcn', () => {
    const nextTailwind = shadcnProjectConfiguration('react', 'next', 'tailwind', '@/components');
    const viteTailwind = shadcnProjectConfiguration('react', 'vite', 'tailwind', '@/components');
    const nextCss = shadcnProjectConfiguration('react', 'next', 'css', '@/components');

    expect(shadcnProjectSetup(nextTailwind, 'new')).toBe('create-app');
    expect(shadcnProjectSetup(nextTailwind, 'existing')).toBe('init');
    expect(shadcnProjectSetup(viteTailwind, 'existing')).toBe('configure');
    expect(shadcnProjectSetup(nextCss, 'new')).toBe('configure');
  });
});

describe('registrySkinSelection', () => {
  it('maps the installation selection onto a theme catalog and stable item name', () => {
    expect(registrySkinSelection({ useCase: 'default-video', skin: 'video' })).toEqual({
      item: 'video',
      theme: 'default',
    });
    expect(registrySkinSelection({ useCase: 'default-video', skin: 'neutral-video' })).toEqual({
      item: 'video',
      theme: 'neutral',
    });
    expect(registrySkinSelection({ useCase: 'live-audio', skin: 'neutral-audio' })).toEqual({
      item: 'live-audio',
      theme: 'neutral',
    });
  });

  it('leaves package-only selections alone', () => {
    expect(registrySkinSelection({ useCase: 'background-video', skin: 'video' })).toBeNull();
    expect(registrySkinSelection({ useCase: 'default-video', skin: 'none' })).toBeNull();
  });
});

describe('REGISTRY_SKINS', () => {
  it('names every published skin', () => {
    expect(REGISTRY_PRESETS.map((skin) => skin.item)).toEqual(['video', 'audio', 'live-video', 'live-audio']);
    expect(REGISTRY_SKINS.map((skin) => skin.item)).toEqual([
      'video',
      'video',
      'audio',
      'audio',
      'live-video',
      'live-video',
      'live-audio',
      'live-audio',
    ]);
    expect(REGISTRY_SKINS.find((skin) => skin.item === 'video' && skin.theme === 'neutral')?.directory).toBe(
      'components/videojs/video'
    );
  });
});
