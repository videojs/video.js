import { describe, expect, it } from 'vite-plus/test';

import type { TransferRecord } from '../record.ts';
import { classifyTransfer } from '../regime.ts';

function transfer(overrides: Partial<TransferRecord> = {}): TransferRecord {
  return {
    id: 'a',
    recording: 'r',
    kind: 'segment',
    url: 'https://cdn.test/1.m4s',
    origin: { site: 'cdn.test', host: 'cdn.test', role: 'segment' },
    wall: 0,
    t: { start: 0, firstByte: 50, end: 450 },
    chunks: [[450, 500_000]],
    bytes: 500_000,
    status: 200,
    firstTouch: { rendition: false, url: true },
    overlapping: [],
    env: { visibility: 'visible' },
    ...overrides,
  };
}

describe('classifyTransfer', () => {
  it('treats an ordinary edge hit as full network evidence', () => {
    const record = transfer({ cache: { tiers: ['MISS', 'HIT'] } });

    expect(classifyTransfer(record)).toEqual({ regime: 'network', latency: 1, bandwidth: 1 });
  });

  it('flags a repeat fetch that replays the same request id as local', () => {
    const previous = transfer({ headers: { 'x-request-id': 'r1' } });
    const repeat = transfer({
      id: 'b',
      t: { start: 1000, firstByte: 1010, end: 1100 },
      headers: { 'x-request-id': 'r1' },
    });

    expect(classifyTransfer(repeat, previous).regime).toBe('local');
  });

  it('does not flag a repeat fetch with a fresh request id as local', () => {
    const previous = transfer({ headers: { 'x-request-id': 'r1' } });
    const repeat = transfer({
      id: 'b',
      t: { start: 1000, firstByte: 1050, end: 1400 },
      headers: { 'x-request-id': 'r2' },
    });

    expect(classifyTransfer(repeat, previous).regime).toBe('network');
  });

  it('flags an implausibly fast answer as local without any history', () => {
    const record = transfer({ t: { start: 0, firstByte: 1, end: 2 } });

    expect(classifyTransfer(record).regime).toBe('local');
  });

  it('keeps bandwidth but drops latency evidence from a miss at every tier', () => {
    const record = transfer({ cache: { tiers: ['MISS', 'MISS'] }, firstTouch: { rendition: true, url: true } });

    expect(classifyTransfer(record)).toEqual({ regime: 'origin', latency: 0, bandwidth: 1 });
  });

  it('keeps bandwidth but halves latency evidence on an edge-only miss', () => {
    const record = transfer({ cache: { tiers: ['HIT', 'MISS'] } });

    expect(classifyTransfer(record)).toEqual({ regime: 'cdn-miss', latency: 0.5, bandwidth: 1 });
  });

  it('ignores held LL-HLS requests entirely', () => {
    expect(classifyTransfer(transfer({ heldByServer: true })).regime).toBe('held');
  });
});
