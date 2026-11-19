'use client';

import { buildTwitchIframeSrc, TwitchAdapter, type TwitchAdapterProps } from '@videojs/twitch-video';
import { type CSSProperties, forwardRef, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface TwitchVideoProps
  extends Partial<TwitchAdapterProps>, MediaEventProps<TwitchAdapter>, MediaRefProps<TwitchAdapter> {
  /** `<video>` spelling of `autoplay`, accepted so markup ports across. An explicit `autoplay` wins. */
  autoPlay?: boolean | undefined;
  children?: ReactNode;
}

export const TwitchVideo = forwardRef<HTMLIFrameElement, TwitchVideoProps>(function TwitchVideo(
  { children, mediaRef, autoPlay = false, autoplay = autoPlay, ...rawProps },
  ref
) {
  const media = useMediaInstance(TwitchAdapter);
  const props: Partial<TwitchAdapterProps> & Record<string, unknown> = { ...rawProps, autoplay };
  const [initialSrc] = useState(() =>
    // Server rendering has no `location` to name as the embed's parent, and Twitch
    // refuses to play in a page its URL never named. Rendering no `src` leaves the
    // URL to `attach()`, which builds it where there is a hostname to name.
    globalThis.location
      ? // `source.src` is the only other way to name a video, so honor it when `src` is absent.
        buildTwitchIframeSrc(props.src || props.source?.src || '', {
          ...TwitchAdapter.defaultProps,
          ...props,
          // React sets `muted` as a property, never the attribute, and the embed reads mute once, from this URL.
          defaultMuted: !!(props.defaultMuted || props.muted),
        })
      : ''
  );
  const { ref: eventsRef, props: elementProps } = useMediaEvents(
    useSyncProps<TwitchAdapterProps, Record<string, unknown>>(media, props, TwitchAdapter.defaultProps),
    media
  );
  const { style, ...iframeProps } = elementProps as Record<string, unknown> & { style?: CSSProperties };
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <iframe
      title="Twitch video player"
      // Empty means there is no embed to point at yet; React warns about `src=""`,
      // and the media builds the URL itself once a source resolves.
      src={initialSrc || undefined}
      data-cross-origin-frame
      allow="accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture;"
      sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      scrolling="no"
      frameBorder={0}
      width="100%"
      height="100%"
      referrerPolicy={props.source?.engine?.twitch?.referrerPolicy}
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

export namespace TwitchVideo {
  export type Props = TwitchVideoProps;
}
