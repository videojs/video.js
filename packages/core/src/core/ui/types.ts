import type { State } from '@videojs/store';

import type { Text, TextParams } from '../i18n';

export type StateAttrMap<State> = {
  [Key in keyof State]?: string;
};

/** Constraint for core UI classes that compute component state. */
export interface UIComponent<Props = object, State extends object = object> {
  getState(): State;
  setProps?(props: Props): void;
  getAttrs?(state: State): object;
}

/** Constraint for core UI classes that derive component state from media state. */
export interface MediaUIComponent<Props = object, State extends object = object> extends UIComponent<Props, State> {
  setMedia(media: object): void;
}

export interface ButtonState {
  label: Text | string;
}

/** A normalized radio option produced by a framework-neutral UI core. */
export interface RadioOption {
  /** Value passed back to the core when this option is selected. */
  value: string;
  /** Visible option label. */
  label: Text | string;
  /** Values interpolated into a translated label. */
  labelParams?: TextParams | undefined;
  /** Whether this individual option is disabled. */
  disabled: boolean;
}

/** Shared state contract for media-backed radio option groups. */
export interface RadioOptionsState<Option extends RadioOption = RadioOption> extends ButtonState {
  /** Current radio-group value. */
  value: string;
  /** Ordered options displayed by platform adapters. */
  options: readonly Option[];
  /** Whether the entire option group is disabled. */
  disabled: boolean;
  /** Whether the option group is hidden because no meaningful selection is available. */
  hidden: boolean;
  /** Whether the media exposes a meaningful selection. */
  availability: 'available' | 'unavailable';
}

/** Constraint for media button cores that provide a label derived from state. */
export interface MediaButtonComponent<
  Props = object,
  ComponentState extends ButtonState = ButtonState,
> extends MediaUIComponent<Props, ComponentState> {
  readonly state: State<ComponentState>;
  getLabel(state: ComponentState): Text | string;
}

/**
 * Extracts the media state parameter type from a core's `setMedia` method.
 *
 * @internal
 */
export type InferMediaState<Core extends MediaUIComponent> = Parameters<Core['setMedia']>[0];

/**
 * Extracts the component state return type from a core's `getState` method.
 *
 * @internal
 */
export type InferComponentState<Core extends UIComponent> = ReturnType<Core['getState']>;
