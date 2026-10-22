'use client';

import { type LazyAudioMediaName, type Media, resolveLazyAudioMedia } from '@videojs/media';
import { type AudioHTMLAttributes, type ComponentType, forwardRef, Suspense } from 'react';

import type { MediaRefProps } from '../../utils/use-media-ref';
import { Audio } from '../audio';
import type { MediaFallbackProps } from '../fallback';
import { type LazyMediaProps, lazyMedia, useNativeHls, useUnresolvedSourceError } from '../lazy-media';

const MEDIA = {
  audio: Audio,
  'hls-audio': /* @__PURE__ */ lazyMedia(() => import('../hls-audio'), 'HlsAudio'),
  'mux-audio': /* @__PURE__ */ lazyMedia(() => import('../mux-audio'), 'MuxAudio'),
  'spotify-audio': /* @__PURE__ */ lazyMedia(() => import('../spotify-audio'), 'SpotifyAudio'),
} satisfies Record<LazyAudioMediaName, ComponentType<any>>;

/** @experimental */
export interface LazyAudioProps
  extends
    Omit<AudioHTMLAttributes<HTMLAudioElement>, keyof LazyMediaProps>,
    LazyMediaProps,
    MediaRefProps<Media>,
    MediaFallbackProps {}

/**
 * Plays audio from any supported source by rendering the media component for it, and loads only that component's code
 * once the source is known.
 *
 * Resolves files to a native `<audio>`, HLS to a native `<audio>` on Safari and `HlsAudio` elsewhere, Mux sources to
 * `MuxAudio`, and Spotify sources to `SpotifyAudio`. Renders nothing for a source it can't resolve. Props are passed to
 * the resolved media, so switching to that component directly only changes the import.
 *
 * @experimental
 */
export const LazyAudio = forwardRef<HTMLAudioElement, LazyAudioProps>(function LazyAudio(
  { src = '', type, preferPlayback, preload = 'none', fallback, ...props },
  ref
) {
  // Resolving a source is cheaper than memoizing it, and the compiler's cache is most of this component's size.
  'use no memo';

  const nativeHls = useNativeHls();
  const name = resolveLazyAudioMedia(src, { type, nativeHls, preferPlayback });

  useUnresolvedSourceError('LazyAudio', src, name);

  if (!name) return null;

  // Each media takes the props it understands; the union of their prop types has no common shape to check against.
  const ResolvedMedia: ComponentType<any> = MEDIA[name];
  // The Spotify embed renders an `<iframe>`, which has no fallback content.
  const fallbackProps = fallback !== undefined && name !== 'spotify-audio' ? { fallback } : null;

  return (
    <Suspense fallback={null}>
      <ResolvedMedia ref={ref} {...props} {...fallbackProps} src={src} preload={preload} />
    </Suspense>
  );
});

/** @experimental */
export namespace LazyAudio {
  export type Props = LazyAudioProps;
}
