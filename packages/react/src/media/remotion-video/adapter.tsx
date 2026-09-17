'use client';

import { Player, type PlayerRef } from '@remotion/player';
import { RemotionAdapter, type RemotionAdapterProps } from '@videojs/remotion-video';
import {
  type CSSProperties,
  forwardRef,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from 'react';

import { useMediaInstance } from '../../utils/use-media-instance';

export interface RemotionVideoProps extends Partial<RemotionAdapterProps> {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const FILL: CSSProperties = { width: '100%', height: '100%' };

export const RemotionVideo = forwardRef<HTMLDivElement, RemotionVideoProps>(function RemotionVideo(
  { className, style, children, ...props },
  ref
) {
  const media = useMediaInstance(RemotionAdapter);
  const playerProps = useSyncExternalStore(media.subscribePlayerProps, media.getPlayerProps, media.getPlayerProps);

  // Author props are pushed onto the adapter after commit rather than during render as `useSyncProps` does: a rate or
  // volume change the store just made re-renders this component through `useSyncExternalStore`, and writing stale
  // props during that render would stomp it. Only keys the author passes are written, and a key resets to its default
  // only once the author stops passing it.
  const syncedKeysRef = useRef<Set<keyof RemotionAdapterProps>>(new Set());

  useLayoutEffect(() => {
    const defaults = RemotionAdapter.defaultProps;
    const target = media as unknown as Record<string, unknown>;
    const synced = new Set<keyof RemotionAdapterProps>();

    for (const key of syncedKeysRef.current) {
      if (props[key] === undefined && target[key] !== defaults[key]) target[key] = defaults[key];
    }

    for (const key of Object.keys(defaults) as (keyof RemotionAdapterProps)[]) {
      const value = props[key];
      if (value === undefined) continue;

      synced.add(key);

      if (target[key] !== value) target[key] = value;
    }

    syncedKeysRef.current = synced;
  });

  const attachRef = useCallback(
    (player: PlayerRef | null) => {
      if (player) media.attach(player);
      else media.detach();
    },
    [media]
  );

  const { source } = playerProps;

  return (
    <div ref={ref} className={className} style={style}>
      {source ? (
        <Player
          // Remount on a new composition so `initialFrame`/`initiallyMuted`/`initialVolume` apply per source.
          key={source.id}
          ref={attachRef}
          // `composition` is spelled the way `<Player>` spells its own props, so it forwards whole.
          {...source.composition}
          inputProps={source.composition.inputProps ?? {}}
          style={FILL}
          // Video.js owns every control surface: no chrome, no click/keyboard shortcuts, no media-session claims.
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          allowFullscreen={false}
          browserMediaControlsBehavior={{ mode: 'do-nothing' }}
          renderLoading={() => null}
          // A media element stays on its last frame when it ends; Remotion would rewind to frame 0 by default. Its
          // `play()` already restarts from 0 when called on the last frame, so replay still works.
          moveToBeginningWhenEnded={false}
          loop={playerProps.loop}
          playbackRate={playerProps.playbackRate}
          initiallyMuted={playerProps.initiallyMuted}
          // Passing a volume at all is what keeps Remotion off its own localStorage preference; the store owns it.
          initialVolume={playerProps.initialVolume}
          autoPlay={media.autoplay}
          acknowledgeRemotionLicense
        />
      ) : null}
      {children}
    </div>
  );
});

export namespace RemotionVideo {
  export type Props = RemotionVideoProps;
}
