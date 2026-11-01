import type { CapacityTrace } from '../synthetic/trace.ts';

/**
 * How the serving side behaves, as measured. The lab's Linux origin (cubic, initial window 10 segments, slow start
 * restarted after idle) and the real Mux CDNs differ: Fastly showed no idle effect, edgemv a round trip added to the
 * first byte after ≥ 2 s idle.
 */
export interface ServerBehavior {
  name: string;
  /** Restart slow start from the initial window when the connection idled longer than `restartAfterMs`. */
  slowStartAfterIdle: boolean;
  restartAfterMs: number;
  /** Round trips added to the first byte when the connection idled at least `penaltyAfterMs`. */
  idlePenaltyRtts: number;
  penaltyAfterMs: number;
  /** Server time from request to first byte on the wire; the lab origin measured ~4 ms. */
  responseMs: number;
}

export const SERVER_BEHAVIORS: Record<string, ServerBehavior> = {
  // Linux restarts after idle longer than the RTO, whose floor is 200 ms.
  'linux-default': {
    name: 'linux-default',
    slowStartAfterIdle: true,
    restartAfterMs: 200,
    idlePenaltyRtts: 0,
    penaltyAfterMs: 0,
    responseMs: 4,
  },
  'no-restart': {
    name: 'no-restart',
    slowStartAfterIdle: false,
    restartAfterMs: 0,
    idlePenaltyRtts: 0,
    penaltyAfterMs: 0,
    responseMs: 4,
  },
  'edgemv-like': {
    name: 'edgemv-like',
    slowStartAfterIdle: false,
    restartAfterMs: 0,
    idlePenaltyRtts: 1,
    penaltyAfterMs: 2000,
    responseMs: 4,
  },
};

/** Initial congestion window: 10 segments of 1460 bytes. */
export const INITIAL_WINDOW_BYTES = 14_600;
/** Payload share of link capacity after TCP/IP, TLS and h2 framing; measured 0.948 in the lab sweep. */
export const GOODPUT_EFFICIENCY = 0.95;

export interface Connection {
  open: boolean;
  windowBytes: number;
  /** When the last byte of the previous transfer arrived. */
  lastActiveMs: number;
}

export interface TransferTiming {
  firstByte: number;
  end: number;
  /** `[arrival time, bytes]` per delivery round, as the logger records body chunks. */
  chunks: Array<[number, number]>;
}

export function newConnection(): Connection {
  return { open: false, windowBytes: INITIAL_WINDOW_BYTES, lastActiveMs: 0 };
}

/**
 * Simulates one request on `connection` (mutated) over `trace`. A new connection costs two round trips (TCP, then TLS
 * 1.3); the request costs one. The body then arrives in slow-start rounds, one window per round trip with the window
 * doubling, until a window takes longer than a round trip to serialize; from there the link is the limit and the rest
 * flows at the trace's capacity. Validated against the lab's real-TCP sweep (`abr --validate`).
 */
export function simulateTransfer(
  connection: Connection,
  trace: CapacityTrace,
  behavior: ServerBehavior,
  startMs: number,
  bytes: number,
  rttMs: number
): TransferTiming {
  let time = startMs;
  const idleMs = startMs - connection.lastActiveMs;

  if (!connection.open) {
    time += 2 * rttMs;
    connection.open = true;
    connection.windowBytes = INITIAL_WINDOW_BYTES;
  } else {
    if (behavior.slowStartAfterIdle && idleMs > behavior.restartAfterMs + rttMs) {
      connection.windowBytes = INITIAL_WINDOW_BYTES;
    }

    if (behavior.idlePenaltyRtts > 0 && idleMs >= behavior.penaltyAfterMs) time += behavior.idlePenaltyRtts * rttMs;
  }

  // The first window leaves the server half a round trip after the request and lands half a round trip later.
  time += rttMs + behavior.responseMs;

  const firstByte = time;
  const chunks: Array<[number, number]> = [];
  let remaining = bytes;

  while (remaining > 0) {
    const send = Math.min(connection.windowBytes, remaining);
    const arrival = deliver(trace, time, send);

    if (arrival - time >= rttMs || send === remaining) {
      // Link-limited (or the last round): everything left flows at capacity.
      const end = send === remaining ? arrival : deliver(trace, time, remaining);

      chunks.push([end, remaining]);
      time = end;
      connection.windowBytes = Math.max(connection.windowBytes, 2 * send);
      break;
    }

    chunks.push([arrival, send]);
    remaining -= send;
    connection.windowBytes *= 2;
    time += rttMs;
  }

  connection.lastActiveMs = time;
  return { firstByte, end: time, chunks };
}

/** When `bytes` sent from `startMs` finish arriving at the trace's capacity, net of framing overhead. */
function deliver(trace: CapacityTrace, startMs: number, bytes: number): number {
  let remaining = (8 * bytes) / GOODPUT_EFFICIENCY;
  let time = startMs;

  while (remaining > 0) {
    const index = Math.floor(time / trace.stepMs);
    const rate = trace.bitsPerMs[Math.min(trace.bitsPerMs.length - 1, index)]!;
    const stepEnd = (index + 1) * trace.stepMs;
    const slice = Math.min(remaining, rate * (stepEnd - time));

    time += slice / rate;
    remaining -= slice;
  }

  return time;
}

/** A trace holding one capacity: a single step, which `deliver` holds past its end. */
export function constantTrace(rateKbps: number, rttMs: number): CapacityTrace {
  return { stepMs: 100, bitsPerMs: Float64Array.of(rateKbps), latencyAt: () => rttMs };
}
