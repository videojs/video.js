// The player, skin, and `LazyAudio`, split out so light mode loads none of them until play is pressed.
import '@videojs/react/audio/skin.css';
import { LAZY_DEMO_CLASSES } from '@app/shared/lazy-sources';
import { AudioPlayer, AudioSkin, usePlayer } from '@videojs/react/audio';
import { LazyAudio } from '@videojs/react/media/lazy-audio';

import { createReactMount, type LazyReactPlayerProps, useReportStarted } from './react';

function StartedReporter({ onStarted }: { onStarted: () => void }) {
  useReportStarted(
    usePlayer((state) => state.started),
    onStarted
  );

  return null;
}

function LazyAudioPlayer({ src, autoplay, muted, preload, mediaRef, onStarted }: LazyReactPlayerProps) {
  return (
    <AudioPlayer>
      <AudioSkin className={LAZY_DEMO_CLASSES.audioFrame}>
        <LazyAudio
          src={src}
          mediaRef={mediaRef}
          autoPlay={autoplay}
          muted={muted}
          preload={preload === 'none' ? undefined : preload}
          crossOrigin=""
        />
      </AudioSkin>
      <StartedReporter onStarted={onStarted} />
    </AudioPlayer>
  );
}

export const mount = createReactMount(LazyAudioPlayer);
