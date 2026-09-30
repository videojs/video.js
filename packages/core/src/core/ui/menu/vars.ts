/** CSS custom property names for menu layout and positioning. */
export const MenuCSSVars = {
  /** Distance between the popup and the trigger along the side axis. */
  sideOffset: '--media-popover-side-offset',
  /** Distance between the popup and the trigger along the alignment axis. */
  alignOffset: '--media-popover-align-offset',
  /** Minimum distance between the popup and the positioning boundary. */
  boundaryOffset: '--media-popover-boundary-offset',
  /** Width of the trigger, set by popup positioning. */
  anchorWidth: '--media-popover-anchor-width',
  /** Height of the trigger, set by popup positioning. */
  anchorHeight: '--media-popover-anchor-height',
  /** Width of the active menu panel (px). */
  width: '--media-menu-width',
  /** Height of the active menu panel (px). */
  height: '--media-menu-height',
  /** Width available within the positioning boundary (px). */
  availableWidth: '--media-menu-available-width',
  /** Height available within the positioning boundary (px). */
  availableHeight: '--media-menu-available-height',
} as const;
