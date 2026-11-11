import type {
  EventLike,
  Media,
  MediaBufferCapability,
  MediaBufferEvents,
  MediaContentDataCapability,
  MediaContentDataEvents,
  MediaErrorCapability,
  MediaErrorEvents,
  MediaEvents,
  MediaPauseCapability,
  MediaPauseEvents,
  MediaPlaybackRateCapability,
  MediaPlaybackRateEvents,
  MediaSeekCapability,
  MediaSeekEvents,
  MediaSourceEvents,
} from '@videojs/media';

// ----------------------------------------
//  Native-App Media Capabilities
//
//  Design note: The react-native package defines its own composed capabilities,
//  rather than using, eg, MediaTargetLike, VideoTargetLike, etc
//
//  Partly, this is due to the PoC implementation, which only implements a few
//  capabilities, and partly this is because native-app environments might present
//  opportunities for unique capabilities around app backgrounding, audio focus,
//  native chrome, etc.
//
//  Which of the capabilities defined here actually make it into a final release is TBD,
//  as this project is early and mostly exploratory for now
// ----------------------------------------

export interface NativeEvents
  extends
    MediaEvents,
    MediaPauseEvents,
    MediaSeekEvents,
    MediaSourceEvents,
    MediaBufferEvents,
    MediaErrorEvents,
    MediaPlaybackRateEvents,
    MediaContentDataEvents {}

export interface NativeMedia<Events extends { [K in keyof Events]: EventLike } = NativeEvents>
  extends
    Media<Events>,
    MediaPauseCapability,
    MediaSeekCapability,
    MediaBufferCapability,
    MediaErrorCapability,
    MediaPlaybackRateCapability,
    MediaContentDataCapability {}
