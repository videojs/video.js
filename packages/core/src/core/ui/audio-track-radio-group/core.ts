import type { MediaAudioTrack, MediaAudioTrackState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { audioText } from '../../i18n/text/menu';
import type { RadioOption, RadioOptionsState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface AudioTrackRadioGroupProps {
  /** Custom label for the options group. */
  label?: Text | string | ((state: AudioTrackRadioGroupState) => Text | string) | undefined;
  /** Custom formatter for visible track labels. */
  formatTrack?: ((track: MediaAudioTrack) => Text | string) | undefined;
  /** Whether audio track selection is disabled. */
  disabled?: boolean | undefined;
}

export interface AudioTrackRadioGroupOption extends RadioOption {}

export interface AudioTrackRadioGroupState extends RadioOptionsState<AudioTrackRadioGroupOption> {}

function formatTrackLabel(track: MediaAudioTrack): Text | string {
  if (track.label) return track.label;

  if (track.language) return track.language;

  if (track.kind) return track.kind;

  return audioText;
}

export class AudioTrackRadioGroupCore {
  static readonly defaultProps: NonNullableObject<AudioTrackRadioGroupProps> = {
    label: '',
    formatTrack: formatTrackLabel,
    disabled: false,
  };

  readonly state = createState<AudioTrackRadioGroupState>({
    options: [],
    value: '',
    disabled: true,
    hidden: true,
    availability: 'unavailable',
    label: '',
  });

  #props = { ...AudioTrackRadioGroupCore.defaultProps };
  #media: MediaAudioTrackState | null = null;

  constructor(props?: AudioTrackRadioGroupProps) {
    if (props) this.setProps(props);
  }

  setProps(props: AudioTrackRadioGroupProps): void {
    this.#props = defaults(props, AudioTrackRadioGroupCore.defaultProps);
  }

  getLabel(state: AudioTrackRadioGroupState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    return audioText;
  }

  getTrackLabel(track: MediaAudioTrack): Text | string {
    return this.#props.formatTrack(track);
  }

  getAttrs(state: AudioTrackRadioGroupState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaAudioTrackState): void {
    this.#media = media;
  }

  getState(): AudioTrackRadioGroupState {
    const media = this.#media!;
    const enabledIndex = media.audioTrackList.findIndex((track) => track.enabled);
    const options = media.audioTrackList.map((track) => ({
      value: track.id,
      label: this.getTrackLabel(track),
      disabled: false,
    }));
    const availability: AudioTrackRadioGroupState['availability'] = options.length > 1 ? 'available' : 'unavailable';

    this.state.patch({
      options,
      value: enabledIndex === -1 ? '' : media.audioTrackList[enabledIndex]!.id,
      disabled: this.#props.disabled || availability === 'unavailable',
      hidden: availability === 'unavailable',
      availability,
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  select(media: MediaAudioTrackState, value: string): void {
    if (this.#props.disabled) return;

    const hasValue = media.audioTrackList.some((track) => track.id === value);
    if (!hasValue) return;

    media.selectAudioTrack(value);
  }

  selectValue(media: MediaAudioTrackState, value: string): void {
    this.select(media, value);
  }
}

export namespace AudioTrackRadioGroupCore {
  export type Props = AudioTrackRadioGroupProps;
  export type State = AudioTrackRadioGroupState;
}
