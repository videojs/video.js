export type TailwindRuleKind = 'utility' | 'variant' | 'theme';

export interface TailwindRule {
  readonly kind: TailwindRuleKind;
  readonly description: string;
}

/**
 * Descriptions for the shared Tailwind source. Theme keys that alias a `--media-*` token take their description from
 * `vars`, so only computed theme keys appear here.
 */
export const utilities = {
  'font-media': { kind: 'utility', description: 'Player font stack, overridable through `--media-font-family`.' },
  'highlight-media': {
    kind: 'utility',
    description: 'Accent background and text for a highlighted control or menu item.',
  },
  'surface-media': { kind: 'utility', description: 'Translucent surface chrome: hairline, shadow, and backdrop blur.' },
  'surface-media-inset': { kind: 'utility', description: 'Inner highlight for a surface, applied through `after:`.' },
  'surface-media-none': {
    kind: 'utility',
    description: 'Removes surface chrome from a popup that sits flat on the controls.',
  },
  'focus-ring-media': {
    kind: 'utility',
    description: 'Inset focus ring revealed with `focus-visible:outline-media-ring focus-visible:outline-offset-2`.',
  },
  'mask-media-volume': {
    kind: 'utility',
    description:
      'Fades trailing controls while the horizontal volume popover is open; pair with `mask-media-volume-open`.',
  },
  'mask-media-volume-open': { kind: 'utility', description: 'Open state of `mask-media-volume`.' },
  'nudge-media': {
    kind: 'utility',
    description: 'Springy nudge for feedback at a limit, such as volume at zero or full.',
  },
  'layer-media': {
    kind: 'utility',
    description: 'Absolutely positioned layer filling its parent and inheriting its radius.',
  },
  'object-media': {
    kind: 'utility',
    description: 'Media and poster fit, overridable through `--media-object-fit` and `--media-object-position`.',
  },
  'transition-media-popup': { kind: 'utility', description: 'Enter and exit transition for popups and menus.' },
  'transition-media-menu-resize': {
    kind: 'utility',
    description: 'Enter, exit, and size transition for the resizable settings menu.',
  },
  'motion-media-*': {
    kind: 'utility',
    description: 'Transitions and hints the listed properties, for example `motion-media-[scale,opacity]`.',
  },
  'anchor-media-highlight': {
    kind: 'utility',
    description: 'Anchor-positioned highlight that follows the highlighted menu item, applied through `before:`.',
  },
  'clip-media-x-*': {
    kind: 'utility',
    description:
      'Horizontal slider layer clipped to a progress variable, for example `clip-media-x-[--media-slider-fill]`.',
  },
  'clip-media-y-*': { kind: 'utility', description: 'Vertical slider layer clipped to a progress variable.' },
  'clip-media-chapter-x': { kind: 'utility', description: 'Horizontal chapter segment clipped to its start and end.' },
  'clip-media-chapter-y': { kind: 'utility', description: 'Vertical chapter segment clipped to its start and end.' },
  'clip-media-chapter-track-x': {
    kind: 'utility',
    description: 'Horizontal chapter track with the inter-chapter gap and rounded ends.',
  },
  'clip-media-chapter-track-y': {
    kind: 'utility',
    description: 'Vertical chapter track with the inter-chapter gap and rounded ends.',
  },
  'duration-media-*': {
    kind: 'utility',
    description: 'Transition durations from the theme, for example `duration-media-fast`.',
  },
  'delay-media-*': {
    kind: 'utility',
    description: 'Transition delays from the theme, for example `delay-media-dialog`.',
  },
  'backdrop-filter-media-*': {
    kind: 'utility',
    description: 'Backdrop filters from the theme, for example `backdrop-filter-media-indicator`.',
  },
  'media-high-contrast': { kind: 'variant', description: 'Reduced transparency or high contrast.' },
  'media-280': { kind: 'variant', description: 'Player above 280px.' },
  'media-max-280': { kind: 'variant', description: 'Player at or below 280px.' },
  'media-xs': { kind: 'variant', description: 'Player at or above the xs breakpoint.' },
  'media-max-xs': { kind: 'variant', description: 'Player below the xs breakpoint.' },
  'media-360': { kind: 'variant', description: 'Player at or above 360px.' },
  'media-max-360': { kind: 'variant', description: 'Player below 360px.' },
  'media-sm': { kind: 'variant', description: 'Player at or above the sm breakpoint.' },
  'media-max-sm': { kind: 'variant', description: 'Player below the sm breakpoint.' },
  'media-md': { kind: 'variant', description: 'Player at or above the md breakpoint.' },
  'media-max-md': { kind: 'variant', description: 'Player below the md breakpoint.' },
  'media-lg': { kind: 'variant', description: 'Player at or above the lg breakpoint.' },
  'media-max-lg': { kind: 'variant', description: 'Player below the lg breakpoint.' },
  'media-xl': { kind: 'variant', description: 'Player at or above the xl breakpoint.' },
  'media-max-xl': { kind: 'variant', description: 'Player below the xl breakpoint.' },
  'media-2xl': { kind: 'variant', description: 'Player at or above the 2xl breakpoint.' },
  'media-max-2xl': { kind: 'variant', description: 'Player below the 2xl breakpoint.' },
  'media-highlighted': {
    kind: 'variant',
    description: 'Focused, expanded, or highlighted control or menu item that is not disabled.',
  },
  'media-transitioning': {
    kind: 'variant',
    description: 'Element entering or leaving through starting and ending styles.',
  },
  'media-anchored': { kind: 'variant', description: 'Browsers with CSS anchor positioning.' },
  '--container-media-280': { kind: 'theme', description: 'Player 280px layout breakpoint for `media-280` variants.' },
  '--container-media-xs': { kind: 'theme', description: 'Player xs layout breakpoint for `media-xs` variants.' },
  '--container-media-360': { kind: 'theme', description: 'Player 360px layout breakpoint for `media-360` variants.' },
  '--container-media-sm': { kind: 'theme', description: 'Player sm layout breakpoint for `media-sm` variants.' },
  '--container-media-md': { kind: 'theme', description: 'Player md layout breakpoint for `media-md` variants.' },
  '--container-media-lg': { kind: 'theme', description: 'Player lg layout breakpoint for `media-lg` variants.' },
  '--container-media-xl': { kind: 'theme', description: 'Player xl layout breakpoint for `media-xl` variants.' },
  '--container-media-2xl': { kind: 'theme', description: 'Player 2xl layout breakpoint for `media-2xl` variants.' },
  '--text-media-xs': { kind: 'theme', description: 'Smallest label size, relative to the parent text.' },
  '--text-media-sm': { kind: 'theme', description: 'Small text size in player spacing units.' },
  '--text-media': { kind: 'theme', description: 'Base text size in player spacing units.' },
  '--text-media-lg': { kind: 'theme', description: 'Large text size in player spacing units.' },
  '--text-media-xl': { kind: 'theme', description: 'Extra large text size in player spacing units.' },
  '--spacing-media-icon-sm': { kind: 'theme', description: 'Chevron size derived from the icon size.' },
  '--spacing-media-icon': { kind: 'theme', description: 'Control icon size.' },
  '--spacing-media-icon-lg': { kind: 'theme', description: 'Large indicator icon size.' },
  '--spacing-media-icon-xl': { kind: 'theme', description: 'Extra large indicator icon size.' },
  '--radius-media-pill': { kind: 'theme', description: 'Always-round radius for tracks and pills.' },
  '--shadow-media-hairline': { kind: 'theme', description: 'One-pixel hairline in the theme border color.' },
  '--duration-media-controls-enter': {
    kind: 'theme',
    description: 'Half the controls visibility duration, used while controls appear.',
  },
  '--drop-shadow-media-icon': { kind: 'theme', description: 'Contrast-aware drop shadow for icons over media.' },
  '--text-shadow-media': { kind: 'theme', description: 'Contrast-aware text shadow for text over media.' },
} as const satisfies Readonly<Record<string, TailwindRule>>;
