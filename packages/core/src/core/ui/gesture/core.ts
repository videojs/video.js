export type GestureType = 'tap' | 'doubletap';
export type GesturePointerType = 'mouse' | 'touch' | 'pen';
export type GestureRegion = 'left' | 'center' | 'right';
export type GestureActionName =
  | 'togglePaused'
  | 'toggleMuted'
  | 'toggleFullscreen'
  | 'toggleSubtitles'
  | 'togglePictureInPicture'
  | 'toggleControls'
  | 'seekStep'
  | 'volumeStep'
  | 'speedUp'
  | 'speedDown';

export interface GestureProps {
  /** Gesture to recognize. */
  type: GestureType;
  /** Built-in player action or same-named custom store action to run when the gesture is recognized. */
  action: GestureActionName | (string & {});
  /**
   * Numeric value passed to actions such as `seekStep`, `volumeStep`, `speedUp`, and `speedDown`. The seek and volume
   * actions use their shared step when omitted, and the speed actions move through the player's playback rates.
   */
  value?: number | undefined;
  /** Pointer type that may activate the gesture. All pointer types are accepted when omitted. */
  pointer?: GesturePointerType | undefined;
  /** Optional horizontal part of the container that may activate the gesture. */
  region?: GestureRegion | undefined;
  /** Whether the gesture is disabled. */
  disabled?: boolean | undefined;
}
