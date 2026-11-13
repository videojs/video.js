'use client';

import {
  applyPreferPlayback,
  findLazyMedia,
  type LazyMediaMatcher,
  type LazyMediaSource,
  type Media,
  type NativeHlsSupport,
  type PreferPlaybackTarget,
  resolveLazySource,
} from '@videojs/media';
import { nativeHlsSupport } from '@videojs/utils/dom';
import { noop } from '@videojs/utils/function';
import {
  type ComponentType,
  type ForwardRefExoticComponent,
  forwardRef,
  lazy,
  type PropsWithoutRef,
  type ReactNode,
  type RefAttributes,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import { useComposedRefs } from '../utils/use-composed-refs';
import type { MediaRefProps } from '../utils/use-media-ref';

/**
 * Props shared by `LazyVideo` and `LazyAudio`.
 *
 * @experimental
 */
export interface LazyMediaProps extends MediaRefProps<Media> {
  /** Source URL. Its host or file extension decides which media component plays it. Ignored when `source` is given. */
  src?: string | undefined;
  /**
   * MIME type of the source, such as `video/mp4` or `application/x-mpegurl`. Takes precedence over the file extension,
   * so signed or extensionless URLs still resolve. It only chooses the media component and isn't passed on. Ignored
   * when `source` is given.
   */
  type?: string | undefined;
  /**
   * Structured source, in place of `src` and `type`. Its `src`, `type`, or an id such as a Mux `playbackId` or a Wistia
   * `mediaId` decides which media component plays it, and the component takes the whole object as its `source`. A
   * native `<video>` or `<audio>` takes only its `src`. Keep the object stable across renders; a new one reloads the
   * media.
   */
  source?: LazyMediaSource | null | undefined;
  /**
   * Playback path for HLS: `'native'` uses the browser's own HLS support wherever it has one, and `'mse'` always loads
   * an engine. Unset, HLS plays through an engine wherever there's MSE, and natively only where there's none. Also
   * passed on to the hls.js and Mux media, on their `source`.
   */
  preferPlayback?: 'native' | 'mse' | undefined;
  /**
   * How much the resolved media loads before playback.
   *
   * @default 'none'
   */
  preload?: 'none' | 'metadata' | 'auto' | '' | undefined;
  /** Fallback content for media that render a `<video>` or `<audio>`; embeds ignore it. */
  fallback?: ReactNode;
}

/**
 * A media `LazyVideo` or `LazyAudio` can render: which sources it plays, and the component that plays them.
 *
 * Give `component` for a component that's cheap to ship up front, or `load` for one whose code should only download
 * once a source needs it.
 */
export type LazyMediaDefinition = LazyMediaMatcher & {
  /** Whether the component renders `fallback` content inside a `<video>` or `<audio>`. */
  fallback?: boolean | undefined;
  /** Whether the media takes `preferPlayback` on its `source`, as `HlsJsVideo` and `MuxVideo` do. */
  preferPlayback?: boolean | undefined;
  /** Whether the component takes a structured `source` prop. Without it, a `source` reaches the component as `src`. */
  source?: boolean | undefined;
} & ({ component: ComponentType<any>; load?: never } | { load: () => Promise<ComponentType<any>>; component?: never });

/**
 * Create a lazy media component from its media, tried in order. Call it at module level, so the components it loads
 * keep their identity across renders; creating one during render would remount the media.
 *
 * @internal
 */
export function createLazyMedia<Element, Props extends LazyMediaProps>(
  name: string,
  medias: readonly LazyMediaDefinition[]
): ForwardRefExoticComponent<PropsWithoutRef<Props> & RefAttributes<Element>> {
  const components = new Map<LazyMediaDefinition, ComponentType<any>>();

  for (const media of medias) {
    components.set(media, media.component ?? lazy(() => media.load!().then((component) => ({ default: component }))));
  }

  const LazyMedia = forwardRef<Element, LazyMediaProps>(function LazyMedia(
    { src = '', type, source, preferPlayback, preload = 'none', fallback, mediaRef, ...props },
    ref
  ) {
    // Resolving a source is cheaper than memoizing it, and the compiler's cache is most of this component's size.
    'use no memo';

    const nativeHls = useSyncExternalStore(subscribe, getNativeHls, getServerNativeHls);
    const sourcePreferPlayback = toPreferPlayback(source?.preferPlayback);
    const playback = preferPlayback ?? sourcePreferPlayback;
    const media = findLazyMedia(medias, resolveLazySource(src, { type, preferPlayback: playback, nativeHls, source }));
    const reportedSrc = source ? (source.src ?? '') : src;
    const unresolved = !!(source ?? src) && media === null;
    // `preferPlayback` given here goes on the media's `source` with the rest of it, so a new `source` keeps it.
    const mediaSource = useMemo(
      () =>
        source && media?.preferPlayback && preferPlayback && preferPlayback !== sourcePreferPlayback
          ? { ...source, preferPlayback }
          : source,
      [source, media, preferPlayback, sourcePreferPlayback]
    );

    // The media's ref runs after its `src` is set and before the load that queues, so the engine is built for the
    // preferred path.
    const forwardPreferPlayback = useCallback(
      (target: Media | null) => {
        // SAFETY: a definition marked `preferPlayback` renders a media with a structured `source`.
        if (target && media?.preferPlayback) applyPreferPlayback(target as unknown as PreferPlaybackTarget, playback);
      },
      [media, playback]
    );
    const composedMediaRef = useComposedRefs(mediaRef, forwardPreferPlayback);

    useEffect(() => {
      if (__DEV__ && unresolved) reportUnresolvedSource(name, reportedSrc);
    }, [reportedSrc, unresolved]);

    if (!media) return null;

    // Each media takes the props it understands; their prop types have no common shape to check against.
    const Media = components.get(media)!;
    const fallbackProps = fallback !== undefined && media.fallback ? { fallback } : null;
    // Only media that take it, and those given one, see `mediaRef`; a custom component may spread props onto the DOM.
    const mediaRefProps = media.preferPlayback ? { mediaRef: composedMediaRef } : mediaRef ? { mediaRef } : null;
    // Only one of `src` and `source` is passed, so a `src` synced after it can't replace the structured source.
    const sourceProps = !source ? { src } : media.source ? { source: mediaSource } : { src: source.src };

    return (
      <Suspense fallback={null}>
        <Media ref={ref} {...props} {...mediaRefProps} {...fallbackProps} {...sourceProps} preload={preload} />
      </Suspense>
    );
  });

  if (__DEV__) LazyMedia.displayName = name;

  return LazyMedia as unknown as ForwardRefExoticComponent<PropsWithoutRef<Props> & RefAttributes<Element>>;
}

function toPreferPlayback(value: unknown): 'native' | 'mse' | undefined {
  return value === 'native' || value === 'mse' ? value : undefined;
}

let nativeHls: NativeHlsSupport | undefined;

function subscribe() {
  return noop;
}

function getNativeHls() {
  nativeHls ??= nativeHlsSupport();

  return nativeHls;
}

// `undefined` while server rendering and hydrating, so the server and the first client render agree.
function getServerNativeHls() {
  return undefined;
}

// So a developer knows to pass `type` or pick a media component.
function reportUnresolvedSource(name: string, src: string) {
  console.error(
    `[${name}] No media plays "${src}". If the URL has no file extension, pass its MIME type as \`type\`, or render ` +
      `the media component for it. Supported sources: ${LAZY_MEDIA_DOCS_URL}`
  );
}

const LAZY_MEDIA_DOCS_URL = 'https://videojs.org/docs/framework/react/reference/components/lazy-video';
