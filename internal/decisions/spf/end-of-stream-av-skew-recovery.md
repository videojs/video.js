---
status: decided
date: 2026-07-13
---

# End-of-Stream Recovery for Skewed / Tiny-Final-Segment A/V

## Decision

Make a complete VOD reach native `ended` (and therefore loop) reliably, even when the
audio and video tracks don't end at exactly the same time, via **two narrow changes** in
the two behaviors that already own the end of playback:

1. **`end-of-stream` reactor** — add slack to the "playhead reached the last segment"
   gate: fire `endOfStream()` once `currentTime >= lastSegStart − LAST_SEGMENT_REACHED_SLACK`
   (0.5 s) rather than `>= lastSegStart` exactly.
2. **`recover-end-stall` behavior** (new, DOM) — on the `waiting` event, if the
   MediaSource is `'ended'`, the stream is finite, and the playhead is within
   `endStallNudgeWindow` (default 0.2 s) of the reachable buffered end, set
   `currentTime = duration` to force native `ended`.

Both are event-driven; neither polls. `recover-end-stall` reads only `mediaElement` +
`mediaSource`. The window/slack are config-tunable.

## Context

Chrome hangs at the end of the Apple `bipbop_adv_example_hevc` VOD (a source with a ~44 ms
A/V PTS skew): the playhead freezes a few frames short of the end and native `ended` never
fires, so playback stalls and loop never re-triggers. Investigation (measured in the
`spf-non-zero-pts` sandbox) found **two** compounding causes:

- **A tiny final segment deadlocks the EOS reactor.** Apple's last video segment is ~44 ms
  and starts right at the buffered end (`lastSegStart ≈ 600.0`, buffered end ≈ `600.044`).
  Chrome paces `currentTime` off the audio clock and freezes the playhead ~50–70 ms short of
  the buffered end — i.e. *below* `lastSegStart`. The reactor's `currentTime >= lastSegStart`
  gate never opens → `endOfStream()` is never called → the MediaSource stays `'open'` → the
  browser keeps the playhead frozen waiting for data/EOS that never comes. A seek past
  `lastSegStart` (e.g. to `duration`) breaks the deadlock.
- **Even once `endOfStream()` fires, the playhead still freezes short of `duration`.** With
  MS `'ended'`, Chrome still stops ~50–70 ms short (the audio clock can't advance past the
  shorter track's end), so `currentTime` never reaches `duration` and `ended` never fires.
  Nudging `currentTime = duration` fires it immediately.

Empirical findings that shaped the design:

- The freeze gap (playhead-stop → reachable buffered end) is stably ~50–70 ms (measured 52,
  58, 62, 71 ms), with ~20 ms non-deterministic jitter in the exact stop position. The
  reachable end (`buffered.end(last)` = `min(video, audio)`, the audio/pacing track) is
  stable; `duration` (= `max`, the video end) varies run-to-run with ABR rendition.
- `waiting` fires at the freeze with ~0 ms latency (measured −3.2 ms vs a rAF sampler), so a
  poll would only add latency — no reason to poll for this.
- A MediaSource reaches `'ended'` **only** via `endOfStream()` (MSE spec); the browser never
  does it spontaneously. The manual nudge appeared to "end without EOS" only because the
  seek re-triggered our own reactor, which then called `endOfStream()`.
- hls.js handles the same class of stall in its `GapController`: it does **not** trim buffers;
  it detects the near-end stall (MS `'ended'` + within 1 s of the edge) and, in a player-layer
  event, declares ended. We adapt this to SPF's native-`ended` shape by nudging to `duration`.

## Alternatives Considered

- **Trim the longer track's tail to align A/V ends, and set `duration` to the min.**
  Prototyped and rejected: trimming *video* by PTS can orphan B-frames (removing frames a
  displayable frame depends on), and it doesn't even fix the stall (the freeze persists), and
  the mismatch is frame-granular so exact alignment is impossible. It also needs a per-cycle
  trim target + re-entry bookkeeping. Adds risk for no benefit once the nudge is in place.
- **Poll for the stall (hls.js's `GapController` 100 ms tick).** Unnecessary here: `waiting`
  fires at the freeze with ~0 latency; a poll adds its interval + a stall threshold
  (hls.js waits up to `detectStallWithCurrentTimeMs = 1250 ms`).
- **hls.js's "within ~1 s of `duration`" window.** Looser than needed. We gate on proximity to
  the reachable buffered end (`buffered.end(last)`), which is tied to real buffered content and
  ~5× tighter, sized just above the measured freeze gap.
- **A single fix in one behavior.** Neither alone suffices: without the reactor slack the MS
  never reaches `'ended'`; without the nudge the playhead never reaches `duration`.

## Rationale

- **Root + residual, in their owners.** The reactor slack fixes the *root* (EOS never firing);
  `recover-end-stall` handles the *residual* audio-clock freeze. Each change lives in the
  behavior whose concern it is (MediaSource finalization vs. playhead recovery), mirroring
  hls.js's separation.
- **Ordering removes the race.** With slack, `endOfStream()` fires as `currentTime` crosses
  `lastSegStart − slack` — *before* the freeze — so by the time `waiting` fires the MS is
  already `'ended'` and `recover-end-stall`'s gate is satisfied.
- **Grounded constants.** `LAST_SEGMENT_REACHED_SLACK` (0.5 s) and `endStallNudgeWindow`
  (0.2 s) both comfortably exceed the measured ~50–71 ms freeze gap. Too-tight risks *missing*
  the stall (a permanent hang — worse than the bug), so both bias generous and are tunable.
- **Inert when not needed.** `recover-end-stall` no-ops for live (MS never `'ended'` while
  growing) and for streams that end cleanly (no `waiting`); the reactor slack only shifts EOS
  slightly earlier near the true end (harmless — the last segment is already appended).

## Scope

General EOS robustness for any skewed / short-final-segment A/V — not specific to the
non-zero-PTS relocation work it was discovered alongside. Composed in `hls-video.ts` and
`hls-audio.ts`.

## Follow-ups

- The nudge is a single jump to `duration`; if a stream ever freezes *further* short than
  `endStallNudgeWindow`, add a bounded retry rather than widening the default blindly.
- `recover-end-stall` currently keys off `waiting`; if a pathological stream froze without a
  `waiting`, a one-shot re-check on the MS→`'ended'` transition is the fallback.
