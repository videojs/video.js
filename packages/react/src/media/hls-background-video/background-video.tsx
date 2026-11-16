'use client';

import type { HlsBackgroundVideoAdapter } from '@videojs/spf/adapters/hls-background-video';
import {
  type ForwardedRef,
  type ReactNode,
  type RefCallback,
  type Ref,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import { useAttachMedia } from '../../utils/use-attach-media';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useMediaRef } from '../../utils/use-media-ref';

/**
 * The parts of a background-video component that don't depend on which Media it hosts, shared by `HlsBackgroundVideo`
 * and `MuxBackgroundVideo`. Each component keeps its own `forwardRef`, Media instance, and `useSyncProps` call, in the
 * shape the other React media components have.
 */

interface BackgroundVideoOptions<Media> {
  mediaRef: Ref<Media> | undefined;
  loop: boolean;
  autoPlay: boolean;
}

/**
 * Attaches `media` to the rendered `<video>`, keeps the `loop` / `autoPlay` opt-outs applied, and re-fires the Media's
 * fatal `error` on the element. Returns the ref the `<video>` takes. Call it before `useSyncProps`, so the opt-outs
 * apply after an attach and before the props sync, as they always have.
 *
 * @internal
 */
export function useBackgroundVideo<Media extends HlsBackgroundVideoAdapter>(
  media: Media,
  { mediaRef, loop, autoPlay }: BackgroundVideoOptions<Media>,
  ref: ForwardedRef<HTMLVideoElement>
): RefCallback<HTMLVideoElement> {
  const videoRef = useRef<HTMLVideoElement>(null);
  const attachRef = useAttachMedia(media);

  // Attaching fixes loop and autoplay on, so the opt-outs are reapplied after it. Declared after `useAttachMedia` so this
  // also runs after any re-attach from its layout effect.
  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = loop;
    video.autoplay = autoPlay;
  });

  const exposeRef = useMediaRef(media, mediaRef);
  const composedRef = useComposedRefs(attachRef, exposeRef, videoRef, ref);

  // Re-fired on the element rather than handed to `onError` directly, so React's
  // own event plumbing delivers it: the handler gets the synthetic event it is
  // typed for, and anything else listening on the node — the consumer's own
  // `addEventListener`, a testing-library assertion — sees the same failure.
  useEffect(() => {
    const forward = () => videoRef.current?.dispatchEvent(new Event('error'));

    media.addEventListener('error', forward);
    return () => media.removeEventListener('error', forward);
  }, [media]);

  return composedRef;
}

interface BackgroundVideoElementProps {
  htmlProps: object;
  videoRef: RefCallback<HTMLVideoElement>;
  loop: boolean;
  autoPlay: boolean;
  children: ReactNode;
  fallback: ReactNode;
}

/**
 * The `<video>` a background-video component renders.
 *
 * @internal
 */
export function renderBackgroundVideo({
  htmlProps,
  videoRef,
  loop,
  autoPlay,
  children,
  fallback,
}: BackgroundVideoElementProps): ReactNode {
  return (
    // The same set `<hls-background-video>` forces onto its inner video, so the
    // two platforms present the same surface: silent playback with no affordance
    // a UA could hang chrome on — AirPlay, Cast, and picture-in-picture all being
    // things a background video has nowhere to put.
    //
    // Applied after the spread rather than before it, unlike the generic
    // `BackgroundVideo`: they're what the component is for, and attaching the
    // Media re-applies `muted` anyway, so honoring `muted={false}` would only
    // look like it worked. `loop` and `autoPlay` are the two opt-outs.
    <video
      {...htmlProps}
      ref={videoRef}
      muted
      autoPlay={autoPlay}
      loop={loop}
      playsInline
      disableRemotePlayback
      disablePictureInPicture
    >
      {children}
      {fallback}
    </video>
  );
}
