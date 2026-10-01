import { createState } from '@videojs/store';

import { DEFAULT_INPUT_INDICATOR_LABELS, type InputIndicatorLabels } from '../indicator/labels';
import type { IndicatorCoreProps, IndicatorLifecycleState } from '../indicator/lifecycle';
import { getIndicatorCloseDelay, IndicatorCloseController } from '../indicator/lifecycle';
import { type InputAction, type InputActionEvent, isInputActionIncluded, type MediaSnapshot } from '../input-action';
import { deriveStatus, type IndicatorStatus, type StatusDetails } from './status';

export interface StatusIndicatorProps extends IndicatorCoreProps {
  /** Input actions allowed to open the indicator. All supported actions are allowed when omitted. */
  actions?: readonly InputAction[] | undefined;
  /** Internal translated label overrides supplied by framework adapters. */
  labels?: Partial<InputIndicatorLabels> | undefined;
  /**
   * Derives display details for custom actions. Called only when the built-in derivation returns `null`; return `null`
   * to leave the indicator closed.
   */
  deriveCustomStatus?: DeriveCustomStatus | undefined;
}

/**
 * Derives display details for an input action from its pre-action media snapshot.
 *
 * @param event - The input action that has not been applied yet.
 * @param snapshot - Media state captured before the action runs.
 */
export type DeriveCustomStatus = (
  event: InputActionEvent,
  snapshot: MediaSnapshot
) => StatusDetails<IndicatorStatus> | null;

export interface StatusIndicatorState extends IndicatorLifecycleState {
  /** Whether the indicator is open. */
  open: boolean;
  /** Increments each time a supported input action updates the indicator. */
  generation: number;
  /** Visual status for the handled input action. */
  status: IndicatorStatus | null;
  /** Translated label for the predicted status. */
  label: string | null;
  /** Predicted volume percentage for volume actions, otherwise `null`. */
  value: string | null;
}

const INITIAL_STATE: StatusIndicatorState = {
  open: false,
  generation: 0,
  status: null,
  label: null,
  value: null,
  transitionStarting: false,
  transitionEnding: false,
};

/** @internal */
export class StatusIndicatorCore {
  readonly state = createState<StatusIndicatorState>({ ...INITIAL_STATE });

  #props: StatusIndicatorProps = {};
  #close = new IndicatorCloseController(
    () => this.state.patch({ open: false, status: null, label: null, value: null }),
    () => getIndicatorCloseDelay(this.#props)
  );

  setProps(props: StatusIndicatorProps): void {
    this.#props = props;
  }

  destroy(): void {
    this.#close.destroy();
  }

  close(): void {
    this.#close.close();
  }

  processEvent(event: InputActionEvent, snapshot: MediaSnapshot): boolean {
    if (!isInputActionIncluded(event.action, this.#props.actions)) return false;

    const details =
      deriveStatus(event, snapshot, { ...DEFAULT_INPUT_INDICATOR_LABELS, ...this.#props.labels }) ??
      this.#props.deriveCustomStatus?.(event, snapshot);
    if (!details) return false;

    this.state.patch({
      open: true,
      generation: this.state.current.generation + 1,
      status: details.status,
      label: details.label,
      value: details.value,
    });
    this.#close.arm();
    return true;
  }
}

/** @internal */
export namespace StatusIndicatorCore {
  export type Props = StatusIndicatorProps;
  export type State = StatusIndicatorState;
}
