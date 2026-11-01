import type { Predictor } from '../predictors/predictor.ts';
import type { TransferRecord } from '../record.ts';
import { classifyTransfer } from '../regime.ts';
import type { CapacityTrace } from '../synthetic/trace.ts';
import { type Connection, constantTrace, newConnection, type ServerBehavior, simulateTransfer } from './transport.ts';

export interface PlayerConfig {
  name: string;
  ladderBps: readonly number[];
  segmentSeconds: number;
  /** Fetching pauses at this much buffer and resumes one segment below it. */
  targetBufferSeconds: number;
  contentSeconds: number;
  /** Playback starts once this many segments are buffered. */
  startupSegments: number;
  /** Media playlist size; Mux VOD playlists carry ~330 bytes of signed URL per segment. Defaults to 12 kB. */
  mediaPlaylistBytes?: number;
}

export interface SessionInputs {
  trace: CapacityTrace;
  behavior: ServerBehavior;
  player: PlayerConfig;
  /** Per-request RTT and per-segment size factor, drawn once per seed so every predictor faces the same session. */
  rtts: readonly number[];
  sizeFactors: readonly number[];
}

export interface SessionResult {
  startupMs: number;
  rebufferMs: number;
  rebuffers: number;
  meanBitrateBps: number;
  /** Mean bitrate over the first 20 s of content: what startup decisions bought. */
  earlyBitrateBps: number;
  /** Stall time while fetching the first 20 s of content. */
  earlyRebufferMs: number;
  switches: number;
  /** Sum of |bitrate change| between consecutive segments, bits/s. */
  switchMagnitudeBps: number;
  segments: number;
}

/**
 * The ABR rule, shared by every predictor so only the forecast differs. `throughput` picks the highest rung whose
 * median forecast fits `safety` of a segment and, while playing, of the buffer. `mpc` plans `MPC_HORIZON` segments
 * ahead with the forecasts and takes the first step of the best plan, scored like `qoe` in the CLI.
 */
export type Oracle = 'oracle' | 'oracle-now';

export type AbrRule = { kind: 'throughput'; safety: number } | { kind: 'mpc' };

const MPC_HORIZON = 3;
const MANIFEST_HOST = 'manifest.test';
const SEGMENT_HOST = 'chunk.test';

/**
 * Plays one session: two playlist fetches on the manifest host, then segments on a separate chunk host, as Mux serves
 * them. The ABR rule picks the highest rung whose median forecast fits `SAFETY` of a segment duration and, while
 * playing, the buffer. `predictor` is `'oracle'` to forecast with the true transfer time instead, or `'oracle-now'` to
 * forecast with perfect knowledge of the present (this request's RTT, the connection's window, the capacity at decision
 * time) and none of the future: the best any estimator built from history could do.
 */
export function runSession(inputs: SessionInputs, predictor: Predictor | Oracle, rule: AbrRule): SessionResult {
  const { trace, behavior, player, rtts, sizeFactors } = inputs;
  const connections: Record<string, Connection> = { [MANIFEST_HOST]: newConnection(), [SEGMENT_HOST]: newConnection() };
  const segmentCount = Math.ceil(player.contentSeconds / player.segmentSeconds);
  const rungs: number[] = [];
  let now = 0;
  let lastEnd: number | undefined;
  let request = 0;
  let buffer = 0;
  let playing = false;
  let startupMs = 0;
  let rebufferMs = 0;
  let rebuffers = 0;
  let earlyRebufferMs = 0;
  const earlySegments = Math.max(1, Math.round(20 / player.segmentSeconds));

  const fetch = (host: string, bytes: number, kind: TransferRecord['kind'], renditionId?: string) => {
    const rtt = rtts[request++ % rtts.length]!;
    const timing = simulateTransfer(connections[host]!, trace, behavior, now, bytes, rtt);
    const record: TransferRecord = {
      id: String(request),
      recording: 'sim',
      kind,
      trackType: kind === 'segment' ? 'video' : undefined,
      url: `https://${host}/${request}`,
      origin: { site: 'test', cdn: 'sim', host, role: kind === 'segment' ? 'segment' : 'playlist' },
      renditionId,
      wall: now,
      t: { start: now, firstByte: timing.firstByte, end: timing.end },
      chunks: timing.chunks,
      bytes,
      status: 200,
      firstTouch: { rendition: renditionId !== undefined && !rungs.includes(Number(renditionId)), url: true },
      idleGapMs: lastEnd === undefined ? undefined : now - lastEnd,
      overlapping: [],
      env: { visibility: 'visible' },
    };

    if (typeof predictor !== 'string') predictor.observe(record, classifyTransfer(record));

    lastEnd = timing.end;
    return timing;
  };

  // The multivariant and media playlists: small, and the only evidence before the first segment.
  // Mux's multivariant playlist: 20 kB, 6.9 kB gzipped on the wire.
  now = fetch(MANIFEST_HOST, 6900, 'playlist').end;
  now = fetch(MANIFEST_HOST, player.mediaPlaylistBytes ?? 12_000, 'playlist').end;

  for (let index = 0; index < segmentCount; index++) {
    if (buffer >= player.targetBufferSeconds) {
      const waitSeconds = buffer - (player.targetBufferSeconds - player.segmentSeconds);

      now += waitSeconds * 1000;
      buffer -= waitSeconds;
    }

    const rung = choose();
    const bytes = Math.round(
      ((player.ladderBps[rung]! * player.segmentSeconds) / 8) * sizeFactors[index % sizeFactors.length]!
    );
    const timing = fetch(SEGMENT_HOST, bytes, 'segment', String(rung));
    const elapsed = (timing.end - now) / 1000;

    if (playing && elapsed > buffer) {
      rebufferMs += (elapsed - buffer) * 1000;
      rebuffers++;

      if (index < earlySegments) earlyRebufferMs += (elapsed - buffer) * 1000;

      buffer = 0;
    } else if (playing) {
      buffer -= elapsed;
    }

    buffer += player.segmentSeconds;
    now = timing.end;
    rungs.push(rung);

    if (!playing && buffer >= player.startupSegments * player.segmentSeconds) {
      playing = true;
      startupMs = now;
    }
  }

  const bitrates = rungs.map((r) => player.ladderBps[r]!);
  const early = bitrates.slice(0, earlySegments);

  return {
    startupMs,
    rebufferMs,
    rebuffers,
    meanBitrateBps: mean(bitrates),
    earlyBitrateBps: mean(early),
    earlyRebufferMs,
    switches: rungs.filter((r, i) => i > 0 && r !== rungs[i - 1]).length,
    switchMagnitudeBps: bitrates.reduce((sum, b, i) => (i === 0 ? 0 : sum + Math.abs(b - bitrates[i - 1]!)), 0),
    segments: rungs.length,
  };

  function choose(): number {
    const at = now;
    const rtt = rtts[request % rtts.length]!;
    const forecasts = player.ladderBps.map((bps) => {
      const nominal = (bps * player.segmentSeconds) / 8;

      return typeof predictor === 'string'
        ? trueTime(nominal, rtt, predictor === 'oracle-now')
        : predictor
            .forecast({
              bytes: nominal,
              host: SEGMENT_HOST,
              at,
              idleGapMs: lastEnd === undefined ? undefined : at - lastEnd,
            })
            .quantile(0.5);
    });

    return rule.kind === 'mpc' ? planAhead(forecasts) : fastestFitting(forecasts, rule.safety);
  }

  function fastestFitting(forecasts: number[], safety: number): number {
    let best = 0;

    forecasts.forEach((forecastMs, rung) => {
      const fitsSegment = forecastMs <= safety * player.segmentSeconds * 1000;
      const fitsBuffer = !playing || forecastMs <= safety * buffer * 1000;

      if (fitsSegment && fitsBuffer) best = rung;
    });

    return best;
  }

  /** Exhaustive search over the horizon, holding each rung's forecast fixed; a stall before playback counts as startup. */
  function planAhead(forecasts: number[]): number {
    const mu = Math.max(...player.ladderBps) / 1e6;
    const previous = rungs.at(-1);
    let bestScore = -Infinity;
    let bestFirst = 0;

    const search = (
      depth: number,
      level: number,
      started: boolean,
      last: number | undefined,
      score: number,
      first: number
    ) => {
      if (depth === MPC_HORIZON) {
        if (score > bestScore) [bestScore, bestFirst] = [score, first];

        return;
      }

      for (let rung = 0; rung < forecasts.length; rung++) {
        const seconds = forecasts[rung]! / 1000;
        const stall = started ? Math.max(0, seconds - level) : seconds;
        const next = Math.max(0, started ? level - seconds : level) + player.segmentSeconds;
        const change = last === undefined ? 0 : Math.abs(player.ladderBps[rung]! - player.ladderBps[last]!) / 1e6;
        const gain = player.ladderBps[rung]! / 1e6 - mu * stall - change;

        search(
          depth + 1,
          next,
          started || next >= player.startupSegments * player.segmentSeconds,
          rung,
          score + gain,
          depth === 0 ? rung : first
        );
      }
    };

    search(0, buffer, playing, previous, 0, 0);
    return bestFirst;
  }

  /** What the transfer would take on a copy of the connection: over the real trace, or with capacity frozen at now. */
  function trueTime(bytes: number, rtt: number, presentOnly: boolean): number {
    const copy = { ...connections[SEGMENT_HOST]! };
    const step = Math.min(trace.bitsPerMs.length - 1, Math.floor(now / trace.stepMs));
    const over = presentOnly ? constantTrace(trace.bitsPerMs[step]!, rtt) : trace;

    return simulateTransfer(copy, over, behavior, now, bytes, rtt).end - now;
  }
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / Math.max(1, values.length);
}
