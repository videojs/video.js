import { SKIN_SOURCES } from '@app/constants';
import { PLATFORM_LABELS, SKIN_LABELS, SKIN_SOURCE_LABELS, SKIN_SOURCE_PHRASES, STYLING_LABELS } from '@app/labels';
import { hasSkinChoice, hasTailwindSkin, MEDIA, type MediaId } from '@app/media';
import { defaultSkinSource, skinSourceAvailable, skinStylings, tailwindSkinAvailable } from '@app/shared/skin-sources';
import { SOURCES, type SourceId } from '@app/shared/sources';
import type { Platform, Skin, SkinSource, Styling } from '@app/types';

/** The one axis two compare panels differ on; every other selection is shared between them. */
export const COMPARE_AXES = ['styling', 'skins', 'skin', 'platform'] as const;
export type CompareAxis = (typeof COMPARE_AXES)[number];
export type CompareMode = 'off' | CompareAxis;

/** `auto` puts the panels side by side once the preview is wide enough for two players and stacks them below that. */
export const COMPARE_LAYOUTS = ['auto', 'row', 'column'] as const;
export type CompareLayout = (typeof COMPARE_LAYOUTS)[number];

/** The shell's skin selections; `skins` is what the user chose, or nothing for the styling's default. */
export interface SkinSelection {
  readonly platform: Platform;
  readonly styling: Styling;
  readonly skins: SkinSource | undefined;
  readonly skin: Skin;
  readonly media: MediaId;
}

/** What one frame renders. Unlike the shell's selection, `skins` is resolved. */
export interface ComparePanel {
  /** The value this panel takes on the compared axis, or `single`; names the frame in the DOM and in specs. */
  readonly id: string;
  /** The value this panel takes on the compared axis, as its header shows it. Empty for a lone panel. */
  readonly label: string;
  readonly platform: Platform;
  readonly styling: Styling;
  readonly skins: SkinSource;
  readonly skin: Skin;
}

/** The source a panel loads: the explicit choice when it publishes the styling on that platform, else the default. */
export function resolveSkinSource(platform: Platform, styling: Styling, skins: SkinSource | undefined): SkinSource {
  if (skins !== undefined && skinSourceAvailable(skins, platform) && skinStylings(platform, skins).includes(styling)) {
    return skins;
  }

  return defaultSkinSource(platform, styling);
}

/** The next source after `current` that can load this styling here, in menu order; what a source comparison shows. */
export function otherSkinSource(platform: Platform, styling: Styling, current: SkinSource): SkinSource | undefined {
  return SKIN_SOURCES.find(
    (source) =>
      source !== current && skinSourceAvailable(source, platform) && skinStylings(platform, source).includes(styling)
  );
}

/** Whether a styling can be shown at all for the media on the platform. */
function stylingAvailable(styling: Styling, platform: Platform, media: MediaId): boolean {
  return styling === 'css' || (hasTailwindSkin(media, platform) && tailwindSkinAvailable(platform));
}

function panel(
  id: string,
  label: string,
  platform: Platform,
  styling: Styling,
  skins: SkinSource | undefined,
  skin: Skin
): ComparePanel {
  return { id, label, platform, styling, skins: resolveSkinSource(platform, styling, skins), skin };
}

/** Whether an axis has two values to show for the current selection. */
export function compareAvailable(axis: CompareAxis, selection: SkinSelection): boolean {
  const { platform, styling, skins, skin, media } = selection;

  switch (axis) {
    case 'styling':
      return stylingAvailable('tailwind', platform, media);
    case 'skins':
      return (
        hasSkinChoice(media) &&
        otherSkinSource(platform, styling, resolveSkinSource(platform, styling, skins)) !== undefined
      );
    case 'skin':
      return hasSkinChoice(media) && skin !== undefined;
    // Every media has an html and a react page, so the CDN page compares those two.
    case 'platform':
      return true;
  }
}

/** The frames to render: one for the selection, or two that differ on the compared axis. */
export function comparePanels(selection: SkinSelection, compare: CompareMode): readonly ComparePanel[] {
  const { platform, styling, skins, skin, media } = selection;

  switch (compare) {
    case 'off':
      return [panel('single', '', platform, styling, skins, skin)];
    case 'styling':
      return (['css', 'tailwind'] as const).map((value) =>
        panel(value, STYLING_LABELS[value], platform, value, skins, skin)
      );
    case 'skins': {
      const current = resolveSkinSource(platform, styling, skins);
      const other = otherSkinSource(platform, styling, current) ?? current;

      return [current, other].map((value) => panel(value, SKIN_SOURCE_LABELS[value], platform, styling, value, skin));
    }
    case 'skin':
      return (['default', 'neutral'] as const).map((value) =>
        panel(value, SKIN_LABELS[value], platform, styling, skins, value)
      );
    case 'platform':
      return (['html', 'react'] as const).map((value) => {
        // The other platform may not publish this styling; it shows CSS rather than nothing.
        const panelStyling = stylingAvailable(styling, value, media) ? styling : 'css';

        return panel(value, PLATFORM_LABELS[value], value, panelStyling, skins, skin);
      });
  }
}

export interface SelectionSummary {
  readonly platform: Platform;
  readonly media: MediaId;
  readonly skin: Skin;
  readonly styling: Styling;
  readonly skins: SkinSource;
  readonly width: number;
  readonly source: SourceId;
}

/** The whole selection in words, so the preview states what it shows and a report can quote it. */
export function summarizeSelection(summary: SelectionSummary): string {
  const descriptor = MEDIA[summary.media];
  const skinned = descriptor.player !== 'background';
  const parts = [
    PLATFORM_LABELS[summary.platform],
    descriptor.label,
    ...(skinned
      ? [SKIN_LABELS[summary.skin], STYLING_LABELS[summary.styling], SKIN_SOURCE_PHRASES[summary.skins]]
      : []),
    ...(skinned ? [`${summary.width}px`] : []),
    descriptor.fixedSource ? 'fixed source' : SOURCES[summary.source].label,
  ];

  return parts.join(' · ');
}
