export type CssVarKind = 'public' | 'runtime' | 'internal';

export interface CssVar {
  /** Consumer customization, cross-runtime contract, or Skin implementation detail. */
  kind: CssVarKind;
  description: string;
}

/** Classification for every `--media-*` custom property used by a Skin. */
export const vars = {
  '--media-accent-color': {
    kind: 'public',
    description: 'Accent color used by highlighted controls, menu items, slider fills, and primary actions.',
  },
  '--media-accent-text-color': {
    kind: 'public',
    description: 'Optional foreground color rendered on the configured accent color.',
  },
  '--media-border-color': {
    kind: 'public',
    description: 'Player hairline border color.',
  },
  '--media-border-radius': {
    kind: 'public',
    description: 'Outer player border radius.',
  },
  '--media-font-family': {
    kind: 'public',
    description: 'Font family used by the player interface.',
  },
  '--media-object-fit': {
    kind: 'public',
    description: 'Media and poster object-fit value.',
  },
  '--media-object-position': {
    kind: 'public',
    description: 'Media and poster object-position value.',
  },
  '--media-scale-unit': {
    kind: 'public',
    description: 'Base length used to scale fullscreen controls independently of the document root font size.',
  },
  '--media-chapter-inset-end': {
    kind: 'internal',
    description: 'End inset for a time-slider chapter segment.',
  },
  '--media-chapter-inset-start': {
    kind: 'internal',
    description: 'Start inset for a time-slider chapter segment.',
  },
  '--media-control-radius': {
    kind: 'internal',
    description: 'Theme control radius.',
  },
  '--media-control-size': {
    kind: 'internal',
    description: 'Theme control size.',
  },
  '--media-controls-radius': {
    kind: 'internal',
    description: 'Theme corner radius of the controls surface.',
  },
  '--media-control-corner-shape': {
    kind: 'internal',
    description: 'Theme control corner treatment.',
  },
  '--media-background': {
    kind: 'internal',
    description: 'Scoped Skin background color.',
  },
  '--media-foreground': {
    kind: 'internal',
    description: 'Scoped Skin foreground color.',
  },
  '--media-controls': {
    kind: 'internal',
    description: 'Scoped controls surface color.',
  },
  '--media-controls-foreground': {
    kind: 'internal',
    description: 'Scoped controls foreground color.',
  },
  '--media-popover': {
    kind: 'internal',
    description: 'Scoped popup surface color.',
  },
  '--media-popover-foreground': {
    kind: 'internal',
    description: 'Scoped popup foreground color.',
  },
  '--media-primary': {
    kind: 'internal',
    description: 'Resolved primary color for active controls and slider fills.',
  },
  '--media-primary-foreground': {
    kind: 'internal',
    description: 'Resolved foreground color rendered on the primary color.',
  },
  '--media-accent': {
    kind: 'internal',
    description: 'Scoped hover and highlighted-item color.',
  },
  '--media-accent-foreground': {
    kind: 'internal',
    description: 'Scoped foreground color rendered on the accent color.',
  },
  '--media-muted': {
    kind: 'internal',
    description: 'Scoped muted surface color.',
  },
  '--media-muted-foreground': {
    kind: 'internal',
    description: 'Scoped muted foreground color.',
  },
  '--media-border': {
    kind: 'internal',
    description: 'Scoped border color.',
  },
  '--media-ring': {
    kind: 'internal',
    description: 'Scoped focus-ring color, contrast-aware per preset and forced-colors mode.',
  },
  '--media-shadow-surface': {
    kind: 'internal',
    description: 'Scoped small surface shadow.',
  },
  '--media-surface-border': {
    kind: 'internal',
    description: 'Scoped surface hairline color.',
  },
  '--media-caption-controls-y': {
    kind: 'internal',
    description: 'Caption offset while controls are visible.',
  },
  '--media-default-accent-color': {
    kind: 'internal',
    description: 'Skin fallback used when the public accent color is not configured.',
  },
  '--media-default-accent-text-color': {
    kind: 'internal',
    description: 'Skin text color on the default accent, used where `contrast-color()` is unsupported.',
  },
  '--media-internal-accent-text-fallback': {
    kind: 'internal',
    description: 'Theme color used to derive legible accent text when no public accent is configured.',
  },
  '--media-duration-controls': {
    kind: 'internal',
    description: 'Controls visibility transition duration.',
  },
  '--media-icon-size': {
    kind: 'internal',
    description: 'Shared control icon size.',
  },
  '--media-menu-item-radius': {
    kind: 'internal',
    description: 'Corner radius shared by menu items and the moving highlight.',
  },
  '--media-menu-item-highlight-anchor': {
    kind: 'internal',
    description: 'Anchor name used by the menu highlight.',
  },
  '--media-duration-menu': {
    kind: 'internal',
    description: 'Duration shared by settings menu panel and size transitions.',
  },
  '--media-popup-side-offset': {
    kind: 'internal',
    description: 'Resolved safe-area distance for a positioned popup.',
  },
  '--media-popup-translate-distance': {
    kind: 'internal',
    description: 'Entry translation distance shared by popup transitions.',
  },
  '--media-popup-translate-x-distance': {
    kind: 'internal',
    description: 'Resolved horizontal entry translation for a positioned popup.',
  },
  '--media-popup-translate-y-distance': {
    kind: 'internal',
    description: 'Resolved vertical entry translation for a positioned popup.',
  },
  '--media-preview-end-inset': {
    kind: 'internal',
    description: 'Slider preview correction when the slider is narrower than its container.',
  },
  '--media-preview-left': {
    kind: 'internal',
    description: 'Clamped horizontal position for slider preview content.',
  },
  '--media-scale': {
    kind: 'internal',
    description: 'Theme control scale multiplier.',
  },
  '--media-shadow-current-color': {
    kind: 'internal',
    description: 'Contrast-aware shadow color for text and icons rendered over media.',
  },
  '--media-shadow-subtle-current-color': {
    kind: 'internal',
    description: 'Reduced-opacity contrast-aware shadow color for subtle media details.',
  },
  '--media-scrollbar-thumb-color': {
    kind: 'internal',
    description: 'Theme scrollbar thumb color.',
  },
  '--media-slider-height': {
    kind: 'internal',
    description: 'Responsive hit-area height for horizontal sliders.',
  },
  '--media-slider-preview-max-height': {
    kind: 'internal',
    description: 'Maximum slider preview height.',
  },
  '--media-slider-preview-max-width': {
    kind: 'internal',
    description: 'Maximum slider preview width.',
  },
  '--media-spacing': {
    kind: 'internal',
    description: 'Scoped Tailwind spacing unit scaled for fullscreen UI.',
  },
  '--media-backdrop': {
    kind: 'internal',
    description: 'Opaque base color for translucent overlays such as backdrops, indicator pills, and thumbnails.',
  },
  '--media-frame-border': {
    kind: 'internal',
    description: 'Resolved hairline drawn around the player, derived from the public border color.',
  },
  '--media-controls-gradient': {
    kind: 'internal',
    description: 'Theme gradient painted behind the video controls.',
  },
  '--media-thumbnail-gradient': {
    kind: 'internal',
    description: 'Theme backdrop over the default thumbnail preview that keeps the time label legible.',
  },
  '--media-indicator-gradient': {
    kind: 'internal',
    description: 'Theme gradient painted behind Minimal status and volume indicators.',
  },
  '--media-backdrop-filter-surface': {
    kind: 'internal',
    description: 'Backdrop filter shared by translucent surfaces; preferences switch it off.',
  },
  '--media-backdrop-filter-indicator': {
    kind: 'internal',
    description: 'Backdrop filter behind the buffering and playback status indicators; preferences switch it off.',
  },
  '--media-backdrop-filter-dialog': {
    kind: 'internal',
    description: 'Backdrop filter behind dialogs per theme; preferences switch it off.',
  },
  '--media-shadow-surface-inset': {
    kind: 'internal',
    description: 'Inner highlight shared by translucent surfaces; preferences switch its strength.',
  },
  '--media-popup-radius': {
    kind: 'internal',
    description: 'Theme corner radius shared by menu popups and slider thumbnails.',
  },
  '--media-dialog-radius': {
    kind: 'internal',
    description: 'Theme corner radius of dialog popups.',
  },
  '--media-dialog-width': {
    kind: 'internal',
    description: 'Dialog popup width per theme.',
  },
  '--media-dialog-max-width': {
    kind: 'internal',
    description: 'Maximum dialog popup width per theme.',
  },
  '--media-duration-instant': {
    kind: 'internal',
    description: 'Shortest transition duration, also the reduced-motion target for every longer duration.',
  },
  '--media-duration-fast': {
    kind: 'internal',
    description: 'Transition duration for hover, focus, and highlight changes.',
  },
  '--media-duration': {
    kind: 'internal',
    description: 'Transition duration for icon swaps and control state changes.',
  },
  '--media-duration-slow': {
    kind: 'internal',
    description: 'Transition duration for previews, fills, and status entrances.',
  },
  '--media-duration-slower': {
    kind: 'internal',
    description: 'Transition duration for posters, dialog exits, and the default indicator entrance.',
  },
  '--media-duration-indicator': {
    kind: 'internal',
    description: 'Indicator enter and leave duration per theme, reduced with motion preferences.',
  },
  '--media-duration-slider': {
    kind: 'internal',
    description: 'Slider fill and thumb tracking duration; zero under reduced motion.',
  },
  '--media-slider-preview-offset': {
    kind: 'internal',
    description: 'Distance between the time slider and its thumbnail preview.',
  },
  '--media-slider-preview-label-offset': {
    kind: 'internal',
    description: 'Distance between the time slider and its time or chapter label.',
  },
  '--media-live-color': {
    kind: 'internal',
    description: 'Color of the live-edge indicator dot.',
  },
  '--media-shadow-separator': {
    kind: 'internal',
    description: 'Highlight drawn under default menu separators.',
  },
  '--media-shadow-thumb': {
    kind: 'internal',
    description: 'Theme shadow beneath slider thumbs.',
  },
  '--media-text-shadow-dialog': {
    kind: 'internal',
    description: 'Theme text shadow inside dialog popups.',
  },
  '--media-shadow-tooltip': {
    kind: 'internal',
    description: 'Theme tooltip shadow.',
  },
  '--media-duration-dialog': {
    kind: 'internal',
    description: 'Dialog enter duration per theme, reduced with motion preferences.',
  },
  '--media-delay-dialog': {
    kind: 'internal',
    description: 'Dialog transition delay, removed with motion preferences.',
  },
  '--media-hidden-scale': {
    kind: 'internal',
    description: 'Scale applied to hidden controls; neutral under reduced motion.',
  },
  '--media-hidden-blur': {
    kind: 'internal',
    description: 'Blur applied to hidden controls and indicators on fine pointers; zero under reduced motion.',
  },
  '--media-hidden-offset': {
    kind: 'internal',
    description: 'Distance hidden controls slide per theme; zero under reduced motion.',
  },
  '--media-hidden-indicator-scale': {
    kind: 'internal',
    description: 'Scale applied to entering and leaving indicators; neutral under reduced motion.',
  },
  '--media-hidden-indicator-offset': {
    kind: 'internal',
    description: 'Distance leaving indicators slide per theme; zero under reduced motion.',
  },
  '--media-hidden-playback-scale': {
    kind: 'internal',
    description: 'Scale applied to the entering and leaving playback status; neutral under reduced motion.',
  },
  '--media-hidden-icon-scale': {
    kind: 'internal',
    description: 'Scale of an inactive swapped icon; neutral under reduced motion.',
  },
  '--media-hidden-popup-scale': {
    kind: 'internal',
    description: 'Scale applied to entering and leaving popups; neutral under reduced motion.',
  },
  '--media-hidden-popup-blur': {
    kind: 'internal',
    description: 'Blur applied to entering and leaving popups; zero under reduced motion.',
  },
  '--media-hidden-preview-scale': {
    kind: 'internal',
    description: 'Scale applied to hidden slider preview content; neutral under reduced motion.',
  },
  '--media-hidden-preview-offset': {
    kind: 'internal',
    description: 'Distance hidden slider preview content sits below its resting position; zero under reduced motion.',
  },
  '--media-hidden-seek-offset': {
    kind: 'internal',
    description: 'Distance the seek indicator icon slides in from; zero under reduced motion.',
  },
  '--media-caption-track-delay': {
    kind: 'runtime',
    description: 'Transition delay supplied by the Skin and consumed by native caption rendering.',
  },
  '--media-caption-track-duration': {
    kind: 'runtime',
    description: 'Transition duration supplied by the Skin and consumed by native caption rendering.',
  },
  '--media-caption-track-y': {
    kind: 'runtime',
    description: 'Vertical offset supplied by the Skin and consumed by native caption rendering.',
  },
  '--media-icon-airplay-fill-animation': {
    kind: 'runtime',
    description: 'Animation override supplied by the Skin and consumed by the AirPlay icon.',
  },
  '--media-icon-airplay-triangle-animation': {
    kind: 'runtime',
    description: 'Animation override supplied by the Skin and consumed by the AirPlay icon.',
  },
  '--media-menu-available-height': {
    kind: 'runtime',
    description: 'Available height published by Menu positioning and consumed by the Skin.',
  },
  '--media-menu-available-width': {
    kind: 'runtime',
    description: 'Available width published by Menu positioning and consumed by the Skin.',
  },
  '--media-menu-height': {
    kind: 'runtime',
    description: 'Measured menu height published for submenu transitions.',
  },
  '--media-menu-width': {
    kind: 'runtime',
    description: 'Measured menu width published for submenu transitions.',
  },
  '--media-popover-boundary-offset': {
    kind: 'runtime',
    description: 'Boundary offset supplied by the Skin and consumed by Popover positioning.',
  },
  '--media-popover-side-offset': {
    kind: 'runtime',
    description: 'Side offset supplied by the Skin and consumed by Popover positioning.',
  },
  '--media-slider-buffer': {
    kind: 'runtime',
    description: 'Buffered percentage published by Slider and consumed by the Skin.',
  },
  '--media-slider-chapter-end': {
    kind: 'runtime',
    description: 'Chapter end percentage published by Time Slider and consumed by the Skin.',
  },
  '--media-slider-chapter-start': {
    kind: 'runtime',
    description: 'Chapter start percentage published by Time Slider and consumed by the Skin.',
  },
  '--media-slider-fill': {
    kind: 'runtime',
    description: 'Fill percentage published by Slider and consumed by the Skin.',
  },
  '--media-slider-pointer': {
    kind: 'runtime',
    description: 'Pointer percentage published by Slider while dragging and consumed by the Skin.',
  },
  '--media-spinner-animation': {
    kind: 'runtime',
    description: 'Animation override supplied by the Skin and consumed by the spinner icon.',
  },
  '--media-tooltip-boundary-offset': {
    kind: 'runtime',
    description: 'Boundary offset supplied by the Skin and consumed by Tooltip positioning.',
  },
  '--media-tooltip-side-offset': {
    kind: 'runtime',
    description: 'Side offset supplied by the Skin and consumed by Tooltip positioning.',
  },
  '--media-video-border-radius': {
    kind: 'runtime',
    description: 'Resolved radius supplied by the Skin and consumed by light- and shadow-DOM media.',
  },
  '--media-volume-fill': {
    kind: 'runtime',
    description: 'Fill percentage published by Volume Indicator and consumed by the Skin.',
  },
} as const satisfies Readonly<Record<`--media-${string}`, CssVar>>;
