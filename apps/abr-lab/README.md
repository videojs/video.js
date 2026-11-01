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

The design notes behind this live in the "Learned ABR for SPF" doc (Architecture and Predictor inputs tabs).
