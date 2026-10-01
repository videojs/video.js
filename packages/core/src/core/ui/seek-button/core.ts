import type { MediaTimeState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { backwardText, forwardText } from '../../i18n/text/seek';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface SeekButtonProps {
  /** Seconds to seek. Positive = forward, negative = backward. Default `30`. */
  seconds?: number | undefined;
  /** Custom label for the button. */
  label?: Text | string | ((state: SeekButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
}

export type SeekButtonDirection = 'forward' | 'backward';

export interface SeekButtonState extends ButtonState {
  /** Whether a seek is in progress. */
  seeking: boolean;
  /** Whether the button seeks forward or backward. */
  direction: SeekButtonDirection;
}

/** @internal */
export class SeekButtonCore {
  static readonly defaultProps: NonNullableObject<SeekButtonProps> = {
    seconds: 30,
    label: '',
    disabled: false,
  };

  readonly state = createState<SeekButtonState>({
    seeking: false,
    direction: 'forward',
    label: '',
  });

  #props = { ...SeekButtonCore.defaultProps };
  #media: MediaTimeState | null = null;

  constructor(props?: SeekButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: SeekButtonProps): void {
    this.#props = defaults(props, SeekButtonCore.defaultProps);
  }

  getLabel(state: SeekButtonState): Text | string {
    const custom = resolveLabel(this.#props.label, state);
    if (custom !== undefined) return custom;

    return state.direction === 'backward' ? backwardText : forwardText;
  }

  getLabelParams(state: SeekButtonState): { seconds: number } | undefined {
    if (resolveLabel(this.#props.label, state) !== undefined) return undefined;

    return { seconds: Math.abs(this.#props.seconds) };
  }

  getAttrs(state: SeekButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': this.#props.disabled ? 'true' : undefined,
    };
  }

  setMedia(media: MediaTimeState): void {
    this.#media = media;
  }

  getState(): SeekButtonState {
    const media = this.#media!;
    const direction: SeekButtonDirection = this.#props.seconds < 0 ? 'backward' : 'forward';

    this.state.patch({ seeking: media.seeking, direction });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  async seek(media: MediaTimeState): Promise<void> {
    if (this.#props.disabled) return;

    await media.seek(media.currentTime + this.#props.seconds);
  }
}

/** @internal */
export namespace SeekButtonCore {
  export type Props = SeekButtonProps;
  export type State = SeekButtonState;
}
