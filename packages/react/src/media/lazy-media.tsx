'use client';

import {
  findLazyMedia,
  type LazyMediaMatcher,
  type Media,
  type NativeHlsSupport,
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
  useEffect,
  useSyncExternalStore,
} from 'react';

import type { MediaRefProps } from '../utils/use-media-ref';

/**
 * Props shared by `LazyVideo` and `LazyAudio`.
 *
 * @experimental
 */
export interface LazyMediaProps extends MediaRefProps<Media> {
  /** Source URL. Its host or file extension decides which media component plays it. */
  src?: string | undefined;
  /**
   * MIME type of the source, such as `video/mp4` or `application/x-mpegurl`. Takes precedence over the file extension,
   * so signed or extensionless URLs still resolve. It only chooses the media component and isn't passed on.
   */
  type?: string | undefined;
  /**
   * Playback path for HLS: `'native'` uses the browser's own HLS support wherever it has one, and `'mse'` always loads
   * an engine. Unset, HLS plays natively on Safari and wherever there's no MSE, and through an engine elsewhere.
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
    { src = '', type, preferPlayback, preload = 'none', fallback, ...props },
    ref
  ) {
    // Resolving a source is cheaper than memoizing it, and the compiler's cache is most of this component's size.
    'use no memo';

    const nativeHls = useSyncExternalStore(subscribe, getNativeHls, getServerNativeHls);
    const media = findLazyMedia(medias, resolveLazySource(src, { type, preferPlayback, nativeHls }));
    const unresolved = !!src && media === null;

    useEffect(() => {
      if (__DEV__ && unresolved) reportUnresolvedSource(name, src);
    }, [src, unresolved]);

    if (!media) return null;

    // Each media takes the props it understands; their prop types have no common shape to check against.
    const Media = components.get(media)!;
    const fallbackProps = fallback !== undefined && media.fallback ? { fallback } : null;

    return (
      <Suspense fallback={null}>
        <Media ref={ref} {...props} {...fallbackProps} src={src} preload={preload} />
      </Suspense>
    );
  });

  if (__DEV__) LazyMedia.displayName = name;

  return LazyMedia as unknown as ForwardRefExoticComponent<PropsWithoutRef<Props> & RefAttributes<Element>>;
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
