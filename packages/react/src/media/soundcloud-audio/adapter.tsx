'use client';

import { buildSoundCloudIframeSrc, SoundCloudAdapter, type SoundCloudAdapterProps } from '@videojs/soundcloud-audio';
import { type CSSProperties, forwardRef, type IframeHTMLAttributes, type ReactNode, useState } from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventPropName, type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import { useMediaInstance } from '../../utils/use-media-instance';
import { type MediaRefProps, useMediaRef } from '../../utils/use-media-ref';
import { useSyncProps } from '../../utils/use-sync-props';

export interface SoundCloudAudioProps
  extends
    Partial<SoundCloudAdapterProps>,
    Omit<IframeHTMLAttributes<HTMLIFrameElement>, MediaEventPropName | keyof SoundCloudAdapterProps | 'children'>,
    MediaEventProps<SoundCloudAdapter>,
    MediaRefProps<SoundCloudAdapter> {
  /** `<audio>` spelling of `autoplay`, accepted so markup ports across. An explicit `autoplay` wins. */
  autoPlay?: boolean | undefined;
  children?: ReactNode;
}

export const SoundCloudAudio = forwardRef<HTMLIFrameElement, SoundCloudAudioProps>(function SoundCloudAudio(
  { children, mediaRef, autoPlay = false, autoplay = autoPlay, ...rawProps },
  ref
) {
  const media = useMediaInstance(SoundCloudAdapter);
  const props: Partial<SoundCloudAdapterProps> & Record<string, unknown> = { ...rawProps, autoplay };
  const [initialSrc] = useState(() =>
    // `source.src` is the only other way to name a sound, so honor it when `src` is absent.
    buildSoundCloudIframeSrc(props.src || props.source?.src || '', props)
  );
  const { ref: eventsRef, props: elementProps } = useMediaEvents(
    useSyncProps<SoundCloudAdapterProps, Record<string, unknown>>(media, props, SoundCloudAdapter.defaultProps),
    media
  );
  const { style, ...iframeProps } = elementProps as Record<string, unknown> & { style?: CSSProperties };
  const attachRef = useAttachMedia(media);
  const exposeRef = useMediaRef(media, mediaRef);
  // Listeners first: `attach()` dispatches `loadstart` synchronously.
  const composedRef = useComposedRefs(eventsRef, attachRef, exposeRef, ref);

  return (
    <iframe
      title="SoundCloud audio player"
      // Empty means there is no widget to point at yet; React warns about `src=""`,
      // and the media builds the URL itself once a source resolves.
      src={initialSrc || undefined}
      data-cross-origin-frame
      allow="autoplay; encrypted-media"
      scrolling="no"
      frameBorder={0}
      // Attributes rather than styles, so any `className` or `style` sizes the widget instead.
      width="100%"
      height={166}
      referrerPolicy={props.source?.engine?.soundcloud?.referrerPolicy}
      {...iframeProps}
      // The widget is SoundCloud's own chrome, so without controls it is a transport and nothing else.
      // Inline so a `className` cannot put it back on screen, merged so a consumer's own styles survive.
      // A hidden iframe still loads and plays.
      style={props.controls ? style : { ...style, display: 'none' }}
      ref={composedRef}
    >
      {children}
    </iframe>
  );
});

export namespace SoundCloudAudio {
  export type Props = SoundCloudAudioProps;
}
