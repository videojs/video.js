import { createState } from '@videojs/store';

import type { IndicatorCoreProps } from '../indicator/lifecycle';
import { getIndicatorCloseDelay, IndicatorCloseController } from '../indicator/lifecycle';
import type { MediaSnapshot } from '../input-action';
import { DEFAULT_STATUS_ANNOUNCER_LABELS, type StatusAnnouncerLabels } from './labels';
import { deriveStatusAnnouncement, deriveVolumeAnnouncement } from './status';

const ANNOUNCEMENT_DEBOUNCE = 200;

export interface StatusAnnouncerProps extends IndicatorCoreProps {
  /** Delay in milliseconds before the current announcement label is cleared. */
  closeDelay?: number | undefined;
  /** Overrides for the translated announcement labels. */
  labels?: Partial<StatusAnnouncerLabels> | undefined;
  /** Whether debounced seek and volume changes should be announced. */
  shouldAnnounce?: (() => boolean) | undefined;
}

export interface StatusAnnouncerState {
  /** Increments for each announcement so repeated labels replace the live-region content. */
  generation: number;
  /** Current announcement text, or `null` when the live region is empty. */
  label: string | null;
}

/** @internal */
export class StatusAnnouncerCore {
  readonly state = createState<StatusAnnouncerState>({ generation: 0, label: null });

  #props: StatusAnnouncerProps = {};
  #snapshot: MediaSnapshot | null = null;
  #seekStartTime: number | null = null;
  #seekTargetTime: number | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #close = new IndicatorCloseController(
    () => this.state.patch({ label: null }),
    () => getIndicatorCloseDelay(this.#props)
  );

  setProps(props: StatusAnnouncerProps): void {
    this.#props = props;
  }

  resetSnapshot(): void {
    this.#snapshot = null;
    this.#seekStartTime = null;
    this.#seekTargetTime = null;
    this.#clearTimer();
    this.#close.close();
  }

  destroy(): void {
    this.#clearTimer();
    this.#close.destroy();
  }

  processSnapshot(snapshot: MediaSnapshot): boolean {
    const previous = this.#snapshot;

    this.#snapshot = snapshot;

    if (!previous) return false;

    const labels = this.#getLabels();
    const statusLabel = deriveStatusAnnouncement(previous, snapshot, labels);
    const statusHandled = statusLabel !== null && this.#announce(statusLabel);
    const seekHandled = this.#processSeekSnapshot(previous, snapshot, labels, statusHandled);
    const volumeHandled = this.#processVolumeSnapshot(previous, snapshot, labels, statusHandled || seekHandled);

    return statusHandled || seekHandled || volumeHandled;
  }

  #getLabels(): StatusAnnouncerLabels {
    return {
      ...DEFAULT_STATUS_ANNOUNCER_LABELS,
      ...this.#props.labels,
    };
  }

  #announce(label: string): boolean {
    this.#clearTimer();
    this.state.patch({ generation: this.state.current.generation + 1, label });
    this.#close.arm();
    return true;
  }

  #processVolumeSnapshot(
    previous: MediaSnapshot,
    snapshot: MediaSnapshot,
    labels: StatusAnnouncerLabels,
    alreadyHandled: boolean
  ): boolean {
    const label = deriveVolumeAnnouncement(previous, snapshot, labels);
    if (label === null || alreadyHandled || !this.#shouldAnnounce()) return false;

    this.#schedule(label);
    return true;
  }

  #processSeekSnapshot(
    previous: MediaSnapshot,
    snapshot: MediaSnapshot,
    labels: StatusAnnouncerLabels,
    alreadyHandled: boolean
  ): boolean {
    if (previous.seeking !== true && snapshot.seeking === true) {
      this.#seekStartTime = previous.currentTime ?? null;
      this.#seekTargetTime = snapshot.currentTime ?? null;
      this.#clearTimer();
      return false;
    }

    if (snapshot.seeking === true) {
      this.#seekTargetTime = snapshot.currentTime ?? this.#seekTargetTime;
      return false;
    }

    if (previous.seeking !== true || snapshot.seeking !== false) return false;

    const targetTime = snapshot.currentTime ?? this.#seekTargetTime;
    const startTime = this.#seekStartTime;

    this.#seekStartTime = null;
    this.#seekTargetTime = null;

    if (targetTime === undefined || targetTime === null || Object.is(targetTime, startTime)) return false;

    if (alreadyHandled || !this.#shouldAnnounce()) return false;

    this.#schedule(labels.seekedTo(targetTime));
    return true;
  }

  #schedule(label: string): void {
    this.#clearTimer();
    this.#timer = setTimeout(() => {
      this.#timer = null;

      if (!this.#shouldAnnounce()) return;

      this.#announce(label);
    }, ANNOUNCEMENT_DEBOUNCE);
  }

  #shouldAnnounce(): boolean {
    return this.#props.shouldAnnounce?.() !== false;
  }

  #clearTimer(): void {
    if (this.#timer === null) return;

    clearTimeout(this.#timer);
    this.#timer = null;
  }
}

/** @internal */
export namespace StatusAnnouncerCore {
  export type Props = StatusAnnouncerProps;
  export type State = StatusAnnouncerState;
}
