'use client';

import type { EngineAdapter } from '@videojs/media';
import type { RefCallback } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Returns a callback ref that attaches an element to a playback adapter and detaches it when the element or the adapter
 * changes, when the element goes away, and on unmount.
 *
 * React hands a callback ref `null` and then the same element again whenever the ref changes identity, which happens
 * every render when it is composed with an inline `ref={(el) => ...}` from a parent. Attaching only when the element or
 * the adapter actually changed, and deferring detach to a layout effect that runs after the commit's refs, keeps that
 * from tearing the engine down and rebuilding it.
 *
 * @param media - Playback adapter to attach and detach.
 * @internal
 */
export function useAttachMedia<T extends Element>(media: EngineAdapter): RefCallback<T> {
  const elementRef = useRef<T | null>(null);
  const attachedRef = useRef<{ media: EngineAdapter; element: T } | null>(null);

  const detach = useCallback(() => {
    const attached = attachedRef.current;

    attachedRef.current = null;
    attached?.media.detach?.();
  }, []);

  // Reconciles what the adapter is attached to with the element React last handed the ref.
  const sync = useCallback(() => {
    const element = elementRef.current;
    const attached = attachedRef.current;

    if (attached && (attached.element !== element || attached.media !== media)) detach();

    if (element && !attachedRef.current) {
      media.attach?.(element);
      attachedRef.current = { media, element };
    }
  }, [media, detach]);

  // Attach while the refs run so it lands before this commit's effects. A `null` only records the element as gone; the
  // layout effect decides whether it was really removed or is about to be handed back.
  const ref = useCallback<RefCallback<T>>(
    (element) => {
      elementRef.current = element;

      if (element) sync();
    },
    [sync]
  );

  // Runs after this commit's refs: detaches when the element was removed, and re-attaches after a StrictMode simulated
  // unmount. Unmount itself runs the cleanup before the ref is handed `null`, so that detaches outright.
  useLayoutEffect(sync);
  useLayoutEffect(() => detach, [detach]);

  return ref;
}
