// A parameterised composition in the spirit of the Remotion docs landing demo. Two input props, `name` and
// `color`, drive four scenes; editing them in the page updates the composition live while the Video.js chrome keeps
// playing. It also carries word-timed captions that the composition draws itself, switched on and off by the player's
// captions menu through the Video.js store.

import { selectTextTrack, useOptionalPlayer } from '@videojs/react';
import type { RemotionCaption, RemotionChapter } from '@videojs/remotion-video';
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const GREETING_FPS = 30;
export const GREETING_WIDTH = 1280;
export const GREETING_HEIGHT = 720;

const SCENES = [
  { title: 'Hello', from: 0, durationInFrames: 90 },
  { title: 'Palette', from: 90, durationInFrames: 90 },
  { title: 'Hex', from: 180, durationInFrames: 90 },
  { title: 'Channels', from: 270, durationInFrames: 90 },
] as const;

export const GREETING_DURATION_IN_FRAMES = 360;
export const GREETING_CHAPTERS: readonly RemotionChapter[] = SCENES;

export interface GreetingProps {
  name: string;
  color: string;
}

export const GREETING_DEFAULTS: GreetingProps = { name: 'there', color: '#4098f5' };

/** Word-timed narration, one cue per phrase; the composition highlights the word under the playhead. */
export const GREETING_CAPTIONS: readonly RemotionCaption[] = [
  { text: 'Say hello to your favourite colour.', startMs: 400, endMs: 2800 },
  { text: 'Lighter tints and darker shades sit beside it.', startMs: 3200, endMs: 5800 },
  { text: 'This is its hex code.', startMs: 6200, endMs: 8600 },
  { text: 'And these are its red, green, and blue channels.', startMs: 9200, endMs: 11800 },
];

// ----------------------------------------
// Colour helpers (small on purpose; no colour library)
// ----------------------------------------

function parseHex(color: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return null;

  const value = Number.parseInt(match[1]!, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mix([r, g, b]: [number, number, number], target: number, amount: number) {
  const channel = (c: number) => Math.round(c + (target - c) * amount);

  return `rgb(${channel(r)} ${channel(g)} ${channel(b)})`;
}

function readable([r, g, b]: [number, number, number]) {
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#111' : '#fff';
}

// ----------------------------------------
// Scenes
// ----------------------------------------

function Hello({ name }: { name: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200 } });
  const translate = interpolate(rise, [0, 1], [400, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', color: 'white' }}>
      {/* Fade with the rise so the first frame, which doubles as the poster, does not show the title peeking in. */}
      <div style={{ transform: `translateY(${translate}px)`, opacity: rise, textAlign: 'center' }}>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>Hi {name || 'there'}!</div>
        <div style={{ fontSize: 40, opacity: 0.8, marginTop: 12 }}>Your favourite colour is</div>
      </div>
    </AbsoluteFill>
  );
}

function Palette({ rgb }: { rgb: [number, number, number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const swatches = [mix(rgb, 255, 0.4), mix(rgb, 255, 0.2), mix(rgb, 0, 0), mix(rgb, 0, 0.2), mix(rgb, 0, 0.4)];
  const zoom = interpolate(frame, [0, 60, 90], [0.9, 1.4, 6], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 16, transform: `scale(${zoom})` }}>
        {swatches.map((swatch, index) => {
          const grow = spring({ frame: frame - index * 4, fps, config: { damping: 14 } });

          return (
            <div
              key={swatch}
              style={{ width: 120, height: 200 * grow, borderRadius: 16, background: swatch, opacity: grow }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function Hex({ color, rgb }: { color: string; rgb: [number, number, number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', background: color }}>
      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 160,
          fontWeight: 700,
          color: readable(rgb),
          transform: `scale(${pop})`,
        }}
      >
        {color.toUpperCase()}
      </div>
    </AbsoluteFill>
  );
}

function Channels({ rgb }: { rgb: [number, number, number] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const labels = ['R', 'G', 'B'];
  const fills = ['#ef4444', '#22c55e', '#3b82f6'];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 48, flexDirection: 'row' }}>
      {rgb.map((value, index) => {
        const grow = spring({ frame: frame - index * 6, fps, config: { damping: 16 } });
        const height = 40 + value * 1.4 * grow;

        return (
          <div key={labels[index]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ color: 'white', fontSize: 40, opacity: grow }}>{value}</div>
            <div style={{ width: 140, height, borderRadius: 20, background: fills[index] }} />
            <div style={{ color: 'white', fontSize: 40, fontWeight: 700 }}>{labels[index]}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ----------------------------------------
// Captions drawn by the composition, toggled by the Video.js captions menu
// ----------------------------------------

function Captions({ cues, visible }: { cues: readonly RemotionCaption[]; visible: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const cue = cues.find((candidate) => nowMs >= candidate.startMs && nowMs < candidate.endMs);
  if (!visible || !cue) return null;

  const words = cue.text.split(' ');
  const wordMs = (cue.endMs - cue.startMs) / words.length;
  const activeIndex = Math.min(words.length - 1, Math.floor((nowMs - cue.startMs) / wordMs));

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 72 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 14px',
          maxWidth: 1000,
          padding: '12px 24px',
          borderRadius: 16,
          background: 'rgba(0,0,0,0.55)',
          fontSize: 44,
          fontWeight: 700,
          color: 'white',
        }}
      >
        {words.map((word, index) => (
          <span key={`${index}-${word}`} style={{ color: index === activeIndex ? '#fde047' : 'white' }}>
            {word}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ----------------------------------------
// Composition
// ----------------------------------------

export function Greeting(props: Record<string, unknown>) {
  const name = typeof props.name === 'string' ? props.name : GREETING_DEFAULTS.name;
  const color = typeof props.color === 'string' ? props.color : GREETING_DEFAULTS.color;
  const rgb = parseHex(color);
  // The composition renders inside the Video.js player tree, so it can read the store directly. Outside one, it falls
  // back to the `showCaptions` input prop.
  const textTrack = useOptionalPlayer(selectTextTrack);
  const captionsVisible = textTrack?.subtitlesShowing ?? props.showCaptions === true;

  if (!rgb) {
    return (
      <AbsoluteFill
        style={{ background: '#0f172a', color: 'white', justifyContent: 'center', alignItems: 'center', fontSize: 40 }}
      >
        Pass a six-digit hex colour like #ffaa00
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${mix(rgb, 0, 0.7)}, #0b1020)`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].durationInFrames}>
        <Hello name={name} />
      </Sequence>
      <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].durationInFrames}>
        <Palette rgb={rgb} />
      </Sequence>
      <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].durationInFrames}>
        <Hex color={color} rgb={rgb} />
      </Sequence>
      <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].durationInFrames}>
        <Channels rgb={rgb} />
      </Sequence>
      <Captions cues={GREETING_CAPTIONS} visible={captionsVisible} />
    </AbsoluteFill>
  );
}
