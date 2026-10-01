import type { MediaFeatureAvailability, MediaVolumeState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { muteText, unmuteText } from '../../i18n/text/buttons';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export type VolumeLevel = 'off' | 'low' | 'medium' | 'high';

export interface MuteButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: MuteButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
}

export interface MuteButtonState extends Pick<MediaVolumeState, 'muted'>, ButtonState {
  /**
   * Derived volume level:
   *
   * - `off`: muted or volume is 0
   * - `low`: volume < 0.5
   * - `medium`: volume < 0.75
   * - `high`: volume >= 0.75
   */
  volumeLevel: VolumeLevel;
  /** Whether the media can be muted at all. */
  availability: MediaFeatureAvailability;
  /** Whether the button is hidden because the media has no mute to toggle. */
  hidden: boolean;
}

/** @internal */
export class MuteButtonCore {
  static readonly defaultProps: NonNullableObject<MuteButtonProps> = {
    label: '',
    disabled: false,
  };

  readonly state = createState<MuteButtonState>({
    muted: false,
    volumeLevel: 'off',
    availability: 'unavailable',
    hidden: true,
    label: '',
  });

  #props = { ...MuteButtonCore.defaultProps };
  #media: MediaVolumeState | null = null;

  constructor(props?: MuteButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: MuteButtonProps): void {
    this.#props = defaults(props, MuteButtonCore.defaultProps);
  }

  getLabel(state: MuteButtonState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    return state.muted ? unmuteText : muteText;
  }

  getAttrs(state: MuteButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': this.#props.disabled ? 'true' : undefined,
    };
  }

  setMedia(media: MediaVolumeState): void {
    this.#media = media;
  }

  getState(): MuteButtonState {
    const media = this.#media!;
    // Mute has an availability of its own: a media can take a mute command while
    // offering no way to set a level, so reading the volume slider's would hide
    // a button that works.
    const availability = media.mutedAvailability;

    this.state.patch({
      muted: media.muted || media.volume === 0,
      volumeLevel: getVolumeLevel(media),
      availability,
      hidden: availability !== 'available',
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  toggle(media: MediaVolumeState): void {
    if (this.#props.disabled || media.mutedAvailability !== 'available') return;

    media.setMuted(!(media.muted || media.volume === 0));
  }
}

/** @internal */
export namespace MuteButtonCore {
  export type Props = MuteButtonProps;
  export type State = MuteButtonState;
}

function getVolumeLevel(media: MediaVolumeState): VolumeLevel {
  if (media.muted || media.volume === 0) return 'off';

  if (media.volume < 0.5) return 'low';

  if (media.volume < 0.75) return 'medium';

  return 'high';
}
