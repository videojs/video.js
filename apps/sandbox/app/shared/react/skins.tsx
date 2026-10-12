import { PLAYER_FRAME_CLASSES } from '@app/shared/player-frame';
import type { Skin, SkinSource, Styling } from '@app/types';
import type { AudioSkinProps } from '@videojs/react/audio';
import type { VideoSkinProps } from '@videojs/react/video';
import type { ComponentType, RefObject } from 'react';
import { createElement, useEffect, useRef, useState } from 'react';

import { applyCaptionTracks, type CaptionsMode } from '../captions';
import { findMediaElement } from '../media-element';
import { useDirection } from './use-direction';
import { useSandbox } from './use-sandbox';

type SkinPreset = 'video' | 'audio' | 'live-video' | 'live-audio';
type SkinKey = `${SkinPreset}/${Skin}`;
type Loader = () => Promise<object>;

interface SkinRequest {
  readonly preset: SkinPreset;
  readonly skin: Skin;
  readonly styling: Styling;
  readonly source: SkinSource;
}

/** One module per preset in `@videojs/react`, exporting both skins, with a stylesheet per skin beside it. */
const packageSkins: Record<
  SkinPreset,
  { module: Loader; styles: Record<Skin, Loader>; components: Record<Skin, string> }
> = {
  video: {
    module: () => import('@videojs/react/video'),
    styles: {
      default: () => import('@videojs/react/video/skin.css'),
      neutral: () => import('@videojs/react/video/neutral-skin.css'),
      compat: () => import('@videojs/react/video/compat-skin.css'),
      scaffold: () => import('@videojs/react/video/scaffold-skin.css'),
    },
    components: {
      default: 'VideoSkin',
      neutral: 'NeutralVideoSkin',
      scaffold: 'ScaffoldVideoSkin',
      compat: 'CompatVideoSkin',
    },
  },
  'live-video': {
    module: () => import('@videojs/react/live-video'),
    styles: {
      default: () => import('@videojs/react/live-video/skin.css'),
      neutral: () => import('@videojs/react/live-video/neutral-skin.css'),
      compat: () => import('@videojs/react/live-video/compat-skin.css'),
      scaffold: () => import('@videojs/react/live-video/scaffold-skin.css'),
    },
    components: {
      default: 'LiveVideoSkin',
      neutral: 'NeutralLiveVideoSkin',
      compat: 'CompatLiveVideoSkin',
      scaffold: 'ScaffoldLiveVideoSkin',
    },
  },
  audio: {
    module: () => import('@videojs/react/audio'),
    styles: {
      default: () => import('@videojs/react/audio/skin.css'),
      neutral: () => import('@videojs/react/audio/neutral-skin.css'),
      compat: () => import('@videojs/react/audio/compat-skin.css'),
      scaffold: () => import('@videojs/react/audio/scaffold-skin.css'),
    },
    components: {
      default: 'AudioSkin',
      neutral: 'NeutralAudioSkin',
      scaffold: 'ScaffoldAudioSkin',
      compat: 'CompatAudioSkin',
    },
  },
  'live-audio': {
    module: () => import('@videojs/react/live-audio'),
    styles: {
      default: () => import('@videojs/react/live-audio/skin.css'),
      neutral: () => import('@videojs/react/live-audio/neutral-skin.css'),
      compat: () => import('@videojs/react/live-audio/compat-skin.css'),
      scaffold: () => import('@videojs/react/live-audio/scaffold-skin.css'),
    },
    components: {
      default: 'LiveAudioSkin',
      neutral: 'NeutralLiveAudioSkin',
      compat: 'CompatLiveAudioSkin',
      scaffold: 'ScaffoldLiveAudioSkin',
    },
  },
};

/** The Sandbox isolates each pick-one consumer catalog under its own generated alias. */
const registrySkins: Record<Styling, Record<SkinKey, Loader>> = {
  tailwind: {
    'video/default': () => import('@registry-react-tailwind-default/components/videojs/video/skin'),
    'video/neutral': () => import('@registry-react-tailwind-neutral/components/videojs/video/skin'),
    'video/compat': () => import('@registry-react-tailwind-compat/components/videojs/video/skin'),
    'video/scaffold': () => import('@registry-react-tailwind-scaffold/components/videojs/video/skin'),
    'live-video/default': () => import('@registry-react-tailwind-default/components/videojs/live-video/skin'),
    'live-video/neutral': () => import('@registry-react-tailwind-neutral/components/videojs/live-video/skin'),
    'live-video/compat': () => import('@registry-react-tailwind-compat/components/videojs/live-video/skin'),
    'live-video/scaffold': () => import('@registry-react-tailwind-scaffold/components/videojs/live-video/skin'),
    'audio/default': () => import('@registry-react-tailwind-default/components/videojs/audio/skin'),
    'audio/neutral': () => import('@registry-react-tailwind-neutral/components/videojs/audio/skin'),
    'audio/compat': () => import('@registry-react-tailwind-compat/components/videojs/audio/skin'),
    'audio/scaffold': () => import('@registry-react-tailwind-scaffold/components/videojs/audio/skin'),
    'live-audio/default': () => import('@registry-react-tailwind-default/components/videojs/live-audio/skin'),
    'live-audio/neutral': () => import('@registry-react-tailwind-neutral/components/videojs/live-audio/skin'),
    'live-audio/compat': () => import('@registry-react-tailwind-compat/components/videojs/live-audio/skin'),
    'live-audio/scaffold': () => import('@registry-react-tailwind-scaffold/components/videojs/live-audio/skin'),
  },
  css: {
    'video/default': () => import('@registry-react-css-default/components/videojs/video/skin'),
    'video/neutral': () => import('@registry-react-css-neutral/components/videojs/video/skin'),
    'video/compat': () => import('@registry-react-css-compat/components/videojs/video/skin'),
    'video/scaffold': () => import('@registry-react-css-scaffold/components/videojs/video/skin'),
    'live-video/default': () => import('@registry-react-css-default/components/videojs/live-video/skin'),
    'live-video/neutral': () => import('@registry-react-css-neutral/components/videojs/live-video/skin'),
    'live-video/compat': () => import('@registry-react-css-compat/components/videojs/live-video/skin'),
    'live-video/scaffold': () => import('@registry-react-css-scaffold/components/videojs/live-video/skin'),
    'audio/default': () => import('@registry-react-css-default/components/videojs/audio/skin'),
    'audio/neutral': () => import('@registry-react-css-neutral/components/videojs/audio/skin'),
    'audio/compat': () => import('@registry-react-css-compat/components/videojs/audio/skin'),
    'audio/scaffold': () => import('@registry-react-css-scaffold/components/videojs/audio/skin'),
    'live-audio/default': () => import('@registry-react-css-default/components/videojs/live-audio/skin'),
    'live-audio/neutral': () => import('@registry-react-css-neutral/components/videojs/live-audio/skin'),
    'live-audio/compat': () => import('@registry-react-css-compat/components/videojs/live-audio/skin'),
    'live-audio/scaffold': () => import('@registry-react-css-scaffold/components/videojs/live-audio/skin'),
  },
};

const registryComponents: Record<SkinKey, string> = {
  'video/default': 'VideoSkin',
  'video/neutral': 'VideoSkin',
  'video/compat': 'VideoSkin',
  'video/scaffold': 'VideoSkin',
  'live-video/default': 'LiveVideoSkin',
  'live-video/neutral': 'LiveVideoSkin',
  'live-video/compat': 'LiveVideoSkin',
  'live-video/scaffold': 'LiveVideoSkin',
  'audio/default': 'AudioSkin',
  'audio/neutral': 'AudioSkin',
  'audio/compat': 'AudioSkin',
  'audio/scaffold': 'AudioSkin',
  'live-audio/default': 'LiveAudioSkin',
  'live-audio/neutral': 'LiveAudioSkin',
  'live-audio/compat': 'LiveAudioSkin',
  'live-audio/scaffold': 'LiveAudioSkin',
};

function pickComponent<Props>(module: object, name: string, key: string): ComponentType<Props> {
  // SAFETY: a module namespace is a plain object keyed by export name; the value is checked below.
  const component = (module as Record<string, unknown>)[name];
  if (typeof component !== 'function') throw new Error(`Skin module ${key} did not export ${name}.`);

  // SAFETY: a skin module exports its skin as a React component under the catalogued name.
  return component as ComponentType<Props>;
}

async function loadSkinComponent<Props>(request: SkinRequest): Promise<ComponentType<Props>> {
  const { preset, skin, styling, source } = request;
  const key: SkinKey = `${preset}/${skin}`;

  switch (source) {
    case 'package': {
      const entry = packageSkins[preset];
      const style = entry.styles[skin];
      const component = entry.components[skin];

      const [module] = await Promise.all([entry.module(), style()]);

      return pickComponent(module, component, key);
    }
    case 'registry': {
      const load = registrySkins[styling][key];
      const component = registryComponents[key];

      return pickComponent(await load(), component, key);
    }
    case 'authored': {
      const { authoredExportName, loadAuthoredSkinModule } = await import('@app/shared/authored-skins');
      const module = await loadAuthoredSkinModule('react', preset, skin, styling);

      return pickComponent(module, authoredExportName(preset), key);
    }
  }
}

function useLoadedComponent<Props>(
  load: () => Promise<ComponentType<Props>>,
  deps: readonly unknown[]
): ComponentType<Props> | null {
  const [component, setComponent] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    let active = true;

    void load()
      .then((resolved) => {
        if (!active) return;

        setComponent(() => resolved);
      })
      .catch((error) => {
        if (!active) return;

        // The component stays null; the page shows nothing rather than a half-styled player.
        console.error('Failed to load skin', error);
      });

    return () => {
      active = false;
    };
    // we're proxying the deps
    // oxlint-disable-next-line react/exhaustive-deps
  }, deps);

  return component;
}

/** Subtitle tracks are the page's to add, so a template never has to spell them out. */
function useCaptionTracks(root: RefObject<HTMLElement | null>, captions: CaptionsMode, deps: readonly unknown[]) {
  useEffect(() => {
    const media = root.current ? findMediaElement(root.current) : undefined;

    if (media) applyCaptionTracks(media, captions);
    // the media component changes with the source and the skin, which the caller lists
    // oxlint-disable-next-line react/exhaustive-deps
  }, [captions, ...deps]);
}

/** The skin derives `dir` from its locale unless given one, so a pinned direction has to arrive as a prop. */
function useDirectionProps(): { dir?: 'ltr' | 'rtl' } {
  const direction = useDirection();

  return direction === 'auto' ? {} : { dir: direction };
}

type VideoSkinComponentProps = { live?: boolean } & VideoSkinProps;

/**
 * Loads the video skin the shell selected, from the source it selected, framed the way every sandbox page frames a
 * player unless a `className` says otherwise. When `live` is true, the `live-video` skin variant is used instead.
 */
export function VideoSkinComponent({
  live = false,
  className = PLAYER_FRAME_CLASSES.video,
  renderThumbnail,
  ...props
}: VideoSkinComponentProps) {
  const { skin, styling, skins, source, captions } = useSandbox();
  const preset: SkinPreset = live ? 'live-video' : 'video';
  const Component = useLoadedComponent<VideoSkinProps>(
    () => loadSkinComponent({ preset, skin, styling, source: skins }),
    [preset, skin, styling, skins]
  );
  const directionProps = useDirectionProps();
  const rootRef = useRef<HTMLElement>(null);

  useCaptionTracks(rootRef, captions, [Component, source]);

  if (!Component) return null;

  // The live skin has no time slider, so it takes no thumbnail override; the prop would land on its container.
  const thumbnailProps: Pick<VideoSkinProps, 'renderThumbnail'> = live ? {} : { renderThumbnail };

  // SAFETY: React 19 hands `ref` to a function component as a prop, and every skin spreads its props onto the container.
  return createElement(Component, {
    ...props,
    ...thumbnailProps,
    ...directionProps,
    className,
    ref: rootRef,
  } as VideoSkinProps);
}

type AudioSkinComponentProps = { live?: boolean } & AudioSkinProps;

export function AudioSkinComponent({
  live = false,
  className = PLAYER_FRAME_CLASSES.audio,
  ...props
}: AudioSkinComponentProps) {
  const { skin, styling, skins } = useSandbox();
  const preset: SkinPreset = live ? 'live-audio' : 'audio';
  const Component = useLoadedComponent<AudioSkinProps>(
    () => loadSkinComponent({ preset, skin, styling, source: skins }),
    [preset, skin, styling, skins]
  );
  const directionProps = useDirectionProps();

  if (!Component) return null;

  return createElement(Component, { ...props, ...directionProps, className });
}
