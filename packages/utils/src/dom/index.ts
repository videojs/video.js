export { animationFrame } from './animation-frame';
export {
  type AttributeSnapshot,
  type AttributeSnapshotEntry,
  namedNodeMapToObject,
  restoreAttributes,
  serializeAttributes,
  snapshotAttributes,
} from './attributes';
export {
  type ElementPredicate,
  type ElementTypePredicate,
  findComposedElement,
  findElementChild,
  followElementPath,
  getComposedChildren,
  getElementChildren,
} from './children';
export { getDevicePixelRatio, watchDevicePixelRatio } from './device-pixel-ratio';
export { isRTL } from './direction';
export { type OnEventOptions, onEvent, resolveEventTarget } from './event';
export { getDeepActiveElement, getTabbableElements } from './focus';
export { idleCallback } from './idle-callback';
export {
  EDITABLE_SELECTOR,
  INTERACTIVE_SELECTOR,
  isEditableElement,
  isEditableTarget,
  isInteractiveActivation,
  isInteractiveTarget,
} from './interactive';
export {
  type ChildMeasurement,
  type ElementOverflowMeasurement,
  type ElementSize,
  type ElementSizeBox,
  type GetElementSizeOptions,
  getBlockExtent,
  getElementPadding,
  getElementSize,
  getInlineExtent,
  isPointInElement,
  type LogicalBoxEdges,
  type MeasureElementChildrenOptions,
  type MeasureElementOptions,
  measureElement,
  measureElementChildren,
} from './layout';
export { listen } from './listen';
export { effectiveLocale } from './locale/effective-locale';
export { findNearestLang, findNearestLang as nearestLang } from './locale/find-nearest-lang';
export { mergeLocaleOverlays } from './locale/merge-locale-overlays';
export { resolveLangAttr } from './locale/resolve-lang-attr';
export { subscribeAmbientLang } from './locale/subscribe-ambient-lang';
export {
  type ObservedElements,
  type ObserveElementsOptions,
  observeElementSize,
  observeElements,
  observeRenderedSize,
  observeResize,
  type RenderedSize,
} from './observe-elements';
export { isMacOS } from './platform';
export {
  getPositionedSide,
  type PositionSide,
  type PositionSideOffsets,
  type PositionSideOptions,
  tryHidePopover,
  tryShowPopover,
} from './popover';
export {
  isDocument,
  isHTMLAudioElement,
  isHTMLImageElement,
  isHTMLMediaElement,
  isHTMLVideoElement,
  isShadowRoot,
} from './predicates';
export { type RafThrottled, rafThrottle } from './raf-throttle';
export { loadScript } from './script';
export { applyShadowStyles, createShadowStyle, ensureGlobalStyle, type ShadowStyle } from './shadow-styles';
export { getSlottedElement, querySlot } from './slotted';
export {
  addAnchorName,
  applyStyles,
  getAnchorNames,
  type InlineStyleSnapshot,
  type InlineStyleSnapshotEntry,
  type ReadCSSLengthOptions,
  readCSSLength,
  resolveCSSLength,
  restoreInlineStyles,
  snapshotInlineStyles,
  withInlineStyles,
} from './style';
export {
  supportsAnchorPositioning,
  supportsAnimationFrame,
  supportsConstructableStyleSheets,
  supportsIdleCallback,
  supportsPopoverAPI,
} from './supports';
export { cloneTemplateRoot, createTemplate, getTemplateElement, getTemplateRoot, renderTemplate } from './template';
export {
  type CaptionOrSubtitleKind,
  findTrackElement,
  getCaptionOrSubtitleTracks,
  getTextTrackList,
  isCaptionOrSubtitleTrack,
} from './text-track';
export { serializeTimeRanges } from './time-ranges';
export { containsComposed } from './tree';
export type { CustomElement, CustomElementCallbacks } from './types';
export { type WalkAncestorsOptions, walkAncestors } from './walk-ancestors';
export {
  isWebKitAirPlayCapable,
  supportsWebKitAirPlay,
  type WebKitDocument,
  type WebKitFullscreenElement,
  type WebKitPresentationMode,
  type WebKitVideoElement,
  type WebkitAvailabilityEvent,
} from './webkit';
