// The type only. `toEngineHandle` stays internal on purpose — exporting a blessed `number` -> handle
// cast would hand consumers the escape hatch the brand exists to close.
export type { NativeEngineHandle } from './media/engine-store';
export type { NativeEvents, NativeMedia } from './media/native-capability';
export { type PlayerSurface, PlayerSurfaceHost } from './media/player-surface-host';
export {
  type NativePlaybackState,
  ReactNativeMedia,
  type ReactNativeMediaProps,
  reactNativeMediaDefaultProps,
  resolveNativeEvent,
} from './media/react-native-media';
export { Video, type VideoProps } from './media/video';
export { Player, type PlayerStatus } from './player';
export { Container, type ContainerProps } from './player/container';
export type { NativePlayerContextValue } from './player/context';
export {
  type AnyNativeFeature,
  type AnyNativePlayerStore,
  createPlayer,
  type CreatePlayerConfig,
  type CreatePlayerResult,
  type NativePlayerStore,
  type PlayerProps,
  type UsePlayerHook,
} from './player/create-player';
// `usePlayer` and `useMedia` come from the preset, not `./player/context` — the factory's are typed
// against the composed features, while the context pair is untyped and stays internal.
export { nativeVideoFeatures, useMedia, usePlayer, VideoPlayer, type VideoPlayerProps } from './player/video-player';
export { VideoSkin, type VideoSkinProps } from './skins/video-skin';
export type { NativePlayerTarget } from './store/native-player-target';
export { nativePlaybackFeature, selectNativePlayback } from './store/playback';
export { PlayButton, type PlayButtonProps } from './ui/play-button';
