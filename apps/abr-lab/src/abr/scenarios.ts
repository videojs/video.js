import type { NetworkProfile } from '../synthetic/trace.ts';
import { type CapacityTrace, generateTrace, PROFILES, seededRandom } from '../synthetic/trace.ts';
import type { PlayerConfig, SessionInputs, SessionResult } from './session.ts';
import { SERVER_BEHAVIORS } from './transport.ts';

/** The players and networks `pnpm abr` and `pnpm abr:start` simulate. */
export const LADDER = [974_600, 1_861_200, 2_953_500, 5_639_700, 7_519_600, 11_030_800, 18_393_100];
export const PLAYERS: PlayerConfig[] = [
  {
    name: 'vod-4s',
    ladderBps: LADDER,
    segmentSeconds: 4,
    targetBufferSeconds: 30,
    contentSeconds: 300,
    startupSegments: 1,
    // Wire size: Mux gzips playlists to ~63 bytes per segment (a 184-segment playlist: 59.6 kB → 11.6 kB).
    mediaPlaylistBytes: 5_000,
  },
  {
    name: 'low-latency-1s',
    ladderBps: LADDER,
    segmentSeconds: 1,
    targetBufferSeconds: 4,
    contentSeconds: 180,
    startupSegments: 2,
    mediaPlaylistBytes: 4_000,
  },
];
/** Every simulated network's level relaxes toward its mean, so sessions minutes apart stay plausible. */
const HALF_LIFE = { levelHalfLifeMinutes: 10 };

export const NETWORKS: NetworkProfile[] = [
  { ...PROFILES['wifi-steady']!, ...HALF_LIFE },
  { ...PROFILES['cable-evening']!, ...HALF_LIFE },
  { ...PROFILES.cellular!, ...HALF_LIFE },
  // Fast but far: where slow start costs the most round trips.
  {
    ...PROFILES.cellular!,
    name: 'lte-high-bdp',
    meanMbps: 30,
    latencyMs: 120,
    latencyJitterMs: 30,
    outagesPerMinute: 0.2,
    ...HALF_LIFE,
  },
  { ...PROFILES['cable-evening']!, name: 'dsl-slow', meanMbps: 4, latencyMs: 45, sigma: 0.08, ...HALF_LIFE },
];

/** One seed's world, shared by every predictor: the trace, every request's RTT, and every segment's size factor. */
export function sessionInputs(
  player: PlayerConfig,
  network: NetworkProfile,
  behavior: string,
  seed: number,
  historyMs = 0
): SessionInputs & { history: CapacityTrace } {
  const random = seededRandom(seed * 7919 + network.name.length * 31);
  const full = generateTrace(network, (player.contentSeconds + 600) * 1000 + historyMs, random);
  // The session starts `historyMs` into the trace; what came before is history a starting estimate may draw on.
  const offset = Math.round(historyMs / full.stepMs);
  const trace = { ...full, bitsPerMs: full.bitsPerMs.subarray(offset) };
  const history = { ...full, bitsPerMs: full.bitsPerMs.subarray(0, Math.max(1, offset)) };
  const requests = Math.ceil(player.contentSeconds / player.segmentSeconds) + 3;

  return {
    trace,
    history,
    behavior: SERVER_BEHAVIORS[behavior]!,
    player,
    rtts: Array.from({ length: requests }, () => trace.latencyAt(0)),
    sizeFactors: Array.from({ length: requests }, () => 0.7 + 0.6 * random()),
  };
}

export function qoe(result: SessionResult, player: PlayerConfig): number {
  const mu = Math.max(...player.ladderBps) / 1e6;
  const stallSeconds = (result.rebufferMs + result.startupMs) / 1000;

  return (
    result.meanBitrateBps / 1e6 -
    (mu * stallSeconds) / result.segments -
    result.switchMagnitudeBps / 1e6 / Math.max(1, result.segments - 1)
  );
}

export function sum(values: readonly number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

export function mean(values: readonly number[]): number {
  return sum(values) / Math.max(1, values.length);
}

export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}

export function table(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) =>
    cells.map((cell, i) => (i === 0 ? cell.padEnd(widths[i]!) : cell.padStart(widths[i]!))).join('  ');

  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}
