import { describe, expect, it } from 'vite-plus/test';

import { constantTrace, GOODPUT_EFFICIENCY, newConnection, SERVER_BEHAVIORS, simulateTransfer } from '../transport.ts';

const linux = SERVER_BEHAVIORS['linux-default']!;
const trace = constantTrace(5000, 40);

describe('simulateTransfer', () => {
  it('costs one round trip plus serialization on a warm connection with a grown window', () => {
    const connection = newConnection();
    const warm = simulateTransfer(connection, trace, linux, 0, 4_000_000, 40);
    const start = warm.end;
    const timing = simulateTransfer(connection, trace, linux, start, 625_000, 40);

    expect(timing.end - start).toBeCloseTo(40 + linux.responseMs + (8 * 625_000) / 5000 / GOODPUT_EFFICIENCY, 6);
  });

  it('adds two handshake round trips and a slow-start round on a new connection', () => {
    // 16 kB exceeds the 14.6 kB initial window, so the last 1.4 kB waits a round trip.
    const timing = simulateTransfer(newConnection(), trace, linux, 0, 16_000, 40);

    expect(timing.firstByte).toBe(3 * 40 + linux.responseMs);
    expect(timing.end).toBeGreaterThan(4 * 40);
  });

  it('restarts slow start after idle only when the server does', () => {
    const elapsed = (behavior: (typeof SERVER_BEHAVIORS)[string]) => {
      const connection = newConnection();
      const warm = simulateTransfer(connection, constantTrace(80_000, 100), behavior, 0, 4_000_000, 100);
      const start = warm.end + 3000;

      return simulateTransfer(connection, constantTrace(80_000, 100), behavior, start, 1_000_000, 100).end - start;
    };

    expect(elapsed(linux)).toBeGreaterThan(3 * elapsed(SERVER_BEHAVIORS['no-restart']!));
  });
});
