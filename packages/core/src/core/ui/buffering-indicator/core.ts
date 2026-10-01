import type { MediaPlaybackState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

export interface BufferingIndicatorProps {
  /** Delay in milliseconds before the indicator becomes visible. */
  delay?: number | undefined;
}

export interface BufferingIndicatorState {
  /** Whether the indicator should be visible. True after the delay elapses while media is waiting and not paused. */
  visible: boolean;
}

/** @internal */
export class BufferingIndicatorCore {
  static readonly defaultProps: NonNullableObject<BufferingIndicatorProps> = {
    delay: 500,
  };

  readonly state = createState<BufferingIndicatorState>({ visible: false });

  #props = { ...BufferingIndicatorCore.defaultProps };
  #timer: ReturnType<typeof setTimeout> | null = null;

  setProps(props: BufferingIndicatorProps): void {
    this.#props = defaults(props, BufferingIndicatorCore.defaultProps);
  }

  destroy(): void {
    this.#clearTimer();
  }

  update(media: MediaPlaybackState): void {
    const buffering = media.waiting && !media.paused;

    if (buffering && !this.state.current.visible && !this.#timer) {
      this.#timer = setTimeout(() => {
        this.#timer = null;
        this.state.patch({ visible: true });
      }, this.#props.delay);
    } else if (!buffering) {
      this.#clearTimer();
      this.state.patch({ visible: false });
    }
  }

  #clearTimer(): void {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }
}

/** @internal */
export namespace BufferingIndicatorCore {
  export type Props = BufferingIndicatorProps;
  export type State = BufferingIndicatorState;
}
