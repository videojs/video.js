import { Badge } from '@app/components/ui/badge';
import { Button } from '@app/components/ui/button';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { SheetTitle } from '@app/components/ui/sheet';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@app/components/ui/sidebar';
import { Slider } from '@app/components/ui/slider';
import { Switch } from '@app/components/ui/switch';
import {
  COLOR_SCHEMES,
  type ColorScheme,
  PRELOAD_VALUES,
  type PreloadValue,
  TEXT_DIRECTIONS,
  type TextDirection,
} from '@app/constants';
import { CAPTIONS_MODES, type CaptionsMode } from '@app/shared/captions';
import { SANDBOX_LOCALE_OPTION_GROUPS, type SandboxLocaleTag } from '@app/shared/i18n/locale-meta';
import { ASPECT_RATIOS, type AspectRatio, PLAYER_WIDTH } from '@app/shared/player-frame';
import { XMarkIcon } from '@heroicons/react/16/solid';
import { type ReactNode, useId, useMemo, useRef, useState } from 'react';

import { PREFERENCE_QUERIES, type Preferences } from './report';
import { SelectField } from './select';

export type OptionsPanelProps = {
  headerHeight: number;
  /** The id the navbar's toggle points at with `aria-controls`. */
  id: string;
  width: number;
  onWidthChange: (value: number) => void;
  widthDisabled: boolean;
  ratio: AspectRatio;
  onRatioChange: (value: AspectRatio) => void;
  ratioDisabled: boolean;
  scheme: ColorScheme;
  onSchemeChange: (value: ColorScheme) => void;
  direction: TextDirection;
  onDirectionChange: (value: TextDirection) => void;
  locale: SandboxLocaleTag;
  onLocaleChange: (value: SandboxLocaleTag) => void;
  accentColor: string;
  onAccentColorChange: (value: string) => void;
  autoplay: boolean;
  onAutoplayChange: (value: boolean) => void;
  muted: boolean;
  onMutedChange: (value: boolean) => void;
  loop: boolean;
  onLoopChange: (value: boolean) => void;
  preload: PreloadValue;
  onPreloadChange: (value: PreloadValue) => void;
  captions: CaptionsMode;
  onCaptionsChange: (value: CaptionsMode) => void;
  preferences: Preferences;
};

const CAPTIONS_LABELS: Record<CaptionsMode, string> = {
  none: 'None',
  single: 'One track',
  multiple: 'Two tracks',
};

const SCHEME_LABELS: Record<ColorScheme, string> = {
  auto: 'System',
  light: 'Light',
  dark: 'Dark',
};

const DIRECTION_LABELS: Record<TextDirection, string> = {
  auto: 'Locale',
  ltr: 'Left to right',
  rtl: 'Right to left',
};

/**
 * Everything about the preview that is not the selection itself: how wide the player is, how the page looks, how the
 * media plays, and what the browser reports about its user. Sits beside the preview, so its controls never cover it.
 */
export function OptionsPanel({
  headerHeight,
  id,
  width,
  onWidthChange,
  widthDisabled,
  ratio,
  onRatioChange,
  ratioDisabled,
  scheme,
  onSchemeChange,
  direction,
  onDirectionChange,
  locale,
  onLocaleChange,
  accentColor,
  onAccentColorChange,
  autoplay,
  onAutoplayChange,
  muted,
  onMutedChange,
  loop,
  onLoopChange,
  preload,
  onPreloadChange,
  captions,
  onCaptionsChange,
  preferences,
}: OptionsPanelProps) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const close = () => {
    if (isMobile) setOpenMobile(false);
    else {
      setOpen(false);
      document.getElementById(`${id}-trigger`)?.focus();
    }
  };
  const schemeId = useId();
  const directionId = useId();
  const localeId = useId();
  const accentColorId = useId();
  const autoplayId = useId();
  const mutedId = useId();
  const loopId = useId();
  const preloadId = useId();
  const captionsId = useId();

  return (
    <Sidebar
      id={id}
      side="right"
      aria-label="Options"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          close();
        }
      }}
      className="top-14 h-[calc(100svh-3.5rem)]"
    >
      <SidebarHeader
        className="shrink-0 flex-row items-center justify-between border-b px-4"
        style={{ height: isMobile ? 48 : headerHeight }}
      >
        {isMobile ? (
          <SheetTitle className="text-sm font-semibold">Options</SheetTitle>
        ) : (
          <h2 className="text-sm font-semibold">Options</h2>
        )}
        <Button
          id={`${id}-close`}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close options"
          onClick={close}
        >
          <XMarkIcon className="size-4" aria-hidden="true" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <Section title="Preview">
          <WidthControl value={width} onChange={onWidthChange} disabled={widthDisabled} />
          <SelectField
            label="Aspect ratio"
            value={ratio}
            onChange={(value) => onRatioChange(value as AspectRatio)}
            disabled={ratioDisabled}
            options={ASPECT_RATIOS.map((value) => ({ value, label: value === 'intrinsic' ? 'Intrinsic' : value }))}
          />
          <SelectField
            id={schemeId}
            label="Color scheme"
            value={scheme}
            onChange={(value) => onSchemeChange(value as ColorScheme)}
            options={COLOR_SCHEMES.map((value) => ({ value, label: SCHEME_LABELS[value] }))}
          />
          <SelectField
            id={directionId}
            label="Direction"
            value={direction}
            onChange={(value) => onDirectionChange(value as TextDirection)}
            options={TEXT_DIRECTIONS.map((value) => ({ value, label: DIRECTION_LABELS[value] }))}
          />
          <SelectField
            id={localeId}
            label="Language"
            value={locale}
            onChange={(value) => onLocaleChange(value as SandboxLocaleTag)}
            optionGroups={SANDBOX_LOCALE_OPTION_GROUPS}
          />
          <ColorItem id={accentColorId} value={accentColor} onChange={onAccentColorChange} />
        </Section>

        <Section title="Playback">
          <SwitchItem id={autoplayId} label="Autoplay" checked={autoplay} onChange={onAutoplayChange} />
          <SwitchItem id={mutedId} label="Muted" checked={muted} onChange={onMutedChange} />
          <SwitchItem id={loopId} label="Loop" checked={loop} onChange={onLoopChange} />
          <SelectField
            id={preloadId}
            label="Preload"
            value={preload}
            onChange={(value) => onPreloadChange(value as PreloadValue)}
            options={PRELOAD_VALUES.map((value) => ({ value, label: value }))}
          />
          <SelectField
            id={captionsId}
            label="Captions"
            value={captions}
            onChange={(value) => onCaptionsChange(value as CaptionsMode)}
            options={CAPTIONS_MODES.map((value) => ({ value, label: CAPTIONS_LABELS[value] }))}
          />
        </Section>

        <Section title="Detected preferences">
          <PreferenceBadges preferences={preferences} />
        </Section>
      </SidebarContent>
    </Sidebar>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();

  return (
    <SidebarGroup role="region" aria-labelledby={headingId} className="border-b p-4">
      <SidebarGroupLabel
        render={<h3 id={headingId} />}
        className="text-muted-foreground h-auto px-0 pb-3 text-xs font-medium"
      >
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent className="grid auto-rows-[minmax(2rem,auto)] grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3">
        {children}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

type WidthControlProps = {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
};

/** The player's width in the preview: a slider with ticks where the skins' layouts change, and a field for exact widths. */
function WidthControl({ value, onChange, disabled }: WidthControlProps) {
  const id = useId();
  const dragging = useRef(false);
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (width: number) =>
    Number.isFinite(width) ? Math.min(PLAYER_WIDTH.max, Math.max(PLAYER_WIDTH.min, Math.round(width))) : value;

  return (
    <>
      <Label id={id} className="text-muted-foreground font-normal whitespace-nowrap">
        Width
      </Label>
      <div className="flex items-center gap-1 justify-self-end">
        <Input
          type="number"
          aria-label="Width in pixels"
          min={PLAYER_WIDTH.min}
          max={PLAYER_WIDTH.max}
          step={1}
          value={draft ?? value}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => {
            if (draft !== null) onChange(clamp(event.target.valueAsNumber));

            setDraft(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          className="h-8 w-20 text-right text-sm tabular-nums"
        />
        <span className="text-muted-foreground text-sm">px</span>
      </div>
      <div className="col-span-2 pb-2">
        <Slider
          aria-labelledby={id}
          aria-valuetext={`${value} pixels`}
          min={PLAYER_WIDTH.min}
          max={PLAYER_WIDTH.max}
          step={1}
          value={value}
          disabled={disabled}
          onPointerDownCapture={() => {
            dragging.current = true;
          }}
          onPointerUpCapture={() => {
            dragging.current = false;
          }}
          onPointerCancelCapture={() => {
            dragging.current = false;
          }}
          onValueChange={(next) => {
            if (typeof next !== 'number') return;

            // Snap pointer drags near skin breakpoints; keyboard and number entry stay precise.
            const stop = dragging.current ? PLAYER_WIDTH.stops.find((stop) => Math.abs(stop - next) <= 12) : undefined;

            onChange(stop ?? next);
          }}
          className="h-6"
        />
        <div aria-hidden="true" className="relative mx-2 h-1">
          {PLAYER_WIDTH.stops.map((stop) => (
            <span
              key={stop}
              className="bg-muted-foreground/50 absolute h-1 w-px"
              style={{ left: `${((stop - PLAYER_WIDTH.min) / (PLAYER_WIDTH.max - PLAYER_WIDTH.min)) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/** The preferences the skins react to, as the browser reports them; DevTools' rendering emulation flips them live. */
function PreferenceBadges({ preferences }: { preferences: Preferences }) {
  return (
    <ul className="col-span-2 flex flex-wrap gap-1" aria-label="Detected preferences">
      {PREFERENCE_QUERIES.map(([name]) => (
        <li key={name} data-active={preferences[name]}>
          <Badge variant={preferences[name] ? 'default' : 'outline'} className="text-xs">
            {name}: {preferences[name] ? 'on' : 'off'}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

type ColorItemProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

function ColorItem({ id, value, onChange }: ColorItemProps) {
  const pickerValue = useMemo(() => {
    const context = document.createElement('canvas').getContext('2d');
    if (!context || !CSS.supports('color', value)) return '#808080';

    // The native picker needs sRGB hex even when the text uses another CSS color format.
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

    return `#${[red, green, blue].map((channel) => channel!.toString(16).padStart(2, '0')).join('')}`;
  }, [value]);

  return (
    <>
      <Label htmlFor={id} className="text-muted-foreground cursor-pointer font-normal whitespace-nowrap">
        Accent color
      </Label>
      <div className="flex items-center gap-1.5 justify-self-end">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Default"
          spellCheck={false}
          className="h-8 w-24 text-sm"
        />
        <input
          type="color"
          value={pickerValue}
          disabled={!value.trim()}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Choose accent color"
          className="size-7 cursor-pointer rounded border-none bg-transparent p-0 disabled:cursor-default disabled:opacity-50"
        />
      </div>
    </>
  );
}

type SwitchItemProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function SwitchItem({ id, label, checked, onChange }: SwitchItemProps) {
  return (
    <>
      <Label htmlFor={id} className="text-muted-foreground cursor-pointer font-normal whitespace-nowrap">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="justify-self-end" />
    </>
  );
}
