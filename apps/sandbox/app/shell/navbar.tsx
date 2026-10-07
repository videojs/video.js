import type { CompareMode } from '@app/compare';
import { Badge } from '@app/components/ui/badge';
import { Button } from '@app/components/ui/button';
import { useSidebar } from '@app/components/ui/sidebar';
import { SKINS, SKIN_SOURCES } from '@app/constants';
import { PLATFORM_LABELS, SKIN_LABELS, SKIN_SOURCE_LABELS, STYLING_LABELS } from '@app/labels';
import { hasSkinChoice, hasTailwindSkin, MEDIA, MEDIA_IDS, type MediaId } from '@app/media';
import { skinSourceAvailable, tailwindSkinAvailable } from '@app/shared/skin-sources';
import type { SandboxSource, SourceId } from '@app/shared/sources';
import type { Platform, Skin, SkinSource, Styling } from '@app/types';
import version from '@app/version';
import { Cog8ToothIcon } from '@heroicons/react/16/solid';

import { SelectField, type SelectFieldProps } from './select';

type NavbarProps = {
  platform: Platform;
  onPlatformChange: (value: Platform) => void;
  media: MediaId;
  onMediaChange: (value: MediaId) => void;
  source: SourceId;
  onSourceChange: (value: string) => void;
  availableSources: readonly SourceId[];
  platforms: readonly Platform[];
  sources: Record<SourceId, SandboxSource>;
  /** The options panel this bar's toggle opens and closes. */
  optionsId: string;
};

/** What plays: the platform, the media, and its source. The skin controls sit in the preview's header below. */
export function Navbar({
  platform,
  onPlatformChange,
  media,
  onMediaChange,
  source,
  onSourceChange,
  availableSources,
  platforms,
  sources,
  optionsId,
}: NavbarProps) {
  const { fixedSource, outcome } = MEDIA[media];
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();

  return (
    <header className="border-border bg-background flex h-14 shrink-0 items-center gap-4 border-b px-4">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 209 209" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
          <path fill="#ffa81b" d="M0 0h209v209H0z" />
          <path fill="#ff6200" d="M0 80h209v129H0z" />
          <path fill="#eb3132" d="M0 142h209v67H0z" />
          <path fill="#cc3566" d="M0 187h209v22H0z" />
          <path d="M167.09 104.5L65.13 169.81V39.19l101.96 65.31z" fill="#ebe4c1" />
        </svg>
        <span className="text-foreground text-base font-semibold tracking-tight whitespace-nowrap">Video.js</span>
        <Badge variant="outline">{version}</Badge>
      </div>

      <div className="bg-border h-5 w-px" />

      <div className="flex min-w-0 items-center gap-4 overflow-x-auto px-1 py-2">
        <Select
          label="Platform"
          value={platform}
          onChange={(v) => onPlatformChange(v as Platform)}
          options={platforms.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
        />

        <Select
          label="Media"
          value={media}
          onChange={(v) => onMediaChange(v as MediaId)}
          options={MEDIA_IDS.map((id) => ({ value: id, label: MEDIA[id].label }))}
        />

        <Select
          label="Source"
          value={source}
          onChange={onSourceChange}
          options={availableSources.map((id) => {
            const note = outcome?.(sources[id]);

            return { value: id, label: note ? `${sources[id].label} — ${note}` : sources[id].label };
          })}
          disabled={fixedSource !== undefined}
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          id={`${optionsId}-trigger`}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Options"
          aria-expanded={isMobile ? openMobile : open}
          aria-controls={optionsId}
          onClick={() => {
            toggleSidebar();

            if (!isMobile && !open) {
              requestAnimationFrame(() => document.getElementById(`${optionsId}-close`)?.focus());
            }
          }}
        >
          <Cog8ToothIcon width={16} height={16} className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          role="link"
          render={
            <a
              href="https://github.com/videojs/video.js"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub repository"
            />
          }
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
            {/* GitHub brand mark from Simple Icons (CC0). */}
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </Button>
      </div>
    </header>
  );
}

type SkinControlsProps = {
  platform: Platform;
  media: MediaId;
  styling: Styling;
  onStylingChange: (value: Styling) => void;
  skin: Skin;
  onSkinChange: (value: Skin) => void;
  skins: SkinSource;
  onSkinsChange: (value: SkinSource) => void;
  compare: CompareMode;
  onCompareChange: (value: CompareMode) => void;
  compareOptions: readonly { value: CompareMode; label: string; disabled: boolean }[];
  stylings: readonly Styling[];
};

/** How it is skinned: the skin, its styling, where the skin comes from, and what to compare it against. */
export function SkinControls({
  platform,
  media,
  styling,
  onStylingChange,
  skin,
  onSkinChange,
  skins,
  onSkinsChange,
  compare,
  onCompareChange,
  compareOptions,
  stylings,
}: SkinControlsProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 overflow-x-auto px-1 py-1">
      <Select
        label="Skin"
        value={skin}
        onChange={(v) => onSkinChange(v as Skin)}
        options={SKINS.map((value) => ({ value, label: SKIN_LABELS[value] }))}
        disabled={!hasSkinChoice(media)}
      />

      <Select
        label="Styling"
        value={styling}
        onChange={(v) => onStylingChange(v as Styling)}
        options={stylings.map((s) => ({
          value: s,
          label: STYLING_LABELS[s],
          disabled: s === 'tailwind' && !(hasTailwindSkin(media, platform) && tailwindSkinAvailable(platform)),
        }))}
      />

      <Select
        label="Skins from"
        value={skins}
        onChange={(v) => onSkinsChange(v as SkinSource)}
        options={SKIN_SOURCES.map((value) => ({
          value,
          label: SKIN_SOURCE_LABELS[value],
          disabled: !skinSourceAvailable(value, platform),
        }))}
        disabled={!hasSkinChoice(media) || platform === 'cdn'}
      />

      <Select
        label="Compare"
        value={compare}
        onChange={(v) => onCompareChange(v as CompareMode)}
        options={compareOptions.map((option) => ({ ...option }))}
      />
    </div>
  );
}

function Select(props: SelectFieldProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <SelectField {...props} />
    </div>
  );
}
