// A small composition that makes frame position, seeking, and rate changes visually obvious. Nothing here is
// Video.js-specific; it is ordinary Remotion authored against `remotion` only.

import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const DEMO_FPS = 30;
// Six four-second scenes.
export const DEMO_DURATION_IN_FRAMES = 30 * 24;
export const DEMO_WIDTH = 1280;
export const DEMO_HEIGHT = 720;

const ACCENTS = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa'];
const SCENE_DURATION_IN_FRAMES = 4 * DEMO_FPS;

/** The scene layout, in frames, so the player can surface the same `<Sequence>` boundaries as chapters. */
export const DEMO_CHAPTERS = ACCENTS.map((_, index) => ({
  title: `Scene ${index + 1}`,
  from: index * SCENE_DURATION_IN_FRAMES,
  durationInFrames: SCENE_DURATION_IN_FRAMES,
}));

function Title({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: 120,
          color: 'white',
          letterSpacing: -4,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

export function DemoComposition() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  const seconds = frame / fps;
  const progress = frame / (durationInFrames - 1);
  const hue = interpolate(frame, [0, durationInFrames], [200, 320]);
  const segment = Math.floor(seconds / 4) % ACCENTS.length;
  const orbit = (frame / fps) * Math.PI * 0.5;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, hsl(${hue} 60% 18%), hsl(${hue + 40} 70% 8%))` }}>
      <div
        style={{
          position: 'absolute',
          left: width / 2 + Math.cos(orbit) * 360 - 60,
          top: 360 + Math.sin(orbit) * 200 - 60,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: ACCENTS[segment],
          boxShadow: `0 0 80px ${ACCENTS[segment]}`,
        }}
      />

      {ACCENTS.map((accent, index) => (
        <Sequence
          key={accent}
          from={index * SCENE_DURATION_IN_FRAMES}
          durationInFrames={SCENE_DURATION_IN_FRAMES}
          layout="none"
        >
          <Title text={`Scene ${index + 1}`} />
        </Sequence>
      ))}

      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 48, gap: 16 }}>
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 40,
            color: 'rgba(255,255,255,0.85)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>frame {String(frame).padStart(3, '0')}</span>
          <span>{seconds.toFixed(2)}s</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 5, background: 'white' }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
