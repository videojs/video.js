import type { MediaTextTrack, MediaTextTrackState } from '@videojs/media';
import { createState } from '@videojs/store';
import { getCaptionOrSubtitleTracks } from '@videojs/utils/dom';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { captionsText, offText, subtitlesText } from '../../i18n/text/menu';
import type { RadioOption, RadioOptionsState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface CaptionsRadioGroupProps {
  /** Custom label for the options group. */
  label?: Text | string | ((state: CaptionsRadioGroupState) => Text | string) | undefined;
  /** Custom formatter for visible track labels. */
  formatTrack?: ((track: MediaTextTrack) => Text | string) | undefined;
  /** Whether track selection is disabled. */
  disabled?: boolean | undefined;
}

export interface CaptionsRadioGroupOption extends RadioOption {}

export interface CaptionsRadioGroupState
  extends Pick<MediaTextTrackState, 'subtitlesShowing'>, RadioOptionsState<CaptionsRadioGroupOption> {}

/** @internal */
export const CAPTIONS_OFF_VALUE = 'off';

function formatTrackLabel(track: MediaTextTrack): Text | string {
  if (track.label) return track.label;

  if (track.language) return track.language;

  return track.kind === 'captions' ? captionsText : subtitlesText;
}

/** @internal */
export class CaptionsRadioGroupCore {
  static readonly defaultProps: NonNullableObject<CaptionsRadioGroupProps> = {
    label: '',
    formatTrack: formatTrackLabel,
    disabled: false,
  };

  readonly state = createState<CaptionsRadioGroupState>({
    options: [{ value: CAPTIONS_OFF_VALUE, label: offText, disabled: false }],
    value: CAPTIONS_OFF_VALUE,
    subtitlesShowing: false,
    disabled: true,
    hidden: true,
    availability: 'unavailable',
    label: '',
  });

  #props = { ...CaptionsRadioGroupCore.defaultProps };
  #media: MediaTextTrackState | null = null;

  constructor(props?: CaptionsRadioGroupProps) {
    if (props) this.setProps(props);
  }

  setProps(props: CaptionsRadioGroupProps): void {
    this.#props = defaults(props, CaptionsRadioGroupCore.defaultProps);
  }

  getLabel(state: CaptionsRadioGroupState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    return captionsText;
  }

  getTrackLabel(track: MediaTextTrack): Text | string {
    return this.#props.formatTrack(track);
  }

  getAttrs(state: CaptionsRadioGroupState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaTextTrackState): void {
    this.#media = media;
  }

  getState(): CaptionsRadioGroupState {
    const media = this.#media!;
    const captionTracks = getCaptionOrSubtitleTracks(media.textTrackList);
    const showingIndex = captionTracks.findIndex((track) => track.mode === 'showing');
    const options: CaptionsRadioGroupOption[] = [
      { value: CAPTIONS_OFF_VALUE, label: offText, disabled: false },
      ...captionTracks.map((track) => ({
        value: track.id,
        label: this.getTrackLabel(track),
        disabled: false,
      })),
    ];

    const availability: CaptionsRadioGroupState['availability'] =
      captionTracks.length > 0 ? 'available' : 'unavailable';

    this.state.patch({
      options,
      value: showingIndex === -1 ? CAPTIONS_OFF_VALUE : captionTracks[showingIndex]!.id,
      subtitlesShowing: media.subtitlesShowing,
      disabled: this.#props.disabled || captionTracks.length === 0,
      hidden: availability === 'unavailable',
      availability,
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  select(media: MediaTextTrackState, value: string): void {
    if (this.#props.disabled) return;

    const captionTracks = getCaptionOrSubtitleTracks(media.textTrackList);
    if (!captionTracks.length) return;

    if (value === CAPTIONS_OFF_VALUE) {
      media.selectSubtitlesTrack(null);
      return;
    }

    if (!captionTracks.some((track) => track.id === value)) return;

    media.selectSubtitlesTrack(value);
  }

  selectValue(media: MediaTextTrackState, value: string): void {
    this.select(media, value);
  }
}

/** @internal */
export namespace CaptionsRadioGroupCore {
  export type Props = CaptionsRadioGroupProps;
  export type State = CaptionsRadioGroupState;
}
