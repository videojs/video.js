/**
 * Cross-renderer selectors that work for both HTML (Web Components) and React.
 *
 * HTML uses custom element tags such as `media-play-button`. React CSS skins use the matching VJSC part classes, while
 * source-owned Tailwind skins retain semantic roles, state attributes, and keyboard shortcuts.
 *
 * Both renderers apply the **same data attributes** for state (`data-paused`, `data-muted`, etc.), which is what tests
 * assert against.
 *
 * Each selector uses a CSS `,` (or) to match either renderer.
 */

/** Toolbar: HTML renders `<media-controls>`, while source skins expose an audio or video controls hook. */
function withinControls(selector: string): string {
  return `media-controls ${selector}, .video-controls ${selector}, .audio-controls ${selector}`;
}

function unchecked(selector: string): string {
  return selector
    .split(',')
    .map((part) => `${part.trim()}[aria-checked="false"]`)
    .join(', ');
}

const menu = '[role="menu"]';
const item = '[role="menuitem"]';
const option = '[role="menuitemradio"]';
const activeSubmenu = `${menu}[data-submenu][data-open]:not([data-ending-style])`;
const playbackRateOptions = `${option}:visible`;

export const SELECTORS = {
  // Player containers
  // HTML: <video-player>, React: wrapper div around VideoSkin
  videoPlayer: 'video-player, .media-skin[data-preset="video"]',
  audioPlayer: 'audio-player, .media-skin[data-preset="audio"]',
  // The visible container with dimensions — used for screenshots
  container: '.media-skin',

  // Controls bar
  controls: 'media-controls-content, .video-controls, .audio-controls',

  // Buttons
  // The control-bar button; skins with centre controls render a second one over the media.
  playButton: ['media-play-button', '.media-play-button', 'button[aria-keyshortcuts~="Space"]']
    .map((selector) => `${selector}:not(.video-controls-center *)`)
    .join(', '),
  centerPlayButton: '.video-controls-center .media-play-button',
  seekBackward: 'media-seek-button[data-direction="backward"], .media-seek-button[data-direction="backward"]',
  seekForward: 'media-seek-button[data-direction="forward"], .media-seek-button[data-direction="forward"]',
  muteButton: 'media-mute-button, .media-mute-button',
  fullscreenButton: 'media-fullscreen-button, .media-fullscreen-button',
  pipButton: 'media-pip-button, .media-pip-button',
  castButton: 'media-cast-button, .media-cast-button',
  airPlayButton: 'media-airplay-button, .media-airplay-button',
  captionsButton: 'media-captions-button, .media-captions-button',
  playbackRateButton: [
    withinControls('media-playback-rate-button'),
    withinControls('.media-playback-rate-button'),
    withinControls('button[aria-haspopup="menu"][aria-label^="Playback rate"]'),
  ].join(', '),
  playbackRateUncheckedOptions: unchecked(playbackRateOptions),
  activeMenuOptions: `${activeSubmenu} ${option}`,
  activeMenuPanel: `${activeSubmenu}.media-menu-content`,
  activeMenuUncheckedOptions: unchecked(`${activeSubmenu} ${option}`),
  settingsButton: [
    withinControls('.media-settings-menu-trigger'),
    withinControls('button[commandfor="settings-menu"]'),
    withinControls('button[aria-label="Settings"]'),
  ].join(', '),
  settingsCaptionsItem: `${item}:has-text("Captions")`,
  settingsSpeedItem: `${item}:has-text("Speed")`,

  // Sliders
  // HTML: <media-time-slider>, React: the generic slider inside a preset-specific time layout.
  timeSlider:
    'media-time-slider, .media-time-slider, .video-time-slider-group .media-slider, .audio-time-slider-group .media-slider',
  volumeSlider: 'media-volume-slider, .media-volume-slider',
  sliderThumb: 'media-slider-thumb, .media-slider-thumb',

  // Display elements
  // HTML uses attribute `type`, React uses `data-type`
  currentTime: 'media-time[type="current"], [data-type="current"].media-time',
  duration: [
    'media-time[type="duration"]',
    'media-time[type="remaining"]',
    'time[data-type="duration"]',
    'time[data-type="remaining"]',
  ].join(', '),
  timeToggle: 'media-time[toggle], time[role="button"][data-type]',
  poster: 'media-poster, .media-poster',
  bufferingIndicator: 'media-buffering-indicator, .media-buffering-indicator',
  thumbnail: 'media-slider-thumbnail, .media-slider-thumbnail-image, [role="img"]:has(> img[aria-hidden="true"])',

  tooltip: 'media-tooltip, .media-tooltip',
  popover: 'media-popover, .media-volume-popover, .media-menu-popup, .media-popover',
  errorDialog: 'media-error-dialog, .media-dialog-popup',

  // Media element — matches all renderer custom elements and native media
  media: 'video, audio, hlsjs-video, hls-video, native-hls-video, dash-video, shaka-video, mux-video, mux-audio',
} as const;

/** Data attributes used for player state (same across both renderers). */
export const DATA_ATTRS = {
  paused: 'data-paused',
  ended: 'data-ended',
  started: 'data-started',
  muted: 'data-muted',
  active: 'data-active',
  fullscreen: 'data-fullscreen',
  pip: 'data-pip',
  visible: 'data-visible',
  dragging: 'data-dragging',
  pointing: 'data-pointing',
  interactive: 'data-interactive',
  seeking: 'data-seeking',
  disabled: 'data-disabled',
  availability: 'data-availability',
  volumeLevel: 'data-volume-level',
  rate: 'data-rate',
  direction: 'data-direction',
  loading: 'data-loading',
  error: 'data-error',
  hidden: 'data-hidden',
  open: 'data-open',
  userActive: 'data-user-active',
} as const;
