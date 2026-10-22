'use client';

import { prefersNativeHls } from '@videojs/utils/dom';
import { noop } from '@videojs/utils/function';
import { type ComponentType, type LazyExoticComponent, lazy, useEffect, useSyncExternalStore } from 'react';

/**
 * Props shared by `LazyVideo` and `LazyAudio`.
 *
 * @experimental
 */
export interface LazyMediaProps {
  /** Source URL. Its host or file extension decides which media component plays it. */
  src?: string | undefined;
  /**
   * MIME type of the source, such as `video/mp4` or `application/x-mpegurl`. Takes precedence over the file extension,
   * so signed or extensionless URLs still resolve. It only chooses the media component and isn't passed on.
   */
  type?: string | undefined;
  /**
   * Playback path for HLS. `'native'` uses the browser's own HLS support on Safari and wherever there is no MSE, and
   * loads an engine elsewhere. `'mse'` always loads an engine.
   *
   * @default 'native'
   */
  preferPlayback?: 'native' | 'mse' | undefined;
  /**
   * How much the resolved media loads before playback.
   *
   * @default 'none'
   */
  preload?: 'none' | 'metadata' | 'auto' | '' | undefined;
}

let nativeHls: boolean | undefined;

/**
 * A lazy component for one export of a media module. Call it at module level, so the component keeps its identity
 * across renders; deriving one during render would remount the media.
 *
 * @internal
 */
export function lazyMedia<Module>(
  load: () => Promise<Module>,
  name: keyof Module
): LazyExoticComponent<ComponentType<any>> {
  return lazy(() => load().then((module) => ({ default: module[name] as ComponentType<any> })));
}

/**
 * Whether HLS plays natively by default here. `undefined` while server rendering and hydrating, so the server and the
 * first client render agree, then the probed value.
 *
 * @internal
 */
export function useNativeHls(): boolean | undefined {
  return useSyncExternalStore(subscribe, getNativeHls, getServerNativeHls);
}

/**
 * Reports a source that no supported media plays, so the developer knows to pass `type` or pick a media component.
 *
 * @internal
 */
export function useUnresolvedSourceError(name: string, src: string, resolved: string | null | undefined): void {
  const unresolved = !!src && resolved === null;

  useEffect(() => {
    if (__DEV__ && unresolved) {
      console.error(
        `[${name}] No media plays "${src}". If the URL has no file extension, pass its MIME type as \`type\`, or render ` +
          `the media component for it. Supported sources: ${LAZY_MEDIA_DOCS_URL}`
      );
    }
  }, [name, src, unresolved]);
}

const LAZY_MEDIA_DOCS_URL = 'https://videojs.org/docs/framework/react/reference/components/lazy-video';

function subscribe() {
  return noop;
}

function getNativeHls() {
  nativeHls ??= prefersNativeHls();

  return nativeHls;
}

function getServerNativeHls() {
  return undefined;
}
