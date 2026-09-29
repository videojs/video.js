import type { MediaFeatureAvailability, MediaRemotePlaybackState, RemotePlaybackConnectionState } from '@videojs/media';
import { createState } from '@videojs/store';
import { supportsWebKitAirPlay } from '@videojs/utils/dom';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { startText, stopText } from '../../i18n/text/airplay';
import { connectingText } from '../../i18n/text/cast';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface AirPlayButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: AirPlayButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
}

export interface AirPlayButtonState extends ButtonState {
  /** Current AirPlay connection state. */
  state: RemotePlaybackConnectionState;
  /** Whether AirPlay is available on the active platform and media. */
  availability: MediaFeatureAvailability;
  /** Non-interactive but still focusable (mirrors `aria-disabled`). */
  disabled: boolean;
  /** Whether the button is hidden until AirPlay is available. */
  hidden: boolean;
}

export class AirPlayButtonCore {
  static readonly defaultProps: NonNullableObject<AirPlayButtonProps> = {
    label: '',
    disabled: false,
  };

  readonly state = createState<AirPlayButtonState>({
    state: 'disconnected',
    availability: 'unsupported',
    disabled: true,
    hidden: true,
    label: '',
  });

  #props = { ...AirPlayButtonCore.defaultProps };
  #media: MediaRemotePlaybackState | null = null;

  constructor(props?: AirPlayButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: AirPlayButtonProps): void {
    this.#props = defaults(props, AirPlayButtonCore.defaultProps);
  }

  getLabel(state: AirPlayButtonState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    if (state.state === 'connected') return stopText;

    if (state.state === 'connecting') return connectingText;

    return startText;
  }

  getAttrs(state: AirPlayButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaRemotePlaybackState): void {
    this.#media = media;
  }

  getState(): AirPlayButtonState {
    const media = this.#media!;
    // WebKit (Safari macOS/iOS) is the only platform that surfaces AirPlay.
    // Mirrors the Chromium gate on CastButtonCore so each button only shows
    // on its supported platform.
    const airPlaySupported = supportsWebKitAirPlay();
    const availability = airPlaySupported ? media.remotePlaybackAvailability : 'unsupported';

    this.state.patch({
      state: media.remotePlaybackState,
      availability,
      disabled: this.#props.disabled || availability !== 'available',
      hidden: availability !== 'available',
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  async toggle(media: MediaRemotePlaybackState): Promise<void> {
    this.setMedia(media);

    if (this.getState().disabled) return;

    try {
      await media.promptRemotePlayback();
    } catch {
      // AirPlay requests can fail (user cancelled, permissions, etc.)
    }
  }
}

export namespace AirPlayButtonCore {
  export type Props = AirPlayButtonProps;
  export type State = AirPlayButtonState;
}
