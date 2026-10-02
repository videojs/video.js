'use client';

import { isFunction } from '@videojs/utils/predicate';
import { type RefCallback, useCallback, useRef } from 'react';

import { useLatestRef } from './use-latest-ref';

/**
 * React event prop names for the standard media events, mapped to the event type each one handles. Mirrors the media
 * subset of React's `DOMAttributes` so a handler written for `<video>` reads the same on an embed.
 */
const MEDIA_EVENT_PROPS = {
  onAbort: 'abort',
  onCanPlay: 'canplay',
  onCanPlayThrough: 'canplaythrough',
  onDurationChange: 'durationchange',
  onEmptied: 'emptied',
  onEnded: 'ended',
  onError: 'error',
  onLoadedData: 'loadeddata',
  onLoadedMetadata: 'loadedmetadata',
  onLoadStart: 'loadstart',
  onPause: 'pause',
  onPlay: 'play',
  onPlaying: 'playing',
  onProgress: 'progress',
  onRateChange: 'ratechange',
  onSeeked: 'seeked',
  onSeeking: 'seeking',
  onStalled: 'stalled',
  onSuspend: 'suspend',
  onTimeUpdate: 'timeupdate',
  onVolumeChange: 'volumechange',
  onWaiting: 'waiting',
} as const;

export type MediaEventPropName = keyof typeof MEDIA_EVENT_PROPS;

const MEDIA_EVENT_PROP_NAMES = Object.keys(MEDIA_EVENT_PROPS) as MediaEventPropName[];

/**
 * Handler for a standard media event dispatched by a playback adapter.
 *
 * The event is the plain `Event` the adapter dispatched on itself, so `currentTarget` is the adapter rather than a DOM
 * element; read playback state such as `currentTime` or `paused` from it the way a `<video>` handler would.
 */
export type MediaEventHandler<Target extends EventTarget = EventTarget> = (
  event: Event & { readonly currentTarget: Target }
) => void;

/**
 * Standard media event props for a media component whose playback engine is not an `HTMLMediaElement`, such as an
 * iframe embed. Named after the React props on `<video>` (`onPlay`, `onTimeUpdate`, …) so handlers port across.
 */
export type MediaEventProps<Target extends EventTarget = EventTarget> = {
  [Prop in MediaEventPropName]?: MediaEventHandler<Target> | undefined;
};

/**
 * Route standard media event props to a playback adapter that dispatches media events on itself.
 *
 * React only wires `onPlay`, `onTimeUpdate`, and friends to `<video>` and `<audio>`; on an `<iframe>` they go nowhere.
 * This splits those props out, subscribes them on the adapter, and returns everything else for the rendered element
 * along with a ref for that element. Listeners bind from the ref rather than an effect: adapters dispatch `loadstart`
 * (or `error`) synchronously inside `attach()`, and effects run after every ref has fired, so an effect-bound
 * `onLoadStart` would miss the initial load. Compose the ref ahead of the one that attaches the media so the listeners
 * are in place first. Listeners bind once per adapter and always call the latest handler, so re-renders never
 * resubscribe.
 *
 * @param props - Component props, which may include media event handlers.
 * @param media - Adapter that dispatches the standard media events. Omit it when the rendered element is the media
 *   itself, such as a third-party web component; the listeners then bind to whatever the ref receives.
 * @internal
 */
export function useMediaEvents<Props extends Record<string, unknown>>(
  props: Props,
  media?: EventTarget | null
): useMediaEvents.Result<Props> {
  const handlers: Partial<Record<MediaEventPropName, unknown>> = {};
  const rest: Record<string, unknown> = {};

  for (const key in props) {
    if (key in MEDIA_EVENT_PROPS) handlers[key as MediaEventPropName] = props[key];
    else rest[key] = props[key];
  }

  const handlersRef = useLatestRef(handlers);
  // Detach is handled on the `null` call rather than a returned cleanup, which React 18 ignores and warns about; React
  // 19 makes the same call when no cleanup is returned.
  const controllerRef = useRef<AbortController | null>(null);

  const ref = useCallback<RefCallback<EventTarget>>(
    (element) => {
      controllerRef.current?.abort();
      controllerRef.current = null;

      const target = element && (media ?? element);
      if (!target) return;

      const controller = new AbortController();

      controllerRef.current = controller;

      for (const prop of MEDIA_EVENT_PROP_NAMES) {
        const listener = (event: Event) => {
          const handler = handlersRef.current[prop];

          if (isFunction(handler)) handler(event);
        };

        target.addEventListener(MEDIA_EVENT_PROPS[prop], listener, { signal: controller.signal });
      }
    },
    [media, handlersRef]
  );

  return { ref, props: rest as Omit<Props, MediaEventPropName> };
}

/** @internal */
export namespace useMediaEvents {
  export interface Result<Props> {
    /** Ref for the rendered element; compose it ahead of the ref that attaches the media. */
    ref: RefCallback<EventTarget>;
    /** The props left over once the media event handlers are taken out. */
    props: Omit<Props, MediaEventPropName>;
  }
}
