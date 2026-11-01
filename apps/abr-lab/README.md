# @videojs/abr-lab

Exploratory spike, private and never published. It logs real segment transfers and scores download-time predictors against them. No SPF integration: a predictor only needs a transfer log.

```bash
pnpm -F @videojs/abr-lab record --minutes 10 [--src <m3u8>] [--name <run>] [--headed] [--channel chrome]
pnpm -F @videojs/abr-lab synth [--sessions 10 --minutes 10]
pnpm -F @videojs/abr-lab score recordings/*.jsonl [--recording <prefix>] [--json]
pnpm -F @videojs/abr-lab logger   # the logger page alone, for manual runs on other devices (add --host)
```

- `record` serves the logger page, drives it with Playwright, and attaches Chrome DevTools Protocol cache ground truth (`truth`) to every transfer. Recordings go to `recordings/` (git-ignored).
- The logger fetches segments on a randomized, player-shaped schedule (fill, drain, rendition wander, occasional seeks) with audio alongside video. No video plays.
- The scorer replays each recording in time order. A predictor only ever observes transfers that completed before the request it forecasts (`score.test.ts` guards this).
- `spf-dual-ewma` imports SPF's estimator from source. Its samples come from raw `ReadableStream` reads rather than SPF's `ChunkedStreamIterable`, so it approximates today's behavior rather than reproducing it exactly.

## Network lab

`netlab/` runs Chrome and a media origin as two containers on one Docker network. netem on the origin's egress sets RTT, rate, loss and queue, so transfers see real TCP and TLS (handshakes, slow start, restart after idle), unlike DevTools throttling, which paces inside Chrome.

```bash
pnpm -F @videojs/abr-lab lab:up        # needs Docker; media from $ABR_LAB_MEDIA (default ~/dev/experiments/media-test-server/media)
pnpm -F @videojs/abr-lab probe [--rtts 10,40,100,200 --rates 1500,5000,20000,80000 --sizes ... --idles 0,3000]
pnpm -F @videojs/abr-lab probe:report recordings/probe-*.jsonl [--ms]
pnpm -F @videojs/abr-lab record --lab [--throttle cellular] [--src https://origin:8443/<path>.m3u8]
pnpm -F @videojs/abr-lab lab:down
```

- `probe` sweeps size × RTT × rate × connection state (`fresh` = new connection, `warm` = reused after an idle gap) against a synthetic `/bytes` endpoint. `probe:report` shows each cell's cost beyond serialization in RTTs.
- `record --lab` drives the containerized Chrome; with `--throttle`, the profile's capacity schedule is applied through netem and its latency becomes the added RTT.
- The origin is h2 over TLS 1.3 with a self-signed certificate, `max-age=3600` caching, and `Timing-Allow-Origin: *`. It has no CDN tiers: every response is an origin hit, so lab recordings isolate the network from cache effects.
- Only one of `probe` and `record --lab` may run at a time: they share the origin's shaper.

The design notes behind this live in the "Learned ABR for SPF" doc (Architecture and Predictor inputs tabs).
