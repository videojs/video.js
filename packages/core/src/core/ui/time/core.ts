import { getTimeRangeEnd, hasTimeRange, type MediaBufferState, type MediaTimeState } from '@videojs/media';
import { defaults } from '@videojs/utils/object';
import { formatTime, formatTimeAsPhrase, secondsToIsoDuration } from '@videojs/utils/time';
import type { NonNullableObject } from '@videojs/utils/types';

import type { Text } from '../../i18n';
import {
  currentText,
  durationText,
  remainingText,
  showDurationText,
  showElapsedText,
  showRemainingText,
  toggleDurationText,
  toggleElapsedText,
  unknownText,
} from '../../i18n/text/time';
import { resolveLabel } from '../utils/resolve-label';

/** Time display type. */
export type TimeType = 'current' | 'duration' | 'remaining';

export interface TimeProps {
  /** Which time value to display. */
  type?: TimeType | undefined;
  /** Symbol prepended to remaining time. */
  negativeSign?: string | undefined;
  /** Custom label for accessibility. */
  label?: Text | string | ((state: TimeState) => Text | string) | undefined;
  /** Whether the time display can be toggled. */
  toggle?: boolean | undefined;
}

export interface TimeState {
  /** Time display type. */
  type: TimeType;
  /** Whether the time toggle is disabled. */
  disabled: boolean;
  /** Whether the non-interactive time value is unavailable. */
  unavailable: boolean;
  /** Raw value in seconds. */
  seconds: number;
  /** Whether the time value is negative (remaining time before end). */
  negative: boolean;
  /** Formatted display text without sign (e.g., "1:30"). */
  text: string;
  /** Human-readable phrase (e.g., "1 minute, 30 seconds"). */
  phrase: string;
  /** ISO 8601 duration (e.g., "PT1M30S"). */
  datetime: string;
}

const TOGGLE_LABELS: Record<TimeType, Text> = {
  current: showElapsedText,
  duration: showDurationText,
  remaining: showRemainingText,
};

const DEFAULT_LABELS: Record<TimeType, Text> = {
  current: currentText,
  duration: durationText,
  remaining: remainingText,
};

const TOGGLE_DESCRIPTIONS: Record<TimeType, Text> = {
  current: toggleElapsedText,
  duration: toggleDurationText,
  remaining: toggleDurationText,
};

/** @internal */
export class TimeCore {
  static readonly defaultProps: NonNullableObject<TimeProps> = {
    type: 'current',
    negativeSign: '-',
    label: '',
    toggle: false,
  };

  #props: NonNullableObject<TimeProps> = { ...TimeCore.defaultProps };
  #media: (MediaTimeState & Pick<MediaBufferState, 'seekable'>) | null = null;
  #formatLocale: string | string[] | undefined;

  constructor(props?: TimeProps) {
    if (props) this.setProps(props);
  }

  setProps(props: TimeProps): void {
    this.#props = defaults(props, TimeCore.defaultProps);
  }

  setMedia(media: MediaTimeState & Pick<MediaBufferState, 'seekable'>): void {
    this.#media = media;
  }

  /** @internal Platform adapters set the active i18n locale for digital time formatting. */
  setFormatLocale(locale: string | string[] | undefined): void {
    this.#formatLocale = locale;
  }

  #getSeconds(): number {
    const media = this.#media!;
    const duration = getTimeRangeEnd(media);
    const { type } = this.#props;

    switch (type) {
      case 'current':
        return media.currentTime;
      case 'duration':
        return duration;
      case 'remaining':
        return media.currentTime - duration;
      default:
        return 0;
    }
  }

  #getText(): string {
    const media = this.#media!;
    const seconds = this.#getSeconds();
    const duration = getTimeRangeEnd(media);
    const options = this.#formatLocale === undefined ? undefined : { locale: this.#formatLocale };

    return formatTime(Math.abs(seconds), duration, options);
  }

  #getPhrase(): string {
    const { type } = this.#props;
    const seconds = this.#getSeconds();

    if (type === 'remaining') {
      // Use negative to trigger "remaining" suffix
      return formatTimeAsPhrase(seconds < 0 ? seconds : -Math.abs(seconds));
    }

    return formatTimeAsPhrase(seconds);
  }

  #getDatetime(): string {
    const seconds = this.#getSeconds();

    return secondsToIsoDuration(Math.abs(seconds));
  }

  #getToggleType(type: TimeType, currentType: TimeType): TimeType {
    if (type === 'current') {
      return currentType === 'remaining' ? 'current' : 'remaining';
    }

    return currentType === 'duration' ? 'remaining' : 'duration';
  }

  getLabel(state: TimeState, type = this.#props.type): Text | string {
    const custom = resolveLabel(this.#props.label, state);
    if (custom !== undefined) return custom;

    if (state.disabled || state.unavailable) return unknownText;

    if (!this.#props.toggle) {
      return DEFAULT_LABELS[this.#props.type];
    }

    const toggleType = this.#getToggleType(type, state.type);

    return TOGGLE_LABELS[toggleType];
  }

  getLabelParams(state: TimeState): { duration: string } | undefined {
    const custom = resolveLabel(this.#props.label, state);
    if (custom !== undefined || state.disabled || !this.#props.toggle) return undefined;

    const options = this.#formatLocale === undefined ? undefined : { locale: this.#formatLocale };
    const duration = formatTimeAsPhrase(Math.abs(state.seconds), options);

    switch (state.type) {
      case 'current':
        return { duration: `${duration} elapsed` };
      case 'duration':
        return { duration: `${duration} duration` };
      case 'remaining':
        return { duration: `${duration} remaining` };
    }
  }

  getDescription(state: TimeState, type = this.#props.type): Text | undefined {
    return this.#props.toggle && !state.disabled ? TOGGLE_DESCRIPTIONS[type] : undefined;
  }

  getAttrs(state: TimeState, type = this.#props.type) {
    return {
      'aria-label': this.getLabel(state, type),
      'aria-description': this.getDescription(state, type),
      'aria-disabled': this.#props.toggle && state.disabled ? 'true' : undefined,
      role: this.#props.toggle ? 'button' : undefined,
      tabIndex: this.#props.toggle ? (state.disabled ? -1 : 0) : undefined,
    };
  }

  getState(): TimeState {
    const seconds = this.#getSeconds();
    const unavailable = !hasTimeRange(this.#media!);

    return {
      type: this.#props.type,
      disabled: this.#props.toggle && unavailable,
      unavailable: !this.#props.toggle && unavailable,
      seconds,
      negative: this.#props.type === 'remaining' && seconds < 0,
      text: this.#getText(),
      phrase: this.#getPhrase(),
      datetime: this.#getDatetime(),
    };
  }
}

/** @internal */
export namespace TimeCore {
  export type Props = TimeProps;
  export type State = TimeState;
}
