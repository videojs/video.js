'use client';

import { buildPlayerJsIframeSrc, PlayerJsAdapter, type PlayerJsAdapterProps } from '@videojs/playerjs-video';
import { forwardRef, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface PlayerJsVideoProps
  extends Partial<PlayerJsAdapterProps>, MediaEventProps<PlayerJsAdapter>, MediaRefProps<PlayerJsAdapter> {
  children?: ReactNode;
}

export const PlayerJsVideo = forwardRef<HTMLIFrameElement, PlayerJsVideoProps>(function PlayerJsVideo(
  { children, mediaRef, ...rawProps },
  ref
) {
  const media = useMediaInstance(PlayerJsAdapter);
  const props: Partial<PlayerJsAdapterProps> & Record<string, unknown> = { ...rawProps };
  const [initialSrc] = useState(() =>
    // `source.src` is the only other way to name an embed, so honor it when `src` is absent.
    buildPlayerJsIframeSrc(props.src || props.source?.src || '', {
      ...PlayerJsAdapter.defaultProps,
      ...props,
      // Either prop says to start muted, and the adapter builds the URL the same way; rendering it any other way
      // would have the adapter rebuild the frame on mount.
      defaultMuted: !!(props.defaultMuted || props.muted),
    })
  );
  const { ref: eventsRef, props: iframeProps } = useMediaEvents(
    useSyncProps<PlayerJsAdapterProps, Record<string, unknown>>(media, props, PlayerJsAdapter.defaultProps),
    media
  );
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
      ref={composedRef}
    >
      {children}
    </iframe>
  );
});

export namespace PlayerJsVideo {
  export type Props = PlayerJsVideoProps;
}
