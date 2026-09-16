// Real video inside a composition. `<Video>` from `@remotion/media` decodes a Mux MP4 rendition with WebCodecs
// and reports buffering through Remotion's buffer state, which the adapter turns into `waiting`/`playing` for the
// Video.js store. Motion-graphics overlays sit on top: a lower third that springs in, and a badge.

import { Video } from '@remotion/media';
import type { RemotionChapter } from '@videojs/remotion-video';
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// "Dancing Dude" from the sandbox source list: 1920×1080, 25.3 s, with audio. Static renditions are CORS-enabled.
const MUX_MP4 = 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4';

export const MUX_OVERLAY_FPS = 30;
export const MUX_OVERLAY_DURATION_IN_FRAMES = 25 * MUX_OVERLAY_FPS;
export const MUX_OVERLAY_WIDTH = 1920;
export const MUX_OVERLAY_HEIGHT = 1080;

export const MUX_OVERLAY_CHAPTERS: readonly RemotionChapter[] = [
  { title: 'Cold open', from: 0 },
  { title: 'Title card', from: 2 * MUX_OVERLAY_FPS },
  { title: 'Dance', from: 8 * MUX_OVERLAY_FPS },
  { title: 'Outro', from: 20 * MUX_OVERLAY_FPS },
];

function LowerThird({ title, subtitle }: { title: string; subtitle: string }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18 } });
  const exit = spring({ frame: frame - (durationInFrames - 20), fps, config: { damping: 18 } });
  const x = interpolate(enter, [0, 1], [-600, 0]) - interpolate(exit, [0, 1], [0, 800]);

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: 96 }}>
      <div
        style={{
          transform: `translateX(${x}px)`,
          background: 'rgba(15, 23, 42, 0.85)',
          borderLeft: '10px solid #fb7185',
          padding: '20px 36px',
          color: 'white',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>{title}</div>
        <div style={{ fontSize: 30, opacity: 0.8 }}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
}

function Badge() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'flex-end', padding: 48 }}>
      <div
        style={{
          opacity,
          padding: '10px 18px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.9)',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        Mux MP4 · Remotion · Video.js
      </div>
    </AbsoluteFill>
  );
}

export function MuxOverlay() {
  const { fps } = useVideoConfig();
  // Fade the audio in over the first second; the player's mute and volume still apply on top. The callback form is
  // what Remotion asks for when volume varies by frame.
  const volume = (frame: number) => interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <Video src={MUX_MP4} volume={volume} style={{ width: '100%', height: '100%' }} />
      <Sequence from={0} durationInFrames={20 * fps} layout="none">
        <Badge />
      </Sequence>
      <Sequence from={2 * fps} durationInFrames={6 * fps} layout="none">
        <LowerThird title="Dancing Dude" subtitle="Decoded by @remotion/media, controlled by Video.js" />
      </Sequence>
    </AbsoluteFill>
  );
}
