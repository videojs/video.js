// The compositions the page can play, each as a `RemotionSource` the adapter accepts. The `demo` URL param
// names the current one so a link reproduces it. Each entry says what it is meant to show about Remotion inside
// Video.js, since that, not the animation, is the point of the page.

import type { RemotionSource } from '@videojs/remotion-video';
import type { ComponentType } from 'react';

import {
  BUFFER_STALL_CHAPTERS,
  BUFFER_STALL_DURATION_IN_FRAMES,
  BUFFER_STALL_FPS,
  BUFFER_STALL_HEIGHT,
  BUFFER_STALL_WIDTH,
  BufferStall,
} from './buffer-stall';
import {
  DEMO_CHAPTERS,
  DEMO_DURATION_IN_FRAMES,
  DEMO_FPS,
  DEMO_HEIGHT,
  DEMO_WIDTH,
  DemoComposition,
} from './composition';
import {
  Greeting,
  GREETING_CAPTIONS,
  GREETING_CHAPTERS,
  GREETING_DEFAULTS,
  GREETING_DURATION_IN_FRAMES,
  GREETING_FPS,
  GREETING_HEIGHT,
  GREETING_WIDTH,
} from './greeting';
import {
  MUX_OVERLAY_CHAPTERS,
  MUX_OVERLAY_DURATION_IN_FRAMES,
  MUX_OVERLAY_FPS,
  MUX_OVERLAY_HEIGHT,
  MUX_OVERLAY_WIDTH,
  MuxOverlay,
} from './mux-overlay';

/** A field the page renders for a parameterised composition; its value goes into `inputProps` under `key`. */
export interface DemoField {
  readonly key: string;
  readonly label: string;
  readonly type: 'text' | 'color';
}

export interface Demo {
  readonly label: string;
  /** One line on what the demo is meant to show about Remotion inside Video.js. */
  readonly blurb: string;
  readonly source: RemotionSource;
  /** The composition's file in this template, shown first in the source viewer. */
  readonly file: string;
  readonly fields?: readonly DemoField[];
  readonly defaultInputProps?: Record<string, unknown>;
}

// SAFETY: compositions declare their own prop types; the adapter only forwards `inputProps` as an opaque record.
const asComposition = (component: ComponentType<never> | ComponentType<Record<string, unknown>>) =>
  component as ComponentType<Record<string, unknown>>;

const DEMO_TABLE = {
  scenes: {
    label: 'Scenes → chapters',
    blurb: 'Six <Sequence> scenes surfaced as chapter markers in the time slider; seek, rate, and replay round-trip.',
    file: 'composition.tsx',
    source: {
      id: 'scenes',
      composition: {
        component: DemoComposition,
        durationInFrames: DEMO_DURATION_IN_FRAMES,
        fps: DEMO_FPS,
        compositionWidth: DEMO_WIDTH,
        compositionHeight: DEMO_HEIGHT,
      },
      chapters: DEMO_CHAPTERS,
    },
  },
  greeting: {
    label: 'Input props + captions',
    blurb:
      'Edit the name and colour while it plays: input props update live. Captions are drawn by the composition and toggled from the Video.js captions menu.',
    file: 'greeting.tsx',
    source: {
      id: 'greeting',
      composition: {
        component: asComposition(Greeting),
        durationInFrames: GREETING_DURATION_IN_FRAMES,
        fps: GREETING_FPS,
        compositionWidth: GREETING_WIDTH,
        compositionHeight: GREETING_HEIGHT,
      },
      chapters: GREETING_CHAPTERS,
      subtitles: { label: 'English', language: 'en', cues: GREETING_CAPTIONS },
    },
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'color', label: 'Colour', type: 'color' },
    ],
    defaultInputProps: { ...GREETING_DEFAULTS },
  },
  'mux-overlay': {
    label: 'Mux video + overlays',
    blurb:
      'A Mux MP4 decoded by @remotion/media with motion-graphics overlays. Buffering flows into the Video.js buffering indicator; mute and volume apply to the composition audio.',
    file: 'mux-overlay.tsx',
    source: {
      id: 'mux-overlay',
      composition: {
        component: asComposition(MuxOverlay),
        durationInFrames: MUX_OVERLAY_DURATION_IN_FRAMES,
        fps: MUX_OVERLAY_FPS,
        compositionWidth: MUX_OVERLAY_WIDTH,
        compositionHeight: MUX_OVERLAY_HEIGHT,
      },
      chapters: MUX_OVERLAY_CHAPTERS,
    },
  },
  'buffer-stall': {
    label: 'Buffer state hand-off',
    blurb:
      'Scene two holds playback with useBufferState() for four seconds; the store goes waiting and the skin shows its own buffering indicator.',
    file: 'buffer-stall.tsx',
    source: {
      id: 'buffer-stall',
      composition: {
        component: asComposition(BufferStall),
        durationInFrames: BUFFER_STALL_DURATION_IN_FRAMES,
        fps: BUFFER_STALL_FPS,
        compositionWidth: BUFFER_STALL_WIDTH,
        compositionHeight: BUFFER_STALL_HEIGHT,
      },
      chapters: BUFFER_STALL_CHAPTERS,
    },
  },
} satisfies Record<string, Demo>;

export type DemoId = keyof typeof DEMO_TABLE;

// Widened to `Demo` so optional members read uniformly; the literal table above still checks each entry's shape.
export const DEMOS: Record<DemoId, Demo> = DEMO_TABLE;

export const DEMO_IDS = Object.keys(DEMOS) as DemoId[];
export const DEFAULT_DEMO: DemoId = 'scenes';

export function isDemoId(value: string | null): value is DemoId {
  return value !== null && value in DEMOS;
}

export function readDemoFromUrl(): DemoId {
  const value = new URLSearchParams(window.location.search).get('demo');

  return isDemoId(value) ? value : DEFAULT_DEMO;
}

export function writeDemoToUrl(id: DemoId) {
  const url = new URL(window.location.href);

  url.searchParams.set('demo', id);
  window.history.replaceState(null, '', url);
}
