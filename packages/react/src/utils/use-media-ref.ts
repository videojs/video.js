'use client';

import type { Ref, RefCallback } from 'react';
import { useCallback } from 'react';

import { composeRefs } from './use-composed-refs';

/** Props for a media component that hands out the object that plays it, apart from the element it renders. */
export interface MediaRefProps<Media> {
  /**
   * Receives the object that plays the media: the rendered element for a native `<video>` or `<audio>`, which already
   * is one, and the playback adapter for an embed, whose `<iframe>` cannot be played or seeked. It is set while the
   * rendered element is mounted and cleared with it, so it has the same lifetime as `ref`.
   */
  mediaRef?: Ref<Media> | undefined;
}

/**
 * Returns a callback ref for the rendered element that hands `media` to `mediaRef` while that element is mounted.
 *
 * For a media whose playback object is not the element it renders, such as an adapter driving an `<iframe>`. Compose it
 * after the ref that attaches the media, so the consumer never receives an adapter that is not yet attached.
 *
 * @param media - Playback object to hand out.
 * @param mediaRef - Consumer ref that receives `media`.
 */
export function useMediaRef<Media>(media: Media, mediaRef: Ref<Media> | undefined): RefCallback<Element> {
  return useCallback((element) => composeRefs(mediaRef)(element ? media : null), [media, mediaRef]);
}
