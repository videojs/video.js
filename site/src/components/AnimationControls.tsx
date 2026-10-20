import { PauseIcon, PlayIcon } from '@videojs/react/icons';
import clsx from 'clsx';

import { Select } from '@/components/Select';

import './AnimationControls.css';

interface Props {
  /** Shows the pause state. Static demos toggle `data-playing` on the `[data-animation-toggle]` button instead. */
  playing?: boolean;
  onToggle?: () => void;
  /** Playback speed as a percentage. Omit to hide the speed select. */
  speed?: number;
  speeds?: number[];
  onSpeedChange?: (speed: number) => void;
  className?: string;
}

/**
 * Play/pause and optional speed controls laid over an animated example, so a reader can stop anything that loops (WCAG
 * 2.2.2). The icon and label follow `data-playing` in CSS, so the markup works with or without hydration. Render it as
 * a direct child of the example's positioned wrapper: it appears while that wrapper is hovered or holds focus.
 */
export default function AnimationControls({
  playing = false,
  onToggle,
  speed,
  speeds = [25, 100],
  onSpeedChange,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        'animation-controls pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between',
        className
      )}
    >
      <button
        type="button"
        data-animation-toggle
        data-playing={playing || undefined}
        className="group intent:bg-black/60 pointer-events-auto grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        onClick={onToggle}
      >
        <PauseIcon className="hidden size-4 group-data-playing:block" aria-hidden="true" />
        <PlayIcon className="size-4 group-data-playing:hidden" aria-hidden="true" />
        <span className="sr-only hidden group-data-playing:inline">Pause animation</span>
        <span className="sr-only group-data-playing:hidden">Play animation</span>
      </button>
      {speed !== undefined && (
        <div className="pointer-events-auto">
          <Select
            aria-label="Animation speed"
            className="h-8 shrink-0 rounded-full border-0 bg-black/50 text-white shadow-none backdrop-blur-sm"
            iconClassName="text-white/75"
            value={String(speed)}
            onChange={(value) => {
              if (value) onSpeedChange?.(Number(value));
            }}
            options={speeds.map((value) => ({ value: String(value), label: `${value}%` }))}
          />
        </div>
      )}
    </div>
  );
}
