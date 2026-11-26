'use client';

import { Container, Controls, createPlayer, Gesture, PlaybackRateButton, PlayButton, TimeSlider } from '@videojs/react';
import { PauseIcon, PlayIcon, RestartIcon } from '@videojs/react/icons';
import { videoFeatures } from '@videojs/react/video';
import { cn } from '@videojs/utils/style';
import type { ReactNode, SVGProps } from 'react';
import { useState } from 'react';

import { frameFeature, loopFeature, snapshotFeature } from '../../features';

/**
 * A player whose store knows about frames. The stock video features keep play, pause, seek, and rate; the shared
 * features add loop, the frame index with stepping, and a snapshot of the picture on screen. None of them is
 * GIF-specific.
 */
export const { Player: GifPlayer, usePlayer: useGifPlayer } = createPlayer({
  features: [...videoFeatures, loopFeature, frameFeature, snapshotFeature],
});

export interface GifSkinProps {
  /** The `<GifVideo>` to play. */
  children?: ReactNode;
  className?: string | undefined;
  /** Hide the bottom controls; the tap gesture and the paused overlay stay. For grids and feeds. */
  minimal?: boolean | undefined;
}

const ICON_CLASS = 'size-4 fill-current';

function LoopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function StepIcon({ direction, ...props }: SVGProps<SVGSVGElement> & { direction: 'back' | 'forward' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
      style={{ transform: direction === 'back' ? 'scaleX(-1)' : undefined }}
    >
      <path d="M5 5l9 7-9 7V5z" />
      <path d="M17 5h2v14h-2z" />
    </svg>
  );
}

function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

const CONTROL_BUTTON_CLASS =
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent aria-pressed:bg-white/25 aria-pressed:text-white';

/** The GIF label every social feed puts in a corner, plus the frame counter once the file has decoded. */
function Badge() {
  const frameCount = useGifPlayer((state) => state.frameCount);
  const currentFrame = useGifPlayer((state) => state.currentFrame);

  return (
    <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide">
      <span className="rounded bg-black/60 px-1.5 py-0.5 text-white backdrop-blur-sm">GIF</span>
      {frameCount > 0 && (
        <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-white/80 tabular-nums backdrop-blur-sm">
          {currentFrame + 1}/{frameCount}
        </span>
      )}
    </div>
  );
}

/**
 * A paused GIF reads as "tap to play", so the whole surface gets one big affordance; it leaves once playing. Under
 * reduced motion the page withholds autoplay, and the caption says so until the viewer starts it themselves. That is a
 * CSS `motion-reduce` match, since the preference is a viewer fact the browser already tracks.
 */
function PausedOverlay() {
  const paused = useGifPlayer((state) => state.paused);
  const started = useGifPlayer((state) => state.started);

  if (!paused) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
      <PlayButton
        className="pointer-events-auto inline-flex size-16 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        render={(props, state) => (
          <button {...props}>
            {state.ended ? <RestartIcon className="size-8" /> : <PlayIcon className="size-8" />}
          </button>
        )}
      />
      {!started && (
        <span className="hidden rounded bg-black/55 px-2 py-0.5 text-xs text-white/90 backdrop-blur-sm motion-reduce:inline">
          Paused for reduced motion
        </span>
      )}
    </div>
  );
}

function FrameStepButtons() {
  const paused = useGifPlayer((state) => state.paused);
  const frameCount = useGifPlayer((state) => state.frameCount);
  const stepFrame = useGifPlayer((state) => state.stepFrame);
  const disabled = !paused || frameCount === 0;

  return (
    <>
      <button
        type="button"
        className={CONTROL_BUTTON_CLASS}
        aria-label="Previous frame"
        title={paused ? 'Previous frame' : 'Pause to step frames'}
        disabled={disabled}
        onClick={() => stepFrame(-1)}
      >
        <StepIcon direction="back" className={ICON_CLASS} />
      </button>
      <button
        type="button"
        className={CONTROL_BUTTON_CLASS}
        aria-label="Next frame"
        title={paused ? 'Next frame' : 'Pause to step frames'}
        disabled={disabled}
        onClick={() => stepFrame(1)}
      >
        <StepIcon direction="forward" className={ICON_CLASS} />
      </button>
    </>
  );
}

function LoopButton() {
  const loop = useGifPlayer((state) => state.loop);
  const setLoop = useGifPlayer((state) => state.setLoop);

  return (
    <button
      type="button"
      className={CONTROL_BUTTON_CLASS}
      aria-label="Loop"
      aria-pressed={loop}
      title={loop ? 'Looping' : 'Play once'}
      onClick={() => setLoop(!loop)}
    >
      <LoopIcon className={ICON_CLASS} />
    </button>
  );
}

function CopyFrameButton() {
  const copySnapshot = useGifPlayer((state) => state.copySnapshot);
  const snapshotAvailability = useGifPlayer((state) => state.snapshotAvailability);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    setStatus((await copySnapshot()) ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <button
      type="button"
      className={cn(CONTROL_BUTTON_CLASS, 'relative')}
      aria-label="Copy this frame"
      title="Copy this frame as an image"
      disabled={snapshotAvailability !== 'available'}
      onClick={() => void copy()}
    >
      <CopyIcon className={ICON_CLASS} />
      {status !== 'idle' && (
        <span
          role="status"
          className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-white"
        >
          {status === 'copied' ? 'Copied' : 'Clipboard unavailable'}
        </span>
      )}
    </button>
  );
}

/**
 * A skin for GIFs rather than videos: the first frame shows with no poster layer, a tap anywhere toggles playback, a
 * paused GIF carries one big play affordance, and the bar has what a GIF viewer wants — a frame scrubber with a frame
 * counter, frame stepping, a loop toggle, speed, and copying the still on screen — and nothing a GIF cannot do (no
 * volume, no captions, no fullscreen).
 */
export function GifSkin({ children, className, minimal = false }: GifSkinProps) {
  return (
    <Container
      className={cn(
        'gif-skin group/gif relative isolate overflow-hidden rounded-2xl bg-neutral-950 text-white select-none',
        className
      )}
    >
      {children}
      <Gesture type="tap" action="togglePaused" />
      <Badge />
      <PausedOverlay />
      {!minimal && (
        <Controls.Root>
          <Controls.Content className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-2 opacity-0 transition-opacity duration-200 group-focus-within/gif:opacity-100 group-hover/gif:opacity-100 data-[visible]:opacity-100">
            <PlayButton
              className={CONTROL_BUTTON_CLASS}
              render={(props, state) => (
                <button {...props}>
                  {state.ended ? (
                    <RestartIcon className={ICON_CLASS} />
                  ) : state.paused ? (
                    <PlayIcon className={ICON_CLASS} />
                  ) : (
                    <PauseIcon className={ICON_CLASS} />
                  )}
                </button>
              )}
            />
            <FrameStepButtons />
            <TimeSlider.Root className="relative mx-1 flex h-8 flex-1 cursor-pointer touch-none items-center">
              <TimeSlider.Track className="relative h-1 w-full overflow-hidden rounded-full bg-white/25">
                <TimeSlider.Fill className="absolute inset-y-0 left-0 w-[var(--media-slider-fill)] bg-white" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="absolute top-1/2 left-[var(--media-slider-fill)] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/gif:opacity-100" />
            </TimeSlider.Root>
            <LoopButton />
            <PlaybackRateButton
              className={cn(CONTROL_BUTTON_CLASS, 'w-auto px-2 font-mono text-xs tabular-nums')}
              render={(props, state) => <button {...props}>{state.rate}×</button>}
            />
            <CopyFrameButton />
          </Controls.Content>
        </Controls.Root>
      )}
    </Container>
  );
}
