import { createState } from '@videojs/store';
import { DEFAULT_LOCALE, isDefaultLocale } from '@videojs/utils/i18n';

import type { IndicatorCoreProps, IndicatorLifecycleState } from '../indicator/lifecycle';
import { getIndicatorCloseDelay, IndicatorCloseController } from '../indicator/lifecycle';
import type { InputActionEvent, MediaSnapshot } from '../input-action';
import { formatCurrentTime, getSeekDirection, type IndicatorDirection, isSeekIndicatorAction } from './status';

export interface SeekIndicatorProps extends IndicatorCoreProps {
  /** Delay in milliseconds before the indicator closes. */
  closeDelay?: number | undefined;
  /** @internal Active i18n locale supplied by framework adapters. */
  locale?: string | string[] | undefined;
}

export interface SeekIndicatorState extends IndicatorLifecycleState {
  /** Whether the indicator is open. */
  open: boolean;
  /** Increments each time a seek input action updates the indicator. */
  generation: number;
  /** Direction of the seek, or `null` when the target does not change the current time. */
  direction: IndicatorDirection | null;
  /** Number of same-direction seek steps accumulated in the current display. */
  count: number;
  /** Absolute number of seconds accumulated from seek-step actions. */
  seekTotal: number;
  /** Accumulated seek-step label, or `null` for percentage seeks. */
  value: string | null;
  /** Formatted current time captured when the input action occurred. */
  currentTime: string;
}

const INITIAL_STATE: SeekIndicatorState = {
  open: false,
  generation: 0,
  direction: null,
  count: 0,
  seekTotal: 0,
  value: null,
  currentTime: '0:00',
  transitionStarting: false,
  transitionEnding: false,
};

export class SeekIndicatorCore {
  readonly state = createState<SeekIndicatorState>({ ...INITIAL_STATE });

  #props: SeekIndicatorProps = {};
  #originTime: number | null = null;
  #close = new IndicatorCloseController(
    () => {
      this.#originTime = null;
      this.state.patch({
        open: false,
        direction: null,
        count: 0,
        seekTotal: 0,
        value: null,
      });
    },
    () => getIndicatorCloseDelay(this.#props)
  );

  setProps(props: SeekIndicatorProps): void {
    this.#props = props;
  }

  destroy(): void {
    this.#close.destroy();
  }

  close(): void {
    this.#close.close();
  }

  processEvent(event: InputActionEvent, snapshot: MediaSnapshot): boolean {
    if (!isSeekIndicatorAction(event.action)) return false;

    const current = this.state.current;
    const direction = getSeekDirection(event, snapshot);
    const rapidRepeat = current.open && event.action === 'seekStep' && current.direction === direction;

    if (!rapidRepeat) {
      this.#originTime = snapshot.currentTime ?? null;
    }

    const value = this.#getEffectiveSeekValue(event, snapshot, rapidRepeat);
    const seekTotal = rapidRepeat ? current.seekTotal + Math.abs(value) : Math.abs(value);
    const label =
      event.action === 'seekStep' && seekTotal > 0
        ? new Intl.NumberFormat(this.#props.locale ?? DEFAULT_LOCALE, {
            style: 'unit',
            unit: 'second',
            // Narrow units can fall back to Latin "s" in locales such as Persian.
            unitDisplay: isDefaultLocale(this.#props.locale) ? 'narrow' : 'short',
            useGrouping: false,
          }).format(seekTotal)
        : null;

    this.state.patch({
      open: true,
      generation: current.generation + 1,
      direction,
      count: rapidRepeat ? current.count + 1 : 1,
      seekTotal,
      value: label,
      currentTime: formatCurrentTime(snapshot, this.#props.locale),
    });
    this.#close.arm();
    return true;
  }

  #getEffectiveSeekValue(event: InputActionEvent, snapshot: MediaSnapshot, rapidRepeat: boolean): number {
    if (event.action !== 'seekStep' || event.value === undefined) return 0;

    if (!rapidRepeat || this.#originTime === null) return event.value;

    const originTime = this.#originTime;
    const duration = snapshot.duration ?? Infinity;
    const currentTotal = this.state.current.seekTotal;
    const step = Math.abs(event.value);
    const room =
      event.value < 0 ? Math.max(0, originTime - currentTotal) : Math.max(0, duration - originTime - currentTotal);

    return room >= step ? event.value : 0;
  }
}

export namespace SeekIndicatorCore {
  export type Props = SeekIndicatorProps;
  export type State = SeekIndicatorState;
}
