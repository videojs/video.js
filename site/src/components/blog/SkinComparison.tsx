import {
  createPlayer,
  errorFeature,
  fullscreenFeature,
  type PlayerTarget,
  selectControls,
  useMediaAttach,
} from '@videojs/react';
import { CompatVideoSkin, NeutralVideoSkin, ScaffoldVideoSkin, VideoSkin, videoFeatures } from '@videojs/react/video';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import Comparison from '@/components/Comparison/Comparison';

import { CosmicDawnVideo, useControlsLock } from './CosmicDawnVideo';

import '@videojs/react/video/skin.css';
import '@videojs/react/video/neutral-skin.css';
import '@videojs/react/video/compat-skin.css';
import '@videojs/react/video/scaffold-skin.css';
import './SkinComparison.css';

const skins = [
  { name: 'Default', Skin: VideoSkin },
  { name: 'Neutral', Skin: NeutralVideoSkin },
  { name: 'Compat', Skin: CompatVideoSkin },
  { name: 'Scaffold', Skin: ScaffoldVideoSkin },
];

// Each skin owns its input handlers, but fullscreen must include the shared video and all the slices.
function fullscreenTarget(target: PlayerTarget): PlayerTarget {
  return {
    ...target,
    container: target.container?.closest<HTMLElement>('.comparison') ?? target.container,
  };
}

const comparisonFullscreen: typeof fullscreenFeature = {
  ...fullscreenFeature,
  state(context) {
    const state = fullscreenFeature.state;

    // The built-in feature uses a factory; the shared feature type also allows static state.
    // oxlint-disable-next-line anti-slop/no-runtime-typeof
    return typeof state === 'function'
      ? state({ ...context, target: () => fullscreenTarget(context.target()) })
      : state;
  },
  attach(context) {
    return fullscreenFeature.attach?.({ ...context, target: fullscreenTarget(context.target) });
  },
};

// Only the accessible skin opens an error dialog for the shared media.
const comparisonError: typeof errorFeature = {
  ...errorFeature,
  attach({ target: { media, container }, signal, set }) {
    if (!(media instanceof HTMLVideoElement)) return;

    media.addEventListener(
      'error',
      () => {
        if (container?.closest('.comparison-slice')?.getAttribute('aria-hidden') !== 'true') {
          set({ error: media.error });
        }
      },
      { signal }
    );
    media.addEventListener('emptied', () => set({ error: null }), { signal });
  },
};

const { Player, usePlayer } = createPlayer({
  features: videoFeatures.map((feature) => {
    if (feature === fullscreenFeature) return comparisonFullscreen;

    if (feature === errorFeature) return comparisonError;

    return feature;
  }),
});

function SharedMedia({ media }: { media: HTMLVideoElement | null }) {
  const setMedia = useMediaAttach();

  useEffect(() => {
    setMedia?.(media);
    return () => setMedia?.(null);
  }, [media, setMedia]);

  useControlsLock(usePlayer(selectControls)?.requestControlsLock, media);

  return null;
}

export default function SkinComparison() {
  const [media, setMedia] = useState<HTMLVideoElement | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = wrapper.current?.querySelector<HTMLElement>('.comparison-stage');
    if (!root || !media) return;

    // The shared video cannot inherit caption offsets or corners from its sibling skins.
    const update = () => {
      const offsets = ['0px'];
      const radii: string[] = [];

      for (const slice of root.querySelectorAll<HTMLElement>('.comparison-slice')) {
        if (slice.inert) continue;

        const skin = slice.querySelector<HTMLElement>('.skin-comparison-skin');

        if (skin) radii.push(getComputedStyle(skin).borderTopLeftRadius);

        // Each skin offsets captions on its own descendant video, including container-query overrides, so read the
        // value from a hidden probe video rather than copying the skins' breakpoints here.
        const probe = slice.querySelector<HTMLElement>('.skin-comparison-caption-probe');
        const offset = probe && getComputedStyle(probe).getPropertyValue('--media-caption-track-y').trim();

        if (offset) offsets.push(offset);
      }

      media.style.setProperty('--comparison-caption-y', `min(${offsets.join(', ')})`);
      // Round the video's outer corners like the skins at either edge. Their corner shadows alone can leave a hairline
      // of video showing in Safari.
      media.style.setProperty('--comparison-radius-start', radii[0] ?? '0px');
      media.style.setProperty('--comparison-radius-end', radii.at(-1) ?? '0px');
    };

    update();
    const resize = new ResizeObserver(update);

    resize.observe(root);
    const observer = new MutationObserver(update);

    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-controls-visible', 'inert'] });

    return () => {
      resize.disconnect();
      observer.disconnect();
    };
  }, [media]);

  return (
    <div ref={wrapper} className="skin-comparison mx-auto max-w-3xl">
      <Comparison
        label="Interactive skin comparison"
        items={skins.map(({ name, Skin }) => ({
          label: name,
          content: (
            <Player>
              <SharedMedia media={media} />
              <Skin className="skin-comparison-skin">
                <video className="skin-comparison-caption-probe" style={{ display: 'none' }} aria-hidden="true" />
              </Skin>
            </Player>
          ),
        }))}
      >
        <CosmicDawnVideo ref={setMedia} className="skin-comparison-video" />
      </Comparison>
    </div>
  );
}
