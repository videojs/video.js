'use client';

import { type LazyAudioMediaName, type Media, resolveLazyAudioMedia } from '@videojs/media';
import { type AudioHTMLAttributes, type ComponentType, forwardRef, lazy, Suspense } from 'react';

import type { MediaRefProps } from '../../utils/use-media-ref';
import { Audio } from '../audio';
import type { MediaFallbackProps } from '../fallback';
import { type LazyMediaProps, useNativeHls, useUnresolvedSourceError } from '../lazy-media';

// Module-level so each component keeps its identity across renders; deriving one during render would remount the media.
const MEDIA = {
  audio: Audio,
  'hls-audio': /* @__PURE__ */ lazy(() => import('../hls-audio').then((m) => ({ default: m.HlsAudio }))),
  'mux-audio': /* @__PURE__ */ lazy(() => import('../mux-audio').then((m) => ({ default: m.MuxAudio }))),
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
 * Resolves files to a native `<audio>`, HLS to a native `<audio>` on Safari and `HlsAudio` elsewhere, and Mux sources
 * to `MuxAudio`. Renders nothing for a source it can't resolve. Props are passed to the resolved media, so switching to
 * that component directly only changes the import.
 *
 * @experimental
 */
export const LazyAudio = forwardRef<HTMLAudioElement, LazyAudioProps>(function LazyAudio(
  { src = '', type, preferPlayback, preload = 'none', fallback, ...props },
  ref
) {
  const nativeHls = useNativeHls();
  const name = resolveLazyAudioMedia(src, { type, nativeHls, preferPlayback });

  useUnresolvedSourceError('LazyAudio', src, name);

  if (!name) return null;

  // Each media takes the props it understands; the union of their prop types has no common shape to check against.
  const ResolvedMedia: ComponentType<any> = MEDIA[name];
  const fallbackProps = fallback !== undefined ? { fallback } : null;

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
