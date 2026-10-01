/**
 * Single-part component fixture.
 *
 * Exercises: Props interface, State interface, defaultProps, function-typed prop
 * (triggers type abbreviation), @ignore JSDoc (skipped prop), ref prop (auto-skipped),
 * required prop (no default, not optional).
 */

export interface ToggleButtonProps {
  /** Whether the button is disabled. */
  disabled: boolean;
  /** Custom label for the button. */
  label: string | ((state: ToggleButtonState) => string);
  /** @ignore Internal ref — should be excluded from output. */
  _internalFlag: boolean;
  /** React ref — auto-skipped by the builder. */
  ref: unknown;
  /** Callback when pressed state changes. */
  onPressedChange: (pressed: boolean) => void;
  aaaOptional?: boolean;
  zzzRequired: boolean;
}

export interface ToggleButtonState {
  /** Whether the toggle is pressed. */
  pressed: boolean;
  /** Whether the button is disabled. */
  disabled: boolean;
}

export class ToggleButtonCore {
  static readonly defaultProps = {
    disabled: false,
    label: '',
  };
}
