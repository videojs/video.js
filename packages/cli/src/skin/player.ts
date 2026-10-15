import { INSTALLATION_DEMO_SOURCES, type RegistryPreset } from '@videojs/installation';

type MediaKind = 'video' | 'audio';

export interface PresetModule {
  kind: MediaKind;
  live: boolean;
  /** Skin component (React) and the folder its source lives in. */
  skinComponent: string;
  /** HTML player element registered by `@videojs/html/<preset>/player`. */
  playerTag: string;
  /** React player component exported by `@videojs/react/<preset>`. */
  playerComponent: string;
}

function pascal(value: string): string {
  return value
    .split('-')
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join('');
}

export function presetModule(preset: RegistryPreset): PresetModule {
  return {
    kind: preset.endsWith('audio') ? 'audio' : 'video',
    live: preset.startsWith('live-'),
    skinComponent: `${pascal(preset)}Skin`,
    playerTag: `${preset}-player`,
    playerComponent: `${pascal(preset)}Player`,
  };
}

/** NASA's Cosmic Dawn trailer on Mux, which has chapters for the time slider and a storyboard for its previews. */
const COSMIC_DAWN = {
  src: 'https://stream.mux.com/83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s.m3u8',
  poster: 'https://image.mux.com/83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s/thumbnail.webp?time=69',
};

/** What the preview plays, written into the player file so the skin's author can change it there. */
function previewMedia(preset: RegistryPreset) {
  const { kind, live } = presetModule(preset);

  return {
    // Cosmic Dawn is on demand, so live presets play a Mux live stream instead.
    src: live ? INSTALLATION_DEMO_SOURCES.live : COSMIC_DAWN.src,
    poster: kind === 'video' && !live ? COSMIC_DAWN.poster : undefined,
    chapters: live ? undefined : './cosmic-dawn-chapters.vtt',
  };
}

function mediaConstants(preset: RegistryPreset): string {
  const media = previewMedia(preset);
  const lines = [
    '// What the preview plays. Change these to try the skin with your own media; any Mux or HLS URL works.',
    `const SRC = '${media.src}';`,
  ];

  if (media.poster) lines.push(`const POSTER = '${media.poster}';`);

  if (media.chapters)
    lines.push(
      `/** Chapters for the time slider, served from \`apps/preview/public\`. */`,
      `const CHAPTERS = '${media.chapters}';`
    );

  return lines.join('\n');
}

/** `apps/preview/src/player.tsx`: the skin in the preset's player, playing Mux media. */
export function reactPlayer(preset: RegistryPreset): string {
  const { kind, skinComponent, playerComponent } = presetModule(preset);
  const media = previewMedia(preset);
  const Media = kind === 'video' ? 'MuxVideo' : 'MuxAudio';
  const playerProps = media.poster ? ' poster={POSTER}' : '';
  const mediaProps = kind === 'video' ? 'src={SRC} playsInline crossOrigin=""' : 'src={SRC} crossOrigin=""';
  const chapters = media.chapters
    ? `\n          <track kind="chapters" label="English" srcLang="en" src={CHAPTERS} default />\n        `
    : '';
  const mediaElement = chapters ? `<${Media} ${mediaProps}>${chapters}</${Media}>` : `<${Media} ${mediaProps} />`;

  return `import { ${Media} } from '@videojs/react/media/mux-${kind}';
import { ${playerComponent} } from '@videojs/react/${preset}';

import { ${skinComponent} } from '@/${preset}/skin';

${mediaConstants(preset)}

export function Player() {
  return (
    <${playerComponent}${playerProps}>
      <${skinComponent}>
        ${mediaElement}
      </${skinComponent}>
    </${playerComponent}>
  );
}
`;
}

/** `apps/preview/src/player.ts`: the preset's player element around the skin's light-DOM template. */
export function htmlPlayer(preset: RegistryPreset): string {
  const { kind, playerTag } = presetModule(preset);
  const media = previewMedia(preset);
  const posterAttribute = media.poster ? "\n  player.setAttribute('poster', POSTER);" : '';
  const inline = kind === 'video' ? ' playsinline' : '';
  const chapters = media.chapters
    ? '<track kind="chapters" label="English" srclang="en" src="${CHAPTERS}" default>'
    : '';

  return `import '@videojs/html/${preset}/player';
import '@videojs/html/media/mux-${kind}';
import '@/${preset}/skin';
import skinTemplate from '@/${preset}/skin.html?raw';

${mediaConstants(preset)}

const MEDIA_PLACEHOLDER = '<!-- Add a compatible media component here. -->';

export function createPlayer(): HTMLElement {
  const player = document.createElement('${playerTag}');${posterAttribute}

  player.innerHTML = skinTemplate.replace(
    MEDIA_PLACEHOLDER,
    \`<mux-${kind} src="\${SRC}"${inline} crossorigin>${chapters}</mux-${kind}>\`
  );

  return player;
}
`;
}
