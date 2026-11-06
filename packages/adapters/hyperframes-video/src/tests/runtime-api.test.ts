import { describe, expect, it } from 'vite-plus/test';

import { createRuntimeControl, parseRuntimeMessage } from '../runtime-api';

const FPS = { numerator: 30, denominator: 1 };

describe('createRuntimeControl', () => {
  // A v1 runtime refuses a control that declares a version without `fps` and `capabilities`.
  it('carries the protocol metadata a v1 runtime requires', () => {
    expect(createRuntimeControl('seek', FPS, { timeSeconds: 2 })).toEqual({
      timeSeconds: 2,
      source: 'hf-parent',
      type: 'control',
      action: 'seek',
      protocolVersion: 1,
      capabilities: [],
      fps: FPS,
    });
  });
});

describe('parseRuntimeMessage', () => {
  it('reads the playhead and the frame rate it was reported at', () => {
    expect(
      parseRuntimeMessage({
        source: 'hf-preview',
        type: 'state',
        currentTime: 1.5,
        isPlaying: true,
        ended: false,
        buffering: false,
        protocolVersion: 1,
        fps: { numerator: 24000, denominator: 1001 },
      })
    ).toEqual({
      type: 'state',
      currentTime: 1.5,
      isPlaying: true,
      ended: false,
      buffering: false,
      fps: { numerator: 24000, denominator: 1001 },
    });
  });

  it('reads a message without a version as v1, as the runtime does', () => {
    expect(parseRuntimeMessage({ source: 'hf-preview', type: 'ready' })).toEqual({ type: 'ready' });
  });

  it('flags a runtime speaking another protocol version', () => {
    expect(parseRuntimeMessage({ source: 'hf-preview', type: 'ready', protocolVersion: 2 })).toEqual({
      type: 'unsupported-protocol',
      version: 2,
    });
  });

  it('ignores messages from anything but the runtime, and runtime messages it does not act on', () => {
    expect(parseRuntimeMessage({ source: 'hf-parent', type: 'control', action: 'play' })).toBe(null);
    expect(parseRuntimeMessage({ source: 'hf-preview', type: 'analytics' })).toBe(null);
    expect(parseRuntimeMessage({ source: 'hf-preview', type: 'state' })).toBe(null);
    expect(parseRuntimeMessage('{"source":"hf-preview"}')).toBe(null);
  });
});
