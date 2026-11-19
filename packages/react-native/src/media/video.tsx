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
   * Strictly enforced because the underlying native view can't host children
   */
  children?: never;
}

/**
 * A video surface backed by a `ReactNativeMedia` adapter, which can come from either a `<VideoPlayer>` or can be owned
 * by this component, depending on the context
 *
 * Composes the same hooks as the web media components: own the adapter, bind the surface, split props into adapter
 * writes versus view passthrough.
 *
 * The ref exposes the **adapter**, not the native view. This differs from web because the native view is just a window
 * onto the player, not like an HTMLMediaElement that is itself a player.
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
