'use client';

import {
  buildPlayerJsIframeSrc,
  PlayerJsAdapter,
  type PlayerJsAdapterProps,
  shouldDeferPlayerJsEmbed,
} from '@videojs/playerjs-video';
import { type CSSProperties, forwardRef, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface PlayerJsVideoProps
  extends Partial<PlayerJsAdapterProps>, MediaEventProps<PlayerJsAdapter>, MediaRefProps<PlayerJsAdapter> {
  /** `<video>` spelling of `autoplay`, accepted so markup ports across. An explicit `autoplay` wins. */
  autoPlay?: boolean | undefined;
  children?: ReactNode;
}

export const PlayerJsVideo = forwardRef<HTMLIFrameElement, PlayerJsVideoProps>(function PlayerJsVideo(
  { children, mediaRef, autoPlay = false, autoplay = autoPlay, ...rawProps },
  ref
) {
  const media = useMediaInstance(PlayerJsAdapter);
  const props: Partial<PlayerJsAdapterProps> & Record<string, unknown> = { ...rawProps, autoplay };
  const [initialSrc] = useState(() =>
    // A deferred embed renders an empty frame; the media builds it when playback is requested.
    shouldDeferPlayerJsEmbed(props)
      ? ''
      : // `source.src` is the only other way to name an embed, so honor it when `src` is absent.
        buildPlayerJsIframeSrc(props.src || props.source?.src || '', {
          ...PlayerJsAdapter.defaultProps,
          ...props,
          // Either prop says to start muted, and the adapter builds the URL the same way; rendering it any other way
          // would have the adapter rebuild the frame on mount.
          defaultMuted: !!(props.defaultMuted || props.muted),
        })
  );
  const { ref: eventsRef, props: elementProps } = useMediaEvents(
    useSyncProps<PlayerJsAdapterProps, Record<string, unknown>>(media, props, PlayerJsAdapter.defaultProps),
    media
  );
  const { style, ...iframeProps } = elementProps as Record<string, unknown> & { style?: CSSProperties };
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <iframe
      title="Video player"
      // Empty means there is no embed to point at yet; React warns about `src=""`,
      // and the media builds the URL itself once a source resolves.
      src={initialSrc || undefined}
      data-cross-origin-frame
      allow="accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      frameBorder={0}
      width="100%"
      height="100%"
      referrerPolicy={props.source?.engine?.playerJs?.referrerPolicy}
      {...iframeProps}
      // A cross-origin frame swallows every pointer event, so without its own chrome it stays out of hit-testing and the
      // skin above it sees hover and clicks. Merged so a consumer's own styles survive without undoing it.
      style={props.controls ? style : { ...style, pointerEvents: 'none' }}
      ref={composedRef}
    >
      {children}
    </iframe>
  );
});

export namespace PlayerJsVideo {
  export type Props = PlayerJsVideoProps;
}
