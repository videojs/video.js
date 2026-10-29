import { CompatVideoSkin, NeutralVideoSkin, ScaffoldVideoSkin, VideoSkin } from '@videojs/react/video';
import { useLayoutEffect, useRef, useState } from 'react';

import Comparison from '@/components/Comparison/Comparison';
import { createSharedMediaPlayer } from '@/components/skins/sharedMediaPlayer';

import { CosmicDawnVideo } from './CosmicDawnVideo';

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

// Only the accessible skin opens an error dialog for the shared media.
const { Player, SharedMedia } = createSharedMediaPlayer({
  stage: '.comparison',
  isHidden: (container) => container.closest('.comparison-slice')?.getAttribute('aria-hidden') === 'true',
});

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
              <SharedMedia media={media} lockControls />
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
