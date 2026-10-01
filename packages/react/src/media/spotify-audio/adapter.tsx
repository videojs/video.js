'use client';

import { buildSpotifyIframeSrc, SpotifyAdapter, type SpotifyAdapterProps } from '@videojs/spotify-audio';
import { type CSSProperties, forwardRef, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface SpotifyAudioProps
  extends Partial<SpotifyAdapterProps>, MediaEventProps<SpotifyAdapter>, MediaRefProps<SpotifyAdapter> {
  children?: ReactNode;
}

export const SpotifyAudio = forwardRef<HTMLIFrameElement, SpotifyAudioProps>(function SpotifyAudio(
  { children, mediaRef, ...rawProps },
  ref
) {
  const media = useMediaInstance(SpotifyAdapter);
  const props: Partial<SpotifyAdapterProps> & Record<string, unknown> = { ...rawProps };
  const [initialSrc] = useState(() =>
    // `source.src` is the only other way to name an entity, so honor it when `src` is absent.
    buildSpotifyIframeSrc(props.src || props.source?.src || '', { ...SpotifyAdapter.defaultProps, ...props })
  );
  const { ref: eventsRef, props: elementProps } = useMediaEvents(
    useSyncProps<SpotifyAdapterProps, Record<string, unknown>>(media, props, SpotifyAdapter.defaultProps),
    media
  );
  const { style, ...iframeProps } = elementProps as Record<string, unknown> & { style?: CSSProperties };
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <iframe
      title="Spotify audio player"
      // Empty means there is no embed to point at yet; React warns about `src=""`,
      // and the media builds the URL itself once a source resolves.
      src={initialSrc || undefined}
      data-cross-origin-frame
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      frameBorder={0}
      width="100%"
      height="100%"
      referrerPolicy={props.source?.engine?.spotify?.referrerPolicy}
      {...iframeProps}
      // Without Spotify's own chrome the embed is a transport and nothing else:
      // its player UI would otherwise show through whatever skin is drawn over it.
      // Inline so a `className` cannot put it back on screen, merged so a
      // consumer's own styles survive. A hidden iframe still loads and plays.
      style={props.controls ? style : { ...style, display: 'none' }}
      ref={composedRef}
    >
      {children}
    </iframe>
  );
});

export namespace SpotifyAudio {
  export type Props = SpotifyAudioProps;
}
