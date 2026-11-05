import { Input } from '@base-ui/react/input';
import { Switch } from '@base-ui/react/switch';
import { useId } from 'react';

import useIsHydrated from '@/utils/useIsHydrated';

export interface PreviewOptionsProps {
  /** Show the video controls before playback starts; `null` when the preview has no video skin to apply it to. */
  controlsBeforeStart: boolean | null;
  onControlsBeforeStartChange: (value: boolean) => void;
  /** Any CSS color, or empty for the skin's own accent; `null` when the preview has no skin. */
  accentColor: string | null;
  onAccentColorChange: (value: string) => void;
}

const labelClassName = 'text-p3 text-muted cursor-pointer whitespace-nowrap';

/** The skin's public CSS properties a reader can try on the installation preview, as the sandbox's options do. */
export default function PreviewOptions({
  controlsBeforeStart,
  onControlsBeforeStartChange,
  accentColor,
  onAccentColorChange,
}: PreviewOptionsProps) {
  const controlsId = useId();
  const accentId = useId();

  if (controlsBeforeStart === null && accentColor === null) return null;

  return (
    <div className="border-line flex flex-wrap items-center gap-x-8 gap-y-3 border-t px-5 py-3 sm:px-8">
      {controlsBeforeStart !== null && (
        <div className="flex items-center gap-3">
          <label id={`${controlsId}-label`} htmlFor={controlsId} className={labelClassName}>
            Controls before start
          </label>
          {/* Base UI moves the id to its hidden checkbox, so the switch takes its name from the label directly. */}
          <Switch.Root
            id={controlsId}
            aria-labelledby={`${controlsId}-label`}
            checked={controlsBeforeStart}
            onCheckedChange={onControlsBeforeStartChange}
            className="bg-line-strong data-checked:bg-accent relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors"
          >
            <Switch.Thumb className="bg-manila-light pointer-events-none block size-4 translate-x-0.5 rounded-full shadow-xs transition-transform data-checked:translate-x-3.5" />
          </Switch.Root>
        </div>
      )}
      {accentColor !== null && <AccentColorField id={accentId} value={accentColor} onChange={onAccentColorChange} />}
    </div>
  );
}

function AccentColorField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  // Server rendering has no canvas to convert with, so the picker starts grey until hydration.
  const pickerValue = useIsHydrated() ? toPickerHex(value) : PICKER_FALLBACK;

  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className={labelClassName}>
        Accent color
      </label>
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Default"
          spellCheck={false}
          className="corner-squircle border-line bg-surface text-p3 placeholder:text-muted intent:border-line-strong focus-visible:border-line-strong h-8 w-28 rounded-lg border px-2.5 shadow-xs"
        />
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Choose accent color"
          // With no accent set, the swatch shows a stand-in color, so it fades to grey rather than look chosen.
          data-default={value.trim() ? undefined : ''}
          className="size-7 cursor-pointer rounded border-none bg-transparent p-0 data-default:opacity-50 data-default:grayscale"
        />
      </div>
    </div>
  );
}

const PICKER_FALLBACK = '#808080';

/** The native picker needs sRGB hex even when the text uses another CSS color format. */
function toPickerHex(value: string): string {
  if (!CSS.supports('color', value)) return PICKER_FALLBACK;

  const context = document.createElement('canvas').getContext('2d');
  if (!context) return PICKER_FALLBACK;

  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

  return `#${[red, green, blue].map((channel) => channel!.toString(16).padStart(2, '0')).join('')}`;
}
