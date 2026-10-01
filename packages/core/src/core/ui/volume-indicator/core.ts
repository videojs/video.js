import { createState } from '@videojs/store';

import { DEFAULT_INPUT_INDICATOR_LABELS, type InputIndicatorLabels } from '../indicator/labels';
import type { IndicatorCoreProps, IndicatorLifecycleState } from '../indicator/lifecycle';
import { getIndicatorCloseDelay, IndicatorCloseController } from '../indicator/lifecycle';
import type { InputActionEvent, MediaSnapshot } from '../input-action';
import {
  deriveVolumeStatus,
  type IndicatorVolumeLevel,
  isVolumeIndicatorAction,
  predictVolumeActionOutcome,
} from './status';

export interface VolumeIndicatorProps extends IndicatorCoreProps {
  /** Internal translated label overrides supplied by framework adapters. */
  labels?: Partial<InputIndicatorLabels> | undefined;
}

export interface VolumeIndicatorState extends IndicatorLifecycleState {
  /** Whether the indicator is open. */
  open: boolean;
  /** Increments each time a volume input action updates the indicator. */
  generation: number;
  /** Predicted volume level after the input action. */
  level: IndicatorVolumeLevel | null;
  /** Predicted volume formatted as a percentage. */
  value: string | null;
  /** Predicted volume percentage used by the Fill part. */
  fill: string | null;
  /** Whether a downward step tried to move past minimum volume. */
  min: boolean;
  /** Whether an upward step tried to move past maximum volume. */
  max: boolean;
}

const BOUNDARY_CLEAR_DELAY = 300;

const INITIAL_STATE: VolumeIndicatorState = {
  open: false,
  generation: 0,
  level: null,
  value: null,
  fill: null,
  min: false,
  max: false,
  transitionStarting: false,
  transitionEnding: false,
};

/** @internal */
export class VolumeIndicatorCore {
  readonly state = createState<VolumeIndicatorState>({ ...INITIAL_STATE });

  #props: VolumeIndicatorProps = {};
  #boundaryTimer: ReturnType<typeof setTimeout> | null = null;
  #close = new IndicatorCloseController(
    () => this.state.patch({ open: false, level: null, value: null, fill: null, min: false, max: false }),
    () => getIndicatorCloseDelay(this.#props)
  );

  setProps(props: VolumeIndicatorProps): void {
    this.#props = props;
  }

  destroy(): void {
    this.#close.destroy();
    this.#clearBoundaryTimers();
  }

  close(): void {
    this.#clearBoundaryTimers();
    this.#close.close();
  }

  processEvent(event: InputActionEvent, snapshot: MediaSnapshot): boolean {
    if (!isVolumeIndicatorAction(event.action)) return false;

    const current = this.state.current;
    const prediction = predictVolumeActionOutcome(event, snapshot);
    const details = deriveVolumeStatus(
      event,
      snapshot,
      { ...DEFAULT_INPUT_INDICATOR_LABELS, ...this.#props.labels },
      prediction
    );
    const boundary = getVolumeBoundary(event, prediction.snapshotVolume, prediction.nextVolume);
    const showBoundary = boundary !== null && !event.repeat;

    if (!boundary) this.#clearBoundaryTimers();

    this.state.patch({
      open: true,
      generation: current.generation + 1,
      level: details.volumeLevel,
      value: details.value,
      fill: details.value,
      min: boundary && event.repeat ? current.min : showBoundary && boundary === 'min',
      max: boundary && event.repeat ? current.max : showBoundary && boundary === 'max',
    });

    if (showBoundary) this.#scheduleBoundaryClear();

    this.#close.arm();
    return true;
  }

  #scheduleBoundaryClear(): void {
    this.#clearBoundaryTimer();
    this.#boundaryTimer = setTimeout(() => {
      this.#boundaryTimer = null;
      this.state.patch({ min: false, max: false });
    }, BOUNDARY_CLEAR_DELAY);
  }

  #clearBoundaryTimer(): void {
    if (this.#boundaryTimer === null) return;

    clearTimeout(this.#boundaryTimer);
    this.#boundaryTimer = null;
  }

  #clearBoundaryTimers(): void {
    this.#clearBoundaryTimer();
  }
}

/** @internal */
export namespace VolumeIndicatorCore {
  export type Props = VolumeIndicatorProps;
  export type State = VolumeIndicatorState;
}

function getVolumeBoundary(event: InputActionEvent, currentVolume: number, nextVolume: number): 'min' | 'max' | null {
  if (event.action !== 'volumeStep' || event.value === undefined || event.value === 0) return null;

  if (nextVolume !== currentVolume) return null;

  return event.value < 0 ? 'min' : 'max';
}
