export type { BuiltInIndicatorStatus, IndicatorStatus, InputAction, InputIndicatorLabels } from '@videojs/core';
export * from './constants';
// Core
export * from '@videojs/core/dom';
// Media predicates
export {
  type AdapterType,
  hasMetadata,
  isMediaAudioTrackCapable,
  isMediaBufferCapable,
  isMediaErrorCapable,
  isMediaLiveCapable,
  isMediaPauseCapable,
  isMediaPlaybackRateCapable,
  isMediaRemotePlaybackCapable,
  isMediaSeekCapable,
  isMediaSourceCapable,
  isMediaStreamTypeCapable,
  isMediaTextTrackCapable,
  isMediaVideoDimensionsCapable,
  isMediaVideoRenditionCapable,
  isMediaVolumeCapable,
  isQuerySelectorAllCapable,
  type NodeListLike,
  resolveAdapterType,
  resolveMimeType,
} from '@videojs/media';
// Media
export * from '@videojs/media/dom';
// Store
export type { Comparator, Selector } from '@videojs/store';
export { createSelector, shallowEqual } from '@videojs/store';
export { useSelector, useStore } from '@videojs/store/react';
// i18n
export {
  type CreateI18nOptions,
  type CreateI18nResult,
  createI18n,
  createTranslator,
  type FlatTranslations,
  findLocaleKeys,
  getI18nTranslations,
  hasRegisteredLocale,
  I18nContext,
  type I18nContextValue,
  I18nProvider,
  type I18nProviderProps,
  type Locale,
  onI18nRegistryChange,
  registerI18n,
  Text,
  type TextProps,
  type TranslationParams,
  type Translations,
  type Translator,
  useLocale,
  useTranslator,
} from './i18n';
// Media primitives
export { Container, type ContainerProps } from './player/container';
export {
  type PlayerContextValue,
  useContainer,
  useContainerAttach,
  useMedia,
  useMediaAttach,
  useOptionalContainer,
  useOptionalPlayer,
  usePlayer,
  usePlayerContext,
} from './player/context';
// Player API
export {
  type CreatePlayerConfig,
  type CreatePlayerResult,
  createPlayer,
  type PlayerProps,
} from './player/create-player';
// UI
export { AirPlayButton, type AirPlayButtonProps } from './ui/airplay-button/component';
export { AlertDialog } from './ui/alert-dialog';
export {
  type AudioTrackOption,
  type AudioTrackOptionsProps,
  type AudioTrackOptionsResult,
  useAudioTrackOptions,
} from './ui/audio-track';
export { AudioTrackRadioGroupLegacy as AudioTrackRadioGroup } from './ui/audio-track-radio-group';
export { BufferingIndicator, type BufferingIndicatorProps } from './ui/buffering-indicator/component';
export { CaptionsButton, type CaptionsButtonProps } from './ui/captions-button/component';
export {
  CaptionsRadioGroupLegacy as CaptionsRadioGroup,
  type CaptionsOption,
  type CaptionsOptionsProps,
  type CaptionsOptionsResult,
  useCaptionsOptions,
} from './ui/captions-radio-group';
export { CastButton, type CastButtonProps } from './ui/cast-button/component';
export { Controls } from './ui/controls';
export type { ControlsContentProps } from './ui/controls/content';
export type { ControlsGroupProps } from './ui/controls/group';
export type { ControlsRootProps } from './ui/controls/root';
export { Dialog, type DialogContextValue, useDialogContext } from './ui/dialog';
export { ErrorDialog, type ErrorDialogContextValue, useErrorDialogContext } from './ui/error-dialog';
export { FullscreenButton, type FullscreenButtonProps } from './ui/fullscreen-button/component';
export { Gesture, type GestureProps, MediaGesture, type MediaGestureProps } from './ui/gesture/component';
export { type UseDoubleTapGestureOptions, useDoubleTapGesture } from './ui/gesture/use-doubletap-gesture';
export { type UseTapGestureOptions, useTapGesture } from './ui/gesture/use-tap-gesture';
export { useButton } from './ui/hooks/use-button';
export { useSlider } from './ui/hooks/use-slider';
export { Hotkey, type HotkeyProps, MediaHotkey, type MediaHotkeyProps } from './ui/hotkey/component';
export { type UseHotkeyOptions, useHotkey } from './ui/hotkey/use-hotkey';
export { useHotkeyShortcut } from './ui/hotkey/use-hotkey-shortcut';
export { LiveButton, type LiveButtonProps } from './ui/live-button/component';
export { Menu, type MenuContextValue, useMenuContext, useOptionalMenuContext } from './ui/menu';
export { MuteButton, type MuteButtonProps } from './ui/mute-button/component';
export { PiPButton, type PiPButtonProps } from './ui/pip-button/component';
export { PlayButton, type PlayButtonProps } from './ui/play-button/component';
export {
  type PlaybackRateOption,
  type PlaybackRateOptionsProps,
  type PlaybackRateOptionsResult,
  usePlaybackRateOptions,
} from './ui/playback-rate';
export { PlaybackRateButton, type PlaybackRateButtonProps } from './ui/playback-rate-button/component';
export { PlaybackRateRadioGroupLegacy as PlaybackRateRadioGroup } from './ui/playback-rate-radio-group';
export { Popover, type PopoverContextValue, usePopoverContext } from './ui/popover';
export { Poster } from './ui/poster';
export type { PosterImageProps } from './ui/poster/image';
export type { PosterRootProps } from './ui/poster/root';
export {
  type QualityOption,
  type QualityOptionsProps,
  type QualityOptionsResult,
  useQualityOptions,
} from './ui/quality';
export { QualityRadioGroupLegacy as QualityRadioGroup } from './ui/quality-radio-group';
export { SeekButton, type SeekButtonProps } from './ui/seek-button/component';
export { SeekIndicator } from './ui/seek-indicator';
export type { SeekIndicatorRootProps } from './ui/seek-indicator/root';
export type { SeekIndicatorValueProps } from './ui/seek-indicator/value';
export { Slider } from './ui/slider';
export type { SliderBufferProps } from './ui/slider/buffer';
export type { SliderFillProps } from './ui/slider/fill';
export type { SliderRootProps } from './ui/slider/root';
export type { SliderThumbProps } from './ui/slider/thumb';
export type { SliderThumbnailRootProps } from './ui/slider/thumbnail/root';
export type { SliderTrackProps } from './ui/slider/track';
export type { SliderValueProps } from './ui/slider/value';
export { StatusAnnouncer, type StatusAnnouncerProps } from './ui/status-announcer/component';
export { StatusIndicator } from './ui/status-indicator';
export type { StatusIndicatorRootProps } from './ui/status-indicator/root';
export type { StatusIndicatorValueProps } from './ui/status-indicator/value';
export { Thumbnail } from './ui/thumbnail';
export type { ThumbnailImageProps } from './ui/thumbnail/image';
export type { ThumbnailRootProps } from './ui/thumbnail/root';
export { Time } from './ui/time';
export { TimeSlider } from './ui/time-slider';
export type { TimeSliderChapterTitleProps, TimeSliderChapterTitleState } from './ui/time-slider/chapter-title';
export type {
  TimeSliderChapterState,
  TimeSliderChaptersProps,
  TimeSliderChaptersState,
} from './ui/time-slider/chapters';
export { Title } from './ui/title';
export type { TitleProps } from './ui/title/component';
export { Tooltip, type TooltipContent, type TooltipContextValue, useTooltipContext } from './ui/tooltip';
export { VolumeIndicator } from './ui/volume-indicator';
export type { VolumeIndicatorFillProps } from './ui/volume-indicator/fill';
export type { VolumeIndicatorRootProps } from './ui/volume-indicator/root';
export type { VolumeIndicatorValueProps } from './ui/volume-indicator/value';
export { VolumePopover } from './ui/volume-popover';
export { VolumeSlider } from './ui/volume-slider';
// Utilities
export { mergeProps } from './utils/merge-props';
export type { HTMLProps, RenderFunction, RenderProp, UIComponentProps } from './utils/types';
export { useAttachMedia } from './utils/use-attach-media';
export { composeRefs, useComposedRefs } from './utils/use-composed-refs';
export { useDestroy } from './utils/use-destroy';
export { useLatestRef } from './utils/use-latest-ref';
export {
  type MediaEventHandler,
  type MediaEventPropName,
  type MediaEventProps,
  useMediaEvents,
} from './utils/use-media-events';
export { useMediaInstance } from './utils/use-media-instance';

export { renderElement } from './utils/use-render';
export * from './version';
