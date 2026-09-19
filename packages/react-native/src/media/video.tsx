import { isNull } from '@videojs/utils/predicate';
import { forwardRef, useImperativeHandle } from 'react';
import type { ViewProps } from 'react-native';

import NativePlayerView from '../PlayerViewNativeComponent';
import { useAttachMedia } from '../utils/use-attach-media';
import { useMediaInstance } from '../utils/use-media-instance';
import { useSyncProps } from '../utils/use-sync-props';
import { ReactNativeMedia, type ReactNativeMediaProps, reactNativeMediaDefaultProps } from './react-native-media';

export interface VideoProps
  extends Omit<ViewProps, keyof ReactNativeMediaProps | 'children'>, Partial<ReactNativeMediaProps> {
  /**
   * `<Video>` is a single native surface and cannot host children. Chrome sits beside it inside the container, not
   * within it.
   *
   * Enforced rather than documented because the platforms disagree: iOS mounts children into the `AVPlayerLayer`-backed
   * content view, while Android registers this component through `SimpleViewManager` (a leaf base) over a `FrameLayout`
   * whose `SurfaceView` child is invisible to RN's mounting layer. Allowing children would be silently asymmetric.
   */
  children?: never;
}

/**
 * A video surface backed by a `ReactNativeMedia` adapter it owns.
 *
 * Composes the same hooks as the web media components: own the adapter, bind the surface, split props into adapter
 * writes versus view passthrough.
 *
 * The ref exposes the **adapter**, not the native view. On the web a media component's ref is an `HTMLMediaElement`,
 * which is itself the control surface; RN splits control from rendering, so handing back the Fabric view would give
 * callers something with no `play`/`pause` on it. Until the store is wired up this ref is the only way to drive
 * playback.
 */
// Rest-spread rather than a bare `props`: useSyncProps needs an index
// signature, which an anonymous object type has and a declared interface
// doesn't.
export const Video = forwardRef<ReactNativeMedia, VideoProps>(function Video({ ...props }, ref) {
  const media = useMediaInstance(ReactNativeMedia);
  const attachRef = useAttachMedia(media);
  const viewProps = useSyncProps(media, props, reactNativeMediaDefaultProps);

  useImperativeHandle(ref, () => media, [media]);

  // Only null once the adapter has been destroyed, at which point there is no
  // player to render — matching how the surface renders nothing before a
  // handle exists.
  if (isNull(media.handle)) return null;

  return <NativePlayerView ref={attachRef} playerHandle={media.handle} {...viewProps} />;
});

export namespace Video {
  export type Props = VideoProps;
}
