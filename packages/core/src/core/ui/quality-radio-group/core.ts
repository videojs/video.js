import type { MediaQualityState, MediaVideoRendition } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { autoText, autoWithLabelText, qualityText } from '../../i18n/text/menu';
import type { RadioOption, RadioOptionsState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface QualityRadioGroupProps {
  /** Custom label for the options group. */
  label?: Text | string | ((state: QualityRadioGroupState) => Text | string) | undefined;
  /** Custom formatter for visible rendition labels. */
  formatRendition?: ((rendition: MediaVideoRendition) => Text | string) | undefined;
  /** Whether quality selection is disabled. */
  disabled?: boolean | undefined;
}

export interface QualityRadioGroupOption extends RadioOption {
  tier?: string | undefined;
  badge?: string | undefined;
}

export interface QualityRadioGroupState extends RadioOptionsState<QualityRadioGroupOption> {}

export const QUALITY_AUTO_VALUE = 'auto';

const STANDARD_RENDITION_SIZES: readonly number[] = [4320, 2160, 1440, 1080, 720, 480, 360, 240];

function formatBitrate(bitrate: number): string {
  return bitrate >= 1_000_000 ? `${Math.round(bitrate / 100_000) / 10} Mbps` : `${Math.round(bitrate / 1000)} kbps`;
}

function getWidescreenSize(width: number): number | undefined {
  const size = Math.round((width * 9) / 16);

  return STANDARD_RENDITION_SIZES.includes(size) ? size : undefined;
}

function getRenditionSize(rendition: MediaVideoRendition): number | undefined {
  const { width, height } = rendition;

  if (width && height) {
    // 4:3 and portrait renditions use their actual vertical-ish size. For wider-than-16:9
    // cinematic encodes, snap to a known 16:9 class only when the width maps cleanly.
    if (width > height && width * 9 > height * 16) return getWidescreenSize(width) ?? height;

    return Math.min(width, height);
  }

  if (height) return height;

  if (width) return getWidescreenSize(width) ?? width;

  return undefined;
}

function hasSameSize(rendition: MediaVideoRendition, renditions: readonly MediaVideoRendition[]): boolean {
  const size = getRenditionSize(rendition);

  return Boolean(size && renditions.some((other) => other !== rendition && getRenditionSize(other) === size));
}

function formatRenditionLabel(rendition: MediaVideoRendition): Text | string {
  const size = getRenditionSize(rendition);
  if (size) return `${size}p`;

  if (rendition.bitrate) return formatBitrate(rendition.bitrate);

  return qualityText;
}

function formatRenditionBadge(
  rendition: MediaVideoRendition,
  renditions: readonly MediaVideoRendition[] = []
): string | undefined {
  if (!getRenditionSize(rendition) || !rendition.bitrate || !hasSameSize(rendition, renditions)) return undefined;

  return formatBitrate(rendition.bitrate);
}

function formatRenditionTier(rendition: MediaVideoRendition): string | undefined {
  const size = getRenditionSize(rendition);
  if (!size) return undefined;

  if (size >= 4320) return '8K';

  if (size >= 2160) return '4K';

  if (size >= 1080) return 'HD';

  return undefined;
}

export class QualityRadioGroupCore {
  static readonly defaultProps: NonNullableObject<QualityRadioGroupProps> = {
    label: '',
    formatRendition: formatRenditionLabel,
    disabled: false,
  };

  readonly state = createState<QualityRadioGroupState>({
    options: [{ value: QUALITY_AUTO_VALUE, label: autoText, disabled: false }],
    value: QUALITY_AUTO_VALUE,
    disabled: true,
    hidden: true,
    availability: 'unavailable',
    label: '',
  });

  #props = { ...QualityRadioGroupCore.defaultProps };
  #media: MediaQualityState | null = null;

  constructor(props?: QualityRadioGroupProps) {
    if (props) this.setProps(props);
  }

  setProps(props: QualityRadioGroupProps): void {
    this.#props = defaults(props, QualityRadioGroupCore.defaultProps);
  }

  getLabel(state: QualityRadioGroupState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    return qualityText;
  }

  getRenditionLabel(rendition: MediaVideoRendition): Text | string {
    if (this.#props.formatRendition !== QualityRadioGroupCore.defaultProps.formatRendition) {
      return this.#props.formatRendition(rendition);
    }

    return formatRenditionLabel(rendition);
  }

  getRenditionBadge(
    rendition: MediaVideoRendition,
    renditions: readonly MediaVideoRendition[] = []
  ): string | undefined {
    if (this.#props.formatRendition !== QualityRadioGroupCore.defaultProps.formatRendition) return undefined;

    return formatRenditionBadge(rendition, renditions);
  }

  getRenditionTier(rendition: MediaVideoRendition): string | undefined {
    if (this.#props.formatRendition !== QualityRadioGroupCore.defaultProps.formatRendition) return undefined;

    return formatRenditionTier(rendition);
  }

  getAttrs(state: QualityRadioGroupState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaQualityState): void {
    this.#media = media;
  }

  getState(): QualityRadioGroupState {
    const media = this.#media!;
    const selectedIndex = media.videoRenditionList.findIndex((rendition) => rendition.selected);
    const availability: QualityRadioGroupState['availability'] =
      media.videoRenditionList.length > 1 ? 'available' : 'unavailable';
    const toOption = (rendition: MediaVideoRendition): QualityRadioGroupOption => {
      const tier = this.getRenditionTier(rendition);
      const badge = this.getRenditionBadge(rendition, media.videoRenditionList);

      return {
        value: rendition.id,
        label: this.getRenditionLabel(rendition),
        disabled: false,
        ...(tier && { tier }),
        ...(badge && { badge }),
      };
    };
    const { activeVideoRendition } = media;
    const active =
      activeVideoRendition && media.videoRenditionList.some((rendition) => rendition.id === activeVideoRendition.id)
        ? toOption(activeVideoRendition)
        : undefined;
    const autoOption: QualityRadioGroupOption = {
      value: QUALITY_AUTO_VALUE,
      label: selectedIndex === -1 && active ? autoWithLabelText : autoText,
      disabled: false,
      ...(selectedIndex === -1 && active && { labelParams: { label: resolveText(active.label) } }),
    };

    this.state.patch({
      options: [autoOption, ...media.videoRenditionList.map(toOption)],
      value: selectedIndex === -1 ? QUALITY_AUTO_VALUE : media.videoRenditionList[selectedIndex]!.id,
      disabled: this.#props.disabled || availability === 'unavailable',
      hidden: availability === 'unavailable',
      availability,
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  select(media: MediaQualityState, value: string): void {
    if (this.#props.disabled) return;

    if (value === QUALITY_AUTO_VALUE) {
      media.selectVideoRendition(value);
      return;
    }

    const hasValue = media.videoRenditionList.some((rendition) => rendition.id === value);
    if (!hasValue) return;

    media.selectVideoRendition(value);
  }

  selectValue(media: MediaQualityState, value: string): void {
    this.select(media, value);
  }
}

export namespace QualityRadioGroupCore {
  export type Props = QualityRadioGroupProps;
  export type State = QualityRadioGroupState;
}
