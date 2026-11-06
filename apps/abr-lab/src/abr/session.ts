import type { Predictor } from '../predictors/predictor.ts';
import type { TransferRecord } from '../record.ts';
import { classifyTransfer } from '../regime.ts';
import type { CapacityTrace } from '../synthetic/trace.ts';
import {
  type Connection,
  constantTrace,
  INITIAL_WINDOW_BYTES,
  newConnection,
  type ServerBehavior,
  simulateTransfer,
} from './transport.ts';

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
  /** The first displayed rung, and the median rung over 20–60 s of content: where the session settled. */
  firstRung: number;
  settledRung: number;
  /** Startup segment fetches abandoned for a lower rung, and the bytes they wasted. */
  abandons: number;
  abandonedBytes: number;
}

/**
 * Abandon a startup segment once its projected body time passes `overrun` times what the estimate behind it implied
 * (the estimate was that wrong), then re-pick below it with the rate seen: the highest rung whose fetch fits a segment
 * duration. The clock starts at the first byte, so handshakes do not count; checks wait out, and the deadline allows
 * for, the slow-start round trips a fresh window needs to reach the estimated rate. The projection takes the faster of
 * the rate so far and the rate over the last check interval, so a transfer still ramping is not judged by its first
 * round trips. A fixed deadline would not do: on 4 s segments even a perfect estimate needs ~3 s to start at the
 * settled rung.
 */
export interface AbandonPolicy {
  overrun: number;
}

const CHECK_MS = 100;

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
export function runSession(
  inputs: SessionInputs,
  predictor: Predictor | Oracle,
  rule: AbrRule,
  options: { abandon?: AbandonPolicy | undefined } = {}
): SessionResult {
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
  let abandons = 0;
  let abandonedBytes = 0;
  /** The forecast, ms, behind the last rung `choose` picked. */
  let chosenForecastMs = 0;
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

    const chosen = choose();
    const rung = !playing && options.abandon ? abandonIfLate(chosen, index, options.abandon.overrun) : chosen;
    const bytes = segmentBytes(rung, index);
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
  const settledFrom = Math.min(rungs.length - 1, Math.ceil(20 / player.segmentSeconds));
  const settled = [...rungs.slice(settledFrom, Math.max(settledFrom + 1, Math.floor(60 / player.segmentSeconds)))].sort(
    (a, b) => a - b
  );

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
    firstRung: rungs[0] ?? 0,
    settledRung: settled[Math.floor(settled.length / 2)] ?? 0,
    abandons,
    abandonedBytes,
  };

  function segmentBytes(rung: number, index: number): number {
    return Math.round(
      ((player.ladderBps[rung]! * player.segmentSeconds) / 8) * sizeFactors[index % sizeFactors.length]!
    );
  }

  /** Plays out `rung`'s fetch on a copy of the connection, checking progress as a player would; see `AbandonPolicy`. */
  function abandonIfLate(rung: number, index: number, overrun: number): number {
    if (rung === 0) return rung;

    const bytes = segmentBytes(rung, index);
    const rtt = rtts[request % rtts.length]!;
    const copy = { ...connections[SEGMENT_HOST]! };
    const timing = simulateTransfer(copy, trace, behavior, now, bytes, rtt);
    // Bytes per ms the estimate implied, and the round trips a fresh window needs to carry it.
    const estimated = (player.ladderBps[rung]! * player.segmentSeconds) / 8 / chosenForecastMs;
    const rampRtts = Math.ceil(Math.log2(Math.max(1, (estimated * rtt) / INITIAL_WINDOW_BYTES)));
    const deadline = timing.firstByte + overrun * (bytes / estimated) + rampRtts * rtt;

    // Before the window could have reached the estimated rate, a slow transfer and a ramping one look the same.
    for (let t = timing.firstByte + rampRtts * rtt + CHECK_MS; t < timing.end; t += CHECK_MS) {
      const received = receivedBy(timing, t);
      const rate = Math.max(
        received / (t - timing.firstByte),
        (received - receivedBy(timing, t - CHECK_MS)) / CHECK_MS
      );
      if (rate <= 0 || t + (bytes - received) / rate <= deadline) continue;

      // HTTP/2 resets the stream; the connection stays open with the window it grew.
      request++;
      connections[SEGMENT_HOST] = { ...copy, lastActiveMs: t };
      abandons++;
      abandonedBytes += received;
      now = t;

      for (let lower = rung - 1; lower > 0; lower--) {
        if (rtt + segmentBytes(lower, index) / rate <= player.segmentSeconds * 1000) return lower;
      }

      return 0;
    }

    return rung;
  }

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

    const rung = rule.kind === 'mpc' ? planAhead(forecasts) : fastestFitting(forecasts, rule.safety);

    chosenForecastMs = forecasts[rung]!;
    return rung;
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

/** Bytes of `timing` arrived by `t`, each delivery round spread evenly since the previous one. */
function receivedBy(timing: { firstByte: number; chunks: ReadonlyArray<[number, number]> }, t: number): number {
  let previous = timing.firstByte;
  let total = 0;

  for (const [arrival, bytes] of timing.chunks) {
    if (t >= arrival) total += bytes;
    else if (t > previous) total += (bytes * (t - previous)) / (arrival - previous);

    previous = arrival;
  }

  return total;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / Math.max(1, values.length);
}
