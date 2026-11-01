/**
 * Other players' throughput estimators, replayed against the same transfer logs. Each mirrors its source's sampling
 * rule, defaults and download-time formula; versions and files are cited per factory. Safety factors (0.7–0.95) belong
 * to rendition selection, not estimation, so they're left out: every predictor here is scored on its raw forecast.
 *
 * Replay can't reproduce everything: navigator.connection defaults, parse and append time, and each player's own
 * request scheduling. Where a player reads a timing we don't record, the nearest recorded one is used and noted.
 */
import { pointDistribution } from '../distribution.ts';
import type { TransferRecord } from '../record.ts';
import { INITIAL_BANDWIDTH_BPS, type Predictor } from './predictor.ts';

/** The half-life EWMA hls.js and Shaka share (`utils/ewma.ts`, `lib/abr/ewma.js`), with zero-factor correction. */
class Ewma {
  private readonly alpha: number;
  private estimate = 0;
  totalWeight = 0;

  constructor(halfLife: number) {
    this.alpha = Math.exp(Math.log(0.5) / halfLife);
  }

  sample(weight: number, value: number): void {
    const adjusted = this.alpha ** weight;

    this.estimate = value * (1 - adjusted) + adjusted * this.estimate;
    this.totalWeight += weight;
  }

  get value(): number {
    const zeroFactor = 1 - this.alpha ** this.totalWeight;

    return zeroFactor ? this.estimate / zeroFactor : this.estimate;
  }
}

const isVideoSegment = (r: TransferRecord) => r.kind === 'segment' && r.trackType !== 'audio';

/**
 * Hls.js 1.7.3 (`utils/ewma-bandwidth-estimator.ts`, `controller/abr-controller.ts`). Samples main-variant fragments
 * only; a sample's time is load duration minus min(this TTFB, the TTFB estimate), weighted by seconds, floored at
 * min(50 ms, bytes / 100000). TTFB has its own EWMA. Forecast = TTFB estimate + bits / estimate (`getTimeToLoadFrag`).
 * Default 500 kbps, half-lives 3 s / 9 s (VoD). hls.js measures to parse end; replay uses body end.
 */
export function createHlsJs(): Predictor {
  const fast = new Ewma(3);
  const slow = new Ewma(9);
  const ttfb = new Ewma(9);
  const ttfbEstimate = () => (ttfb.totalWeight >= 0.001 ? ttfb.value : 100);

  return {
    name: 'hls.js',
    observe(record) {
      const { start, firstByte, end } = record.t;
      if (!isVideoSegment(record) || firstByte === undefined || end === undefined || record.bytes <= 0) return;

      const first = firstByte - start;
      const seconds = first / 1000;

      ttfb.sample(Math.SQRT2 * Math.exp(-(seconds ** 2) / 2), Math.max(first, 5));

      const durationMs = end - start - Math.min(first, ttfbEstimate());
      const durationS = Math.max(durationMs, Math.min(50, record.bytes / 100_000)) / 1000;
      const bps = (8 * record.bytes) / durationS;

      fast.sample(durationS, bps);
      slow.sample(durationS, bps);
    },
    forecast({ bytes }) {
      const bps = fast.totalWeight >= 0.001 ? Math.min(fast.value, slow.value) : 500_000;

      return pointDistribution(ttfbEstimate() + (8000 * bytes) / bps);
    },
  };
}

/**
 * Shaka Player 5.2.4 (`lib/abr/ewma_bandwidth_estimator.js`, `lib/net/http_fetch_plugin.js`,
 * `lib/abr/simple_abr_manager.js`). Every segment request (audio and video) reports progress events: bytes accumulate
 * until 100 ms have passed and at least 16 kB arrived, or the body ends; the first interval starts at request time, so
 * it includes TTFB. Events under 5 ms (`cacheLoadThreshold`) and under 16 kB are dropped; the estimate needs 128 kB
 * total. Half-lives 2 s / 5 s. No latency term. Default 1 Mbps (Shaka prefers `navigator.connection.downlink`,
 * unavailable here).
 */
export function createShaka(): Predictor {
  const fast = new Ewma(2);
  const slow = new Ewma(5);
  let bytesSampled = 0;

  const sample = (deltaMs: number, bytes: number) => {
    if (deltaMs < 5 || bytes < 16_000) return;

    bytesSampled += bytes;
    fast.sample(deltaMs / 1000, (8000 * bytes) / deltaMs);
    slow.sample(deltaMs / 1000, (8000 * bytes) / deltaMs);
  };

  return {
    name: 'shaka',
    observe(record) {
      if (record.kind !== 'segment' && record.kind !== 'init') return;

      let last = record.t.start;
      let pending = 0;

      record.chunks.forEach(([time, bytes], i) => {
        pending += bytes;

        if ((time - last > 100 && pending >= 16_000) || i === record.chunks.length - 1) {
          sample(time - last, pending);
          last = time;
          pending = 0;
        }
      });
    },
    forecast({ bytes }) {
      const bps = bytesSampled < 128_000 ? 1_000_000 : Math.min(fast.value, slow.value);

      return pointDistribution((8000 * bytes) / bps);
    },
  };
}

/**
 * Dash.js 5.2.0 (`streaming/models/ThroughputModel.js`, `streaming/controllers/ThroughputController.js`, default
 * `averageCalculationMode: EWMA`). Per media type (video here): throughput excludes latency (`useDeadTimeLatency`),
 * weight = 0.0015 × download ms, half-lives 3 / 8, min of the two. Latency is its own EWMA (half-lives 1 / 2 samples,
 * max of the two). Its cache check reads Resource Timing `transferSize`; without `Timing-Allow-Origin` that check never
 * fires and the 10 ms timing fallback is skipped, so — faithfully — nothing is excluded here. Forecast = latency + bits
 * / throughput. dash.js has no numeric default estimate; SPF's 5 Mbps is used before the first sample.
 */
export function createDashJs(): Predictor {
  const throughput = { fast: 0, slow: 0, weight: 0 };
  const latency = { fast: 0, slow: 0, weight: 0 };
  const update = (o: typeof throughput, value: number, weight: number, fast: number, slow: number) => {
    const a = 0.5 ** (weight / fast);
    const b = 0.5 ** (weight / slow);

    o.fast = (1 - a) * value + a * o.fast;
    o.slow = (1 - b) * value + b * o.slow;
    o.weight += weight;
  };
  const read = (o: typeof throughput, fast: number, slow: number, useMin: boolean) => {
    const f = o.fast / (1 - 0.5 ** (o.weight / fast));
    const s = o.slow / (1 - 0.5 ** (o.weight / slow));

    return useMin ? Math.min(f, s) : Math.max(f, s);
  };

  return {
    name: 'dash.js',
    observe(record) {
      const { start, firstByte, end } = record.t;
      if (!isVideoSegment(record) || firstByte === undefined || end === undefined) return;

      const downloadMs = Math.max(1, end - firstByte);
      const kbps = (8 * record.bytes) / downloadMs;

      update(throughput, kbps, 0.0015 * downloadMs, 3, 8);
      update(latency, firstByte - start || 1, 1, 1, 2);
    },
    forecast({ bytes }) {
      const kbps = throughput.weight > 0 ? read(throughput, 3, 8, true) : INITIAL_BANDWIDTH_BPS / 1000;
      const latencyMs = latency.weight > 0 ? read(latency, 1, 2, false) : 0;

      return pointDistribution(latencyMs + (8 * bytes) / kbps);
    },
  };
}

/**
 * Video.js v8 / VHS (`xhr.js`, `segment-loader.js`, `playlist-selectors.js` `lastBandwidthSelector`, `config.js`). The
 * main loader keeps only the latest segment's bandwidth — bytes over the whole request round trip, latency included —
 * with no smoothing. Default 4,194,304 bps. Forecast = bits / bandwidth. VHS's selector also folds in transmux and
 * append throughput (`systemBandwidth`), which replay can't see.
 */
export function createVhs(): Predictor {
  let bps = 4_194_304;

  return {
    name: 'vhs (v8)',
    observe(record) {
      const { start, end } = record.t;
      if (!isVideoSegment(record) || end === undefined || end <= start || record.bytes <= 0) return;

      bps = Math.floor((record.bytes / (end - start)) * 8 * 1000);
    },
    forecast({ bytes }) {
      return pointDistribution((8000 * bytes) / bps);
    },
  };
}
