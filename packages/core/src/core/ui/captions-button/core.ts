import type { MediaTextTrackState } from '@videojs/media';
import { createState } from '@videojs/store';
import { isCaptionOrSubtitleTrack } from '@videojs/utils/dom';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { disableText, enableText } from '../../i18n/text/captions';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface CaptionsButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: CaptionsButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
  /**
   * When true with multiple tracks, pointer activation opens a menu instead of toggling. React sets this automatically
   * inside `Menu.Trigger`.
   */
  menuTrigger?: boolean | undefined;
}

export interface CaptionsButtonState extends Pick<MediaTextTrackState, 'subtitlesShowing'>, ButtonState {
  /** Whether caption/subtitle tracks are present. */
  availability: 'available' | 'unavailable';
  /** Non-interactive but still focusable (mirrors `aria-disabled`). */
  disabled: boolean;
  /** Whether the button is hidden because no caption tracks are present. */
  hidden: boolean;
}

/** @internal */
export class CaptionsButtonCore {
  static readonly defaultProps: NonNullableObject<CaptionsButtonProps> = {
    label: '',
    disabled: false,
    menuTrigger: false,
  };

  readonly state = createState<CaptionsButtonState>({
    subtitlesShowing: false,
    availability: 'unavailable',
    // Hidden by default until tracks are reported; matches the derivation
    // invariants (`disabled = props.disabled || availability !== 'available'`,
    // `hidden = availability === 'unavailable'`).
    disabled: true,
    hidden: true,
    label: '',
  });

  #props = { ...CaptionsButtonCore.defaultProps };
  #media: MediaTextTrackState | null = null;

  constructor(props?: CaptionsButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: CaptionsButtonProps): void {
    this.#props = defaults(props, CaptionsButtonCore.defaultProps);
  }

  getLabel(state: CaptionsButtonState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    return state.subtitlesShowing ? disableText : enableText;
  }

  getAttrs(state: CaptionsButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaTextTrackState): void {
    this.#media = media;
  }

  getState(): CaptionsButtonState {
    const media = this.#media!;
    const availability: CaptionsButtonState['availability'] = media.textTrackList.some(isCaptionOrSubtitleTrack)
      ? 'available'
      : 'unavailable';

    this.state.patch({
      subtitlesShowing: media.subtitlesShowing,
      availability,
      disabled: this.#props.disabled || availability !== 'available',
      hidden: availability === 'unavailable',
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  toggle(media: MediaTextTrackState): void {
    this.setMedia(media);

    if (this.getState().disabled) return;

    if (this.#props.menuTrigger && getCaptionTrackCount(media) > 1) return;

    media.toggleSubtitles();
  }
}

function getCaptionTrackCount(media: MediaTextTrackState): number {
  return media.textTrackList.filter(isCaptionOrSubtitleTrack).length;
}

/** @internal */
export namespace CaptionsButtonCore {
  export type Props = CaptionsButtonProps;
  export type State = CaptionsButtonState;
}
