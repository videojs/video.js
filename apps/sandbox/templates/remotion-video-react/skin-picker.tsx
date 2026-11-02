// An in-page skin picker for a template the shell does not list. It speaks the shell's own protocol, so
// `VideoSkinComponent` needs nothing new: a skin change is streamed as a `skin-change` message and swaps live, while a
// skin source or styling change rewrites the URL and reloads, exactly as the shell does for those two selections.

import { SKIN_SOURCES, SKINS } from '@app/constants';
import { useSandbox } from '@app/shared/react/use-sandbox';
import { skinSourceAvailable, skinStylings } from '@app/shared/skin-sources';
import type { Skin, SkinSource, Styling } from '@app/types';

const LABELS: Record<Skin, string> = { default: 'Default', minimal: 'Minimal' };
const SOURCE_LABELS: Record<SkinSource, string> = { package: 'Package', registry: 'Registry', authored: 'Authored' };
const STYLING_LABELS: Record<Styling, string> = { css: 'CSS', tailwind: 'Tailwind' };

interface StylingOption {
  readonly value: `${SkinSource}/${Styling}`;
  readonly source: SkinSource;
  readonly styling: Styling;
  readonly label: string;
}

const STYLING_OPTIONS: readonly StylingOption[] = SKIN_SOURCES.filter((source) =>
  skinSourceAvailable(source, 'react')
).flatMap((source) =>
  skinStylings('react', source).map((styling) => ({
    value: `${source}/${styling}` as const,
    source,
    styling,
    label: `${SOURCE_LABELS[source]} · ${STYLING_LABELS[styling]}`,
  }))
);

function isSkin(value: string): value is Skin {
  // SAFETY: the tuple is widened to strings only for the lookup; the guard narrows the value back to `Skin`.
  return (SKINS as readonly string[]).includes(value);
}

/** Keep the URL in step so a reload, or the shell's Report button, reproduces the selection. */
function writeParams(entries: Record<string, string>) {
  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(entries)) url.searchParams.set(key, value);

  return url;
}

const SELECT_CLASS =
  'rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900';

export function SkinPicker() {
  const { skin, skins, styling } = useSandbox();

  const onSkinChange = (value: string) => {
    if (!isSkin(value)) return;

    window.history.replaceState(null, '', writeParams({ skin: value }));
    window.postMessage({ type: 'skin-change', skin: value }, '*');
  };

  const onStylingChange = (value: string) => {
    const option = STYLING_OPTIONS.find((candidate) => candidate.value === value);
    if (!option) return;

    // Styling and skin source remount the page in the shell too; a reload is the honest equivalent here.
    window.location.assign(writeParams({ skins: option.source, styling: option.styling }));
  };

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <label className="flex items-center gap-2">
        Skin
        <select className={SELECT_CLASS} value={skin} onChange={(event) => onSkinChange(event.target.value)}>
          {SKINS.map((value) => (
            <option key={value} value={value}>
              {LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        Skins from
        <select
          className={SELECT_CLASS}
          value={`${skins}/${styling}`}
          onChange={(event) => onStylingChange(event.target.value)}
        >
          {STYLING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
