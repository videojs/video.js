import {
  DEFAULT_REGISTRY_PRESET,
  type InstallationFramework,
  type RegistryFramework,
  type RegistryPreset,
  type RegistryStyling,
  REGISTRY_PRESETS,
  type RegistryTheme,
  REGISTRY_THEMES,
  registrySkinSelection,
  registryStylings,
  resolveRegistryStyling,
} from '@videojs/installation';
import type { ReactNode } from 'react';

import FilmIcon from '@/assets/icons/film.svg?react';
import LiveStreamingIcon from '@/assets/icons/live-streaming.svg?react';
import MusicNoteIcon from '@/assets/icons/music-note.svg?react';
import RadioIcon from '@/assets/icons/radio.svg?react';
import CssLogo from '@/assets/logos/brands/css3.svg?react';
import TailwindLogo from '@/assets/logos/brands/tailwindcss.svg?react';
import CardRadioGroup from '@/components/CardRadioGroup';
import SkinPreview from '@/components/installation/SkinPreview';
import { useRegistrySkin, useRegistryStyling, useRegistryTheme } from '@/components/installation/useRegistryFramework';
import { useSelection } from '@/components/installation/useSelection';
import { withSelectionMarker } from '@/components/installation/withSelectionMarker';
import { Select } from '@/components/Select';
import { skin as installationSkin, useCase as installationUseCase } from '@/stores/installation';
import { registrySkin, registryTheme, selectRegistryStyling } from '@/stores/registry';
import { REGISTRY_STYLING_LABELS, REGISTRY_THEME_LABELS } from '@/utils/installation/registry-labels';

const STYLING_ICONS = {
  tailwind: <TailwindLogo className="w-4" />,
  css: <CssLogo className="h-4" />,
} satisfies Record<RegistryStyling, ReactNode>;

const STYLING_CARD_ICONS = {
  tailwind: <TailwindLogo className="size-7" />,
  css: <CssLogo className="h-7 w-auto" />,
} satisfies Record<RegistryStyling, ReactNode>;

/** Plain CSS leads because it works in every app; Tailwind stays the React default for new Shadcn apps. */
const STYLING_CARD_ORDER = ['css', 'tailwind'] as const satisfies readonly RegistryStyling[];

const STYLING_DESCRIPTIONS = {
  tailwind: 'Utility classes, included in new Shadcn apps',
  css: 'Plain stylesheets for apps without Tailwind',
} as const satisfies Record<RegistryStyling, string>;

const SKIN_ICONS = {
  video: <FilmIcon className="size-4" />,
  audio: <MusicNoteIcon className="size-4" />,
  'live-video': <LiveStreamingIcon className="size-4" />,
  'live-audio': <RadioIcon className="size-4" />,
} satisfies Record<RegistryPreset, ReactNode>;

const THEME_ICONS = {
  default: <SkinPreview skin="video" className="size-4" />,
  neutral: <SkinPreview skin="neutral-video" className="size-4" />,
} satisfies Record<RegistryTheme, ReactNode>;

interface Props {
  defaultSkin?: RegistryPreset;
  defaultTheme?: RegistryTheme;
  framework: InstallationFramework;
  installation: boolean;
  kind: 'catalog' | 'styling';
}

function RegistryStylingSelect({ framework }: { framework: RegistryFramework }) {
  const $styling = useRegistryStyling();
  const styling = resolveRegistryStyling(framework, $styling);

  return (
    <div className="grid shrink-0 gap-1.5">
      <p className="text-p4 font-medium">Styling</p>
      <Select
        value={styling}
        onChange={(value) => value && selectRegistryStyling(value)}
        options={registryStylings(framework).map((value) => ({
          value,
          label: REGISTRY_STYLING_LABELS[value],
          icon: STYLING_ICONS[value],
        }))}
        aria-label="Select styling"
        className="justify-self-start"
      />
    </div>
  );
}

function RegistryStylingCards({ framework }: { framework: RegistryFramework }) {
  const $styling = useRegistryStyling();
  const styling = resolveRegistryStyling(framework, $styling);

  return (
    <CardRadioGroup
      value={styling}
      onChange={selectRegistryStyling}
      options={STYLING_CARD_ORDER.filter((value) => registryStylings(framework).includes(value)).map((value) => ({
        value,
        label: REGISTRY_STYLING_LABELS[value],
        description: STYLING_DESCRIPTIONS[value],
        media: STYLING_CARD_ICONS[value],
      }))}
      aria-label="Select styling"
      minColumnWidth="15rem"
    />
  );
}

function RegistryCatalogSelects({ defaultSkin, defaultTheme, framework, installation }: Omit<Props, 'kind'>) {
  const $registrySkin = useRegistrySkin();
  const $theme = useRegistryTheme();
  const $useCase = useSelection('useCase');
  const $skin = useSelection('skin');
  const installationSelection = registrySkinSelection({ useCase: $useCase, skin: $skin });
  const selectedSkin =
    $registrySkin ?? (installation ? installationSelection?.item : defaultSkin) ?? DEFAULT_REGISTRY_PRESET;
  const installationTheme = installationSelection?.theme ?? 'default';
  const theme = $theme ?? (installation ? installationTheme : defaultTheme) ?? 'default';
  const sourceFramework: RegistryFramework = framework === 'react' ? 'react' : 'html';

  const updateInstallationSelection = (preset: RegistryPreset, nextTheme: RegistryTheme) => {
    if (!installation) return;

    const useCase = preset === 'video' ? 'default-video' : preset === 'audio' ? 'default-audio' : preset;
    const skin =
      nextTheme === 'neutral'
        ? preset === 'audio' || preset === 'live-audio'
          ? 'neutral-audio'
          : 'neutral-video'
        : preset === 'audio' || preset === 'live-audio'
          ? 'audio'
          : 'video';

    installationUseCase.set(useCase);
    installationSkin.set(skin);
  };

  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
      <div className="grid shrink-0 gap-1.5">
        <p className="text-p4 font-medium">Skin</p>
        <Select
          value={selectedSkin}
          onChange={(value) => {
            if (!value) return;

            registrySkin.set(value);
            updateInstallationSelection(value, theme);
          }}
          options={REGISTRY_PRESETS.map(({ label, preset: value }) => ({
            value,
            label,
            icon: SKIN_ICONS[value],
          }))}
          aria-label="Select skin"
          className="justify-self-start"
        />
      </div>

      <RegistryStylingSelect framework={sourceFramework} />

      <div className="grid shrink-0 gap-1.5">
        <p className="text-p4 font-medium">Theme</p>
        <Select
          value={theme}
          onChange={(value) => {
            if (!value) return;

            registryTheme.set(value);
            updateInstallationSelection(selectedSkin, value);
          }}
          options={REGISTRY_THEMES.map((value) => ({
            value,
            label: REGISTRY_THEME_LABELS[value],
            icon: THEME_ICONS[value],
          }))}
          aria-label="Select theme"
          className="justify-self-start"
        />
      </div>
    </div>
  );
}

/** Chooses the skin, styling, and theme used to add skin source. */
function RegistryOptionsClient({ defaultSkin, defaultTheme, framework, installation, kind }: Props) {
  return kind === 'catalog' ? (
    <RegistryCatalogSelects
      defaultSkin={defaultSkin}
      defaultTheme={defaultTheme}
      framework={framework}
      installation={installation}
    />
  ) : (
    <RegistryStylingCards framework={framework === 'react' ? 'react' : 'html'} />
  );
}

export default withSelectionMarker(RegistryOptionsClient);
