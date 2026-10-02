// Component state, props, and option types
export type {
  AirPlayButtonProps,
  AirPlayButtonState,
  AlertDialogProps,
  AudioTrackRadioGroupOption,
  AudioTrackRadioGroupProps,
  AudioTrackRadioGroupState,
  BufferingIndicatorProps,
  BufferingIndicatorState,
  BuiltInIndicatorStatus,
  ButtonState,
  CaptionsButtonProps,
  CaptionsButtonState,
  CaptionsRadioGroupOption,
  CaptionsRadioGroupProps,
  CaptionsRadioGroupState,
  CastButtonProps,
  CastButtonState,
  ControlsProps,
  ControlsState,
  ControlsVisibility,
  DeriveCustomStatus,
  DialogProps,
  DialogState,
  FullscreenButtonProps,
  FullscreenButtonState,
  GestureProps,
  HotkeyProps,
  IndicatorCoreProps,
  IndicatorDirection,
  IndicatorLifecycleState,
  IndicatorStatus,
  IndicatorVolumeLevel,
  InputAction,
  InputActionEvent,
  InputActionSource,
  InputIndicatorLabels,
  LiveButtonProps,
  LiveButtonState,
  MediaButtonComponent,
  MediaSnapshot,
  MediaUIComponent,
  MenuInput,
  MenuOptionState,
  MenuProps,
  MenuState,
  MuteButtonProps,
  MuteButtonState,
  PiPButtonProps,
  PiPButtonState,
  PlaybackRateButtonProps,
  PlaybackRateButtonState,
  PlaybackRateRadioGroupOption,
  PlaybackRateRadioGroupProps,
  PlaybackRateRadioGroupState,
  PlayButtonProps,
  PlayButtonState,
  PopoverAlign,
  PopoverBoundary,
  PopoverProps,
  PopoverSide,
  PopoverState,
  PosterState,
  QualityRadioGroupOption,
  QualityRadioGroupProps,
  QualityRadioGroupState,
  RadioOption,
  RadioOptionsState,
  SeekButtonDirection,
  SeekButtonProps,
  SeekButtonState,
  SeekIndicatorProps,
  SeekIndicatorState,
  SliderPreviewProps,
  SliderProps,
  SliderSegmentGeometry,
  SliderSegmentRange,
  SliderSegmentState,
  SliderState,
  StatusAnnouncerLabels,
  StatusAnnouncerProps,
  StatusAnnouncerState,
  StatusDetails,
  StatusIndicatorProps,
  StatusIndicatorState,
  ThumbnailCoords,
  ThumbnailCrossOrigin,
  ThumbnailFetchPriority,
  ThumbnailImage,
  ThumbnailImageProps,
  ThumbnailLoading,
  ThumbnailProps,
  ThumbnailState,
  TimeProps,
  TimeSliderChapterRange,
  TimeSliderProps,
  TimeSliderState,
  TimeState,
  TimeType,
  TitleState,
  TooltipGroupProps,
  TooltipProps,
  TooltipState,
  TransitionFlags,
  TransitionState,
  TransitionStatus,
  UIComponent,
  VolumeIndicatorProps,
  VolumeIndicatorState,
  VolumeLevel,
  VolumePopoverState,
  VolumeSliderProps,
  VolumeSliderState,
} from '@videojs/core';
export type { Text, TextParams, TranslationKey, TranslationOptions } from '@videojs/core/i18n';
// Core
export * from './constants';
export * from '@videojs/core/dom';
export type {
  Destroyable,
  PropertyDeclaration,
  PropertyDeclarationMap,
  PropertyValues,
  ReactiveController,
  ReactiveControllerHost,
} from '@videojs/element';
// Element — reactive primitives for users extending UIElement
export { DestroyMixin, ReactiveElement } from '@videojs/element';
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
  MediaError,
  type NodeListLike,
  resolveAdapterType,
  resolveMimeType,
} from '@videojs/media';
// Media types
export type {
  AudioRenditionLike,
  AudioRenditionListLike,
  AudioTrackLike,
  AudioTrackListLike,
  CanPlayTypeResult,
  CommonMedia,
  CommonMediaEvents,
  EngineAdapter,
  ErrorLike,
  EventLike,
  EventTargetLike,
  MediaAudioRenditionCapability,
  MediaAudioTrack,
  MediaAudioTrackCapability,
  MediaAudioTrackState,
  MediaAutoplayCapability,
  MediaBufferCapability,
  MediaBufferEvents,
  MediaBufferState,
  MediaContentData,
  MediaContentDataCapability,
  MediaContentDataEvents,
  MediaContentValue,
  MediaControlsCapability,
  MediaControlsState,
  MediaErrorCapability,
  MediaErrorEvents,
  MediaErrorState,
  MediaEvents,
  MediaFullscreenCapability,
  MediaFullscreenState,
  MediaLiveCapability,
  MediaLiveEvents,
  MediaLiveState,
  MediaMetadataState,
  MediaPauseCapability,
  MediaPauseEvents,
  MediaPictureInPictureCapability,
  MediaPictureInPictureEvents,
  MediaPictureInPictureState,
  MediaPlaybackCapability,
  MediaPlaybackEvents,
  MediaPlaybackRateCapability,
  MediaPlaybackRateEvents,
  MediaPlaybackRateState,
  MediaPlaybackState,
  MediaPlayedCapability,
  MediaPlaysInlineCapability,
  MediaPosterCapability,
  MediaPreloadType,
  MediaQualityState,
  MediaReadyStateValue,
  MediaRemotePlaybackCapability,
  MediaRemotePlaybackState,
  MediaResolution,
  MediaSeekCapability,
  MediaSeekEvents,
  MediaSourceCapability,
  MediaSourceEvents,
  MediaSourceState,
  MediaStreamType,
  MediaStreamTypeCapability,
  MediaStreamTypeEvents,
  MediaStreamTypeState,
  MediaTargetLike,
  MediaTextCue,
  MediaTextTrack,
  MediaTextTrackCapability,
  MediaTextTrackState,
  MediaThumbnailsTrack,
  MediaTimeState,
  MediaVideoDimensionsCapability,
  MediaVideoDimensionsEvents,
  MediaVideoRendition,
  MediaVideoRenditionCapability,
  MediaVideoTrackCapability,
  MediaVolumeCapability,
  MediaVolumeEvents,
  MediaVolumeState,
  RemotePlaybackConnectionState,
  RemotePlaybackEvents,
  RemotePlaybackLike,
  TextCueLike,
  TextCueListLike,
  TextTrackKind,
  TextTrackLike,
  TextTrackListEvents,
  TextTrackListLike,
  TextTrackMode,
  TimeRangeLike,
  Video,
  VideoEvents,
  VideoRenditionLike,
  VideoRenditionListLike,
  VideoTargetLike,
  VideoTrackLike,
  VideoTrackListLike,
} from '@videojs/media';
// Media
export * from '@videojs/media/dom';
export type { WithMediaTracks } from '@videojs/media/media-tracks';
// The declaration bundler needs this explicit export for media component subpaths to reference the type.
export type { CustomMediaConstructor } from '@videojs/media/dom';
// Store
export type { Comparator, Selector } from '@videojs/store';
export { createSelector, shallowEqual } from '@videojs/store';
export type {
  CreateI18nOptions,
  CreateI18nResult,
  FlatTranslations,
  I18nContextValue,
  Locale,
  TranslationParams,
  Translations,
  Translator,
} from './i18n';
export {
  createI18n,
  createTranslator,
  findLocaleKeys,
  getI18nTranslations,
  hasRegisteredLocale,
  I18nController,
  I18nProviderMixin,
  I18nTextMixin,
  MediaI18nProviderElement,
  MediaTextElement,
  onI18nRegistryChange,
  registerI18n,
  resolvePlayerLocale,
  resolveProviderLocale,
  translateText,
} from './i18n';
export type { I18nContext as I18nLitContext } from './i18n/context';
// i18n — `@videojs/html/i18n` registers `<media-i18n>` / `<media-text>`.
export { i18nContext } from './i18n/context';
// Player
export * from './player/context';
export * from './player/create-player';
export { PlayerController, type PlayerControllerHost } from './player/controller';
export * from './store/media-attach-mixin';
export * from './store/types';
export { AirPlayButtonElement } from './ui/airplay-button/element';
export { AlertDialogElement } from './ui/alert-dialog/element';
// UI Components
export { AudioTrackRadioGroupElement } from './ui/audio-track-radio-group/element';
export { BufferingIndicatorElement } from './ui/buffering-indicator/element';
export { CaptionsButtonElement } from './ui/captions-button/element';
export { CaptionsRadioGroupElement } from './ui/captions-radio-group/element';
export { CastButtonElement } from './ui/cast-button/element';
export { ContainerElement } from './ui/container/element';
export { ContextPartElement, type PartContextValue } from './ui/context-part-element';
export { ControlsBackdropElement } from './ui/controls/backdrop';
export { ControlsContentElement } from './ui/controls/content';
export { ControlsElement } from './ui/controls/element';
export { ControlsGroupElement } from './ui/controls/group';
export { type DialogContextValue, dialogContext } from './ui/dialog/context';
export { DialogBackdropElement } from './ui/dialog/backdrop';
export { DialogCloseElement } from './ui/dialog/close';
export { DialogDescriptionElement } from './ui/dialog/description';
export { DialogElement } from './ui/dialog/element';
export { DialogPopupElement } from './ui/dialog/popup';
export { DialogTitleElement } from './ui/dialog/title';
export { ErrorDialogElement } from './ui/error-dialog/element';
export { FullscreenButtonElement } from './ui/fullscreen-button/element';
export { GestureElement } from './ui/gesture/element';
export { AriaKeyShortcutsController } from './ui/hotkey/aria-key-shortcuts-controller';
export { HotkeyElement } from './ui/hotkey/element';
export { LiveButtonElement } from './ui/live-button/element';
export { MediaButtonElement } from './ui/media-button-element';
export { MediaUIElement } from './ui/media-ui-element';
export {
  type MenuContextValue,
  type MenuGroupContextValue,
  type MenuRadioGroupContextValue,
  menuContext,
  menuGroupContext,
  menuRadioGroupContext,
} from './ui/menu/context';
export { MenuCheckboxItemElement } from './ui/menu/checkbox-item';
export { MenuContentElement } from './ui/menu/content';
export { MenuElement } from './ui/menu/element';
export { MenuGroupElement } from './ui/menu/group';
export { MenuGroupLabelElement } from './ui/menu/group-label';
export { MenuItemElement } from './ui/menu/item';
export { MenuItemIndicatorElement } from './ui/menu/item-indicator';
export { MenuRadioGroupElement } from './ui/menu/radio-group';
export { MenuRadioItemElement } from './ui/menu/radio-item';
export { MenuSeparatorElement } from './ui/menu/separator';
export { MuteButtonElement } from './ui/mute-button/element';
export { PiPButtonElement } from './ui/pip-button/element';
export { PlayButtonElement } from './ui/play-button/element';
export { PlaybackRateButtonElement } from './ui/playback-rate-button/element';
export { PlaybackRateRadioGroupElement } from './ui/playback-rate-radio-group/element';
export { PopoverElement } from './ui/popover/element';
export { PosterElement } from './ui/poster/element';
export { QualityRadioGroupElement } from './ui/quality-radio-group/element';
export { SeekButtonElement } from './ui/seek-button/element';
export { SeekIndicatorElement } from './ui/seek-indicator/element';
export { SeekIndicatorValueElement } from './ui/seek-indicator/value';
export { type SliderContextValue, sliderContext } from './ui/slider/context';
export { SliderBufferElement } from './ui/slider/buffer';
export { SliderElement } from './ui/slider/element';
export type { SliderEventMap, SliderValueEventDetail } from './ui/slider/events';
export { SliderFillElement } from './ui/slider/fill';
export { SliderPreviewElement } from './ui/slider/preview';
export { SliderThumbElement } from './ui/slider/thumb';
export { SliderThumbnailElement } from './ui/slider/thumbnail';
export { SliderTrackElement } from './ui/slider/track';
export { SliderValueElement } from './ui/slider/value';
export { StatusAnnouncerElement } from './ui/status-announcer/element';
export { StatusIndicatorElement } from './ui/status-indicator/element';
export { StatusIndicatorValueElement } from './ui/status-indicator/value';
export { ThumbnailElement } from './ui/thumbnail/element';
export { TimeElement } from './ui/time/element';
export { TimeGroupElement } from './ui/time/group';
export { TimeSeparatorElement } from './ui/time/separator';
export { TimeSliderChapterTitleElement } from './ui/time-slider/chapter-title';
export { TimeSliderChaptersElement } from './ui/time-slider/chapters';
export { TimeSliderElement } from './ui/time-slider/element';
export { TitleElement } from './ui/title/element';
export { tooltipGroupContext } from './ui/tooltip/context';
export { TooltipElement } from './ui/tooltip/element';
export { TooltipGroupElement } from './ui/tooltip/group';
export { TooltipLabelElement } from './ui/tooltip/label';
export { TooltipShortcutElement } from './ui/tooltip/shortcut';
// Primitives
export * from './ui/ui-element';
export { VolumeIndicatorElement } from './ui/volume-indicator/element';
export { VolumeIndicatorFillElement } from './ui/volume-indicator/fill';
export { VolumeIndicatorValueElement } from './ui/volume-indicator/value';
export { VolumePopoverElement } from './ui/volume-popover/element';
export { VolumeSliderElement } from './ui/volume-slider/element';
export * from './version';
