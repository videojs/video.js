'use client';

import {
  normalizeWistiaPlayer,
  parseWistiaMediaId,
  parseWistiaStartTime,
  WISTIA_PLAYER_TAG,
  type WistiaAdapterProps,
  wistiaAttributes,
  wistiaMediaOptions,
  type WistiaPlayer,
  wistiaPlayerStyle,
  type WistiaSource,
} from '@videojs/wistia-video';
// In a browser this entry is where `@wistia/wistia-player` is imported, so the tag below cannot outrun its
// definition. Off one it resolves to the server bundle, which reaches for none of it and leaves the tag to
// render as the plain markup a client then hydrates.
import {
  createElement,
  forwardRef,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type RefAttributes,
  type RefCallback,
  useCallback,
  useState,
} from 'react';

import { useMediaAttach } from '../../player/context';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { type MediaEventPropName, type MediaEventProps, useMediaEvents } from '../../utils/use-media-events';
import type { MediaRefProps } from '../../utils/use-media-ref';

// React only wires `onPlay` and friends to `<video>` and `<audio>`, so on a custom element they are routed by hand and
// carry the element's own `Event` rather than a synthetic one.
export interface WistiaVideoProps
  extends
    Partial<Omit<WistiaAdapterProps, 'source'>>,
    Omit<HTMLAttributes<WistiaPlayer>, MediaEventPropName>,
    MediaEventProps<WistiaPlayer>,
    MediaRefProps<WistiaPlayer> {
  /** Wistia's own options, `mediaId` among them: everything the player understands that a media does not. */
  source?: WistiaSource | null;
}

/**
 * Wistia is the one media here that ships a web component of its own, so this renders that component rather than a
 * player of its own making, and `@videojs/wistia-video` registers it statically — the element the ref hands back is
 * already a Wistia player. Wistia's own React wrapper defines it from an effect, a tick too late: the store reads a
 * media once, as it attaches, and a bare `HTMLElement` is a media that cannot seek, buffer, or name a source.
 *
 * The translation is one layer thin. `source` carries Wistia's own options — `mediaId`, `playerColor`, `qualityMin` —
 * straight through, so anything the player understands stays reachable without this component knowing about it; the
 * rest is the handful a media names differently. The element itself is what the store attaches to, normalized in place,
 * so the ref hands back one object that is both.
 */
export const WistiaVideo: ForwardRefExoticComponent<WistiaVideoProps & RefAttributes<WistiaPlayer>> = forwardRef<
  WistiaPlayer,
  WistiaVideoProps
>(function WistiaVideo(
  {
    autoplay,
    children,
    controls = false,
    defaultMuted,
    loop,
    mediaRef,
    muted,
    // Wistia has no inline-playback knob and plays inline, so this is accepted and goes no further.
    playsInline: _playsInline,
    poster,
    preload,
    source,
    src,
    style,
    ...rest
  },
  ref
) {
  const setMedia = useMediaAttach();

  const attachRef = useCallback<RefCallback<WistiaPlayer>>(
    (element) => {
      // No cast: this is where Wistia's real class is held to the contract the normalizer describes.
      if (element) normalizeWistiaPlayer(element);

      setMedia?.(element as never);
    },
    [setMedia]
  );
  // The element is the media, so it is what the event props listen to.
  const { ref: eventsRef, props: elementProps } = useMediaEvents(rest);
  // The element is the media, so `mediaRef` receives it alongside `ref`.
  const composedRef = useComposedRefs(eventsRef, attachRef, ref, mediaRef);

  // A Wistia URL is accepted where a media id is expected, the way every other media here accepts a `src`.
  const { mediaId, ...options } = source ?? {};
  const resolved = mediaId ?? (src ? parseWistiaMediaId(src) : null);
  // A `wtime` is a start position rather than a live playhead, and it belongs to the source it was written
  // on — read again for each one, since this component outlives them. Not frozen: an unchanged `src` renders
  // an unchanged attribute, which React leaves alone, so a playing media is never sent back to its start.
  const startTime = src ? parseWistiaStartTime(src) : null;
  // The muted state the player *starts* in, which is this component's to decide rather than the source's.
  const [initialMuted] = useState(() => defaultMuted ?? muted);

  return createElement(WISTIA_PLAYER_TAG, {
    // A new media is a new element. Writing an attribute goes around the normalizer's `source` setter, which
    // is what announces a source change, so the store would hold the last media's duration and title;
    // remounting says it as a detach and an attach. A source that only recolors keeps this id and the player.
    key: resolved,
    ...wistiaAttributes({
      mediaId: resolved ?? '',
      ...wistiaMediaOptions({ autoplay, controls, loop, poster, preload }),
      muted: initialMuted,
      currentTime: startTime,
      // Wistia's own options last, so a source reaches anything the props above do not name.
      ...options,
    }),
    ...elementProps,
    style: { ...wistiaPlayerStyle(controls), ...style },
    ref: composedRef,
    children,
  });
});

export namespace WistiaVideo {
  export type Props = WistiaVideoProps;
}
