import type { MediaFeatureAvailability, MediaRemotePlaybackState, RemotePlaybackConnectionState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { connectingText, startText, stopText } from '../../i18n/text/cast';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface CastButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: CastButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
}

export interface CastButtonState extends ButtonState {
  /** Current cast connection state (`disconnected`, `connecting`, or `connected`). */
  connection: RemotePlaybackConnectionState;
  /** Whether casting is `available` (a device is reachable), `unavailable` (no device), or `unsupported`. */
  availability: MediaFeatureAvailability;
  /** Non-interactive but still focusable (mirrors `aria-disabled`). */
  disabled: boolean;
  /** Whether the button is hidden because the feature is unsupported. */
  hidden: boolean;
}

export class CastButtonCore {
  static readonly defaultProps: NonNullableObject<CastButtonProps> = {
    label: '',
    disabled: false,
  };

  readonly state = createState<CastButtonState>({
    connection: 'disconnected',
    availability: 'unsupported',
    disabled: true,
    hidden: true,
    label: '',
  });

  #props = { ...CastButtonCore.defaultProps };
  #media: MediaRemotePlaybackState | null = null;

  constructor(props?: CastButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: CastButtonProps): void {
    this.#props = defaults(props, CastButtonCore.defaultProps);
  }

  getLabel(state: CastButtonState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    if (state.connection === 'connected') return stopText;

    if (state.connection === 'connecting') return connectingText;

    return startText;
  }

  getAttrs(state: CastButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaRemotePlaybackState): void {
    this.#media = media;
  }

  getState(): CastButtonState {
    const media = this.#media!;
    const castSupported = !!(globalThis as any).chrome;
    const availability = castSupported ? media.remotePlaybackAvailability : 'unsupported';

    this.state.patch({
      connection: media.remotePlaybackState,
      availability,
      disabled: this.#props.disabled || availability !== 'available',
      hidden: availability === 'unsupported',
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  async toggle(media: MediaRemotePlaybackState): Promise<void> {
    this.setMedia(media);

    if (this.getState().disabled) return;

    return media.promptRemotePlayback();
  }
}

export namespace CastButtonCore {
  export type Props = CastButtonProps;
  export type State = CastButtonState;
}
