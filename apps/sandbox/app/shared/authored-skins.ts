import type { Skin, Styling } from '@app/types';

import type { SkinPreset } from './html/skin-tags';

type AuthoredKey = `${'react' | 'html'}/${SkinPreset}/${Skin}/${Styling}`;

/**
 * The authored skins, compiled on request by the skins' Vite preset. Each query names the styling, render target,
 * theme, and skin. Only the workspace has these files; the loaders are reached through a dynamic import that nothing
 * outside it ever follows.
 */
const authoredSkins = {
  'react/video/default/css': () =>
    import('../../../../packages/skins/src/skins/default/video/skin.tsx?style=css&target=react&skin=default-video&theme=default'),
  'react/video/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/video/skin.tsx?style=tailwind&target=react&skin=default-video&theme=default'),
  'react/video/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/video/skin.tsx?style=css&target=react&skin=neutral-video&theme=neutral'),
  'react/video/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/video/skin.tsx?style=tailwind&target=react&skin=neutral-video&theme=neutral'),
  'react/live-video/default/css': () =>
    import('../../../../packages/skins/src/skins/default/live-video/skin.tsx?style=css&target=react&skin=default-live-video&theme=default'),
  'react/live-video/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/live-video/skin.tsx?style=tailwind&target=react&skin=default-live-video&theme=default'),
  'react/live-video/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/live-video/skin.tsx?style=css&target=react&skin=neutral-live-video&theme=neutral'),
  'react/live-video/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/live-video/skin.tsx?style=tailwind&target=react&skin=neutral-live-video&theme=neutral'),
  'react/audio/default/css': () =>
    import('../../../../packages/skins/src/skins/default/audio/skin.tsx?style=css&target=react&skin=default-audio&theme=default'),
  'react/audio/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/audio/skin.tsx?style=tailwind&target=react&skin=default-audio&theme=default'),
  'react/audio/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/audio/skin.tsx?style=css&target=react&skin=neutral-audio&theme=neutral'),
  'react/audio/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/audio/skin.tsx?style=tailwind&target=react&skin=neutral-audio&theme=neutral'),
  'react/live-audio/default/css': () =>
    import('../../../../packages/skins/src/skins/default/live-audio/skin.tsx?style=css&target=react&skin=default-live-audio&theme=default'),
  'react/live-audio/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/live-audio/skin.tsx?style=tailwind&target=react&skin=default-live-audio&theme=default'),
  'react/live-audio/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/live-audio/skin.tsx?style=css&target=react&skin=neutral-live-audio&theme=neutral'),
  'react/live-audio/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/live-audio/skin.tsx?style=tailwind&target=react&skin=neutral-live-audio&theme=neutral'),
  'html/video/default/css': () =>
    import('../../../../packages/skins/src/skins/default/video/skin.tsx?style=css&target=html&skin=default-video&theme=default'),
  'html/video/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/video/skin.tsx?style=tailwind&target=html&skin=default-video&theme=default'),
  'html/video/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/video/skin.tsx?style=css&target=html&skin=neutral-video&theme=neutral'),
  'html/video/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/video/skin.tsx?style=tailwind&target=html&skin=neutral-video&theme=neutral'),
  'html/live-video/default/css': () =>
    import('../../../../packages/skins/src/skins/default/live-video/skin.tsx?style=css&target=html&skin=default-live-video&theme=default'),
  'html/live-video/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/live-video/skin.tsx?style=tailwind&target=html&skin=default-live-video&theme=default'),
  'html/live-video/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/live-video/skin.tsx?style=css&target=html&skin=neutral-live-video&theme=neutral'),
  'html/live-video/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/live-video/skin.tsx?style=tailwind&target=html&skin=neutral-live-video&theme=neutral'),
  'html/audio/default/css': () =>
    import('../../../../packages/skins/src/skins/default/audio/skin.tsx?style=css&target=html&skin=default-audio&theme=default'),
  'html/audio/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/audio/skin.tsx?style=tailwind&target=html&skin=default-audio&theme=default'),
  'html/audio/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/audio/skin.tsx?style=css&target=html&skin=neutral-audio&theme=neutral'),
  'html/audio/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/audio/skin.tsx?style=tailwind&target=html&skin=neutral-audio&theme=neutral'),
  'html/live-audio/default/css': () =>
    import('../../../../packages/skins/src/skins/default/live-audio/skin.tsx?style=css&target=html&skin=default-live-audio&theme=default'),
  'html/live-audio/default/tailwind': () =>
    import('../../../../packages/skins/src/skins/default/live-audio/skin.tsx?style=tailwind&target=html&skin=default-live-audio&theme=default'),
  'html/live-audio/neutral/css': () =>
    import('../../../../packages/skins/src/skins/neutral/live-audio/skin.tsx?style=css&target=html&skin=neutral-live-audio&theme=neutral'),
  'html/live-audio/neutral/tailwind': () =>
    import('../../../../packages/skins/src/skins/neutral/live-audio/skin.tsx?style=tailwind&target=html&skin=neutral-live-audio&theme=neutral'),
} satisfies Record<AuthoredKey, () => Promise<object>>;

/** Theme catalogs share one export name per preset, such as `LiveVideoSkin`; both render targets use that name. */
export function authoredExportName(preset: SkinPreset): string {
  const words = preset.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return `${words.join('')}Skin`;
}

/**
 * Tailwind for authored skins: the skins' own entry plus the utilities the compiler recorded. Loaded once, and only for
 * a Tailwind skin, so pages that never show one never pull a second Tailwind root.
 */
let tailwind: Promise<unknown> | undefined;

function loadAuthoredTailwind(): Promise<unknown> {
  tailwind ??= import('../styles.authored.css');

  return tailwind;
}

export async function loadAuthoredSkinModule(
  target: 'react' | 'html',
  preset: SkinPreset,
  skin: Skin,
  styling: Styling
): Promise<object> {
  const [module] = await Promise.all([
    authoredSkins[`${target}/${preset}/${skin}/${styling}`](),
    styling === 'tailwind' ? loadAuthoredTailwind() : undefined,
  ]);

  return module;
}
