// Remotion's buffer state handed to Video.js. The second scene holds playback with `useBufferState()` for a
// few seconds, the way a slow asset would; the adapter maps the Player's `waiting`/`resume` to media events, so the
// skin's buffering indicator and the store's `waiting` flag come on and go off without any Remotion UI involved.

import type { RemotionChapter } from '@videojs/remotion-video';
import { useEffect } from 'react';
import { AbsoluteFill, interpolate, Series, useBufferState, useCurrentFrame, useVideoConfig } from 'remotion';

export const BUFFER_STALL_FPS = 30;
export const BUFFER_STALL_WIDTH = 1280;
export const BUFFER_STALL_HEIGHT = 720;
export const BUFFER_STALL_DURATION_IN_FRAMES = 12 * BUFFER_STALL_FPS;
export const BUFFER_STALL_HOLD_MS = 4000;

export const BUFFER_STALL_CHAPTERS: readonly RemotionChapter[] = [
  { title: 'Playing', from: 0 },
  { title: 'Stalls for 4 s', from: 3 * BUFFER_STALL_FPS },
  { title: 'Resumes', from: 8 * BUFFER_STALL_FPS },
];

function Card({ label, background }: { label: string; background: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background,
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
        opacity,
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 36, opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>
        {seconds.toFixed(2)}s into scene
      </div>
    </AbsoluteFill>
  );
}

function SlowAsset() {
  const buffer = useBufferState();

  useEffect(() => {
    const block = buffer.delayPlayback();
    const timer = setTimeout(() => block.unblock(), BUFFER_STALL_HOLD_MS);

    return () => {
      clearTimeout(timer);
      block.unblock();
    };
  }, [buffer]);

  return <Card label="Waiting on a slow asset…" background="linear-gradient(160deg, #7c2d12, #1c1917)" />;
}

export function BufferStall() {
  const { fps } = useVideoConfig();

  return (
    <Series>
      <Series.Sequence durationInFrames={3 * fps}>
        <Card label="Playing" background="linear-gradient(160deg, #1d4ed8, #0f172a)" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={5 * fps}>
        <SlowAsset />
      </Series.Sequence>
      <Series.Sequence durationInFrames={4 * fps}>
        <Card label="Resumed" background="linear-gradient(160deg, #15803d, #052e16)" />
      </Series.Sequence>
    </Series>
  );
}
