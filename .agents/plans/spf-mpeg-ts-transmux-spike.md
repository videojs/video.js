# SPF MPEG-TS → fMP4 transmux spike

Temporary implementation notes (delete before merge). Branch: `feat/spf-mpeg-ts-feature`, cut from the
compose-engine stack tip (`docs/spf-behavior-jsdoc`, #9396). The original standalone spike is stashed on
`spike/spf-mpeg-ts-transmux`.

## Shape on the stack (2026-10-19)

The transmux is one feature, `mpegTsTransmuxFeature` (`engines/hls/features/mpeg-ts-transmux.ts`, entry
`@videojs/spf/features/mpeg-ts-transmux`): no behaviors, five `defaultConfig` overrides
(`videoMessagePipelines`, `audioMessagePipelines`, `canPlayTrack`, `reportUnsupportedTrackConditions`,
`sourceBufferMimeCodec`), composed after `shiftTimestampsFeature` and `drmFeature` (last-wins). Not in
any shipped HLS engine's feature list. **Composed by the Mux SPF Medias only** (`MuxVideoAdapter` /
`MuxAudioAdapter` lay `withMpegTsTransmux` under the consumer's engine config — a behavior-less feature
is only config, so the Media composes it without rebuilding the engine). Decided 2026-10-19: the
transmuxer covers what Mux packages, not general MPEG-TS (no MP3/AC-3/E-AC-3/HEVC, no SAMPLE-AES, AUD-
dependent AU grouping, no PTS rollover / discontinuity / segment-spanning PES, none of hls.js's timing
repair, Chromium only), so `<hls-video>` keeps its unsupported-format verdict and the e2e
`spf-unsupported-source.spec.ts` stays valid. The standalone `createHlsMpegTs*Engine` factories are gone.
Shared-code seams: `relocationStepsFor(type)` and `sourceBufferMimeCodec` on `setupBufferActors`.

| composition (`flattenFeatures([...features, mpegTsTransmuxFeature])`) | gz | delta |
|---|---|---|
| hls/video features | 27.62 KB | — |
| hls/video + transmux | 31.41 KB | +3.79 KB |
| hls/audio features | 18.47 KB | — |
| hls/audio + transmux | 22.46 KB | +3.98 KB (carries the unused H.264 framing, ~1.2 KB) |

**Audio-only use case.** Two distinct questions: (1) bundle — DONE 2026-10-19: the transmuxer is
composed from codec modules (`media/mpeg-ts/codecs/{avc,aac}.ts`, interface in `codec.ts`); the
fMP4 writer takes a finished sample entry per track; the demuxer collects only the requested PMT
stream types (an audio-only consumer never assembles the video PES). `mpegTsAudioTransmuxFeature`
(own entry point) carries `[aacCodec]` only; the Mux audio flavor composes it. CI-method (brotli)
numbers: `@videojs/mux-audio/spf` +2.75 kB over base (was +3.9 kB with the shared transmuxer),
`@videojs/mux-video/spf` +3.7 kB. (2) capability — the hls/audio engine
cannot play a plus-tier *video* asset's audio at all, because Mux muxes that audio into the video
TS and declares no audio rendition. That's the same "muxed audio as a selectable source" work as the
URI-less default (stage 3), seen from the audio engine: select a video variant as the audio source
and transmux its AAC only.
Goal: feasibility + size of client-side TS transmuxing scoped to what Mux Video packages.

## Carried (URI-less) default audio — landed 2026-10-20

Weighed three ways to honor the URI-less `DEFAULT=YES` rendition of multi-audio TS assets: (1) tear down and
rebuild MSE when the selection crosses the muxed/demuxed boundary (the MSE track count of a SourceBuffer is
fixed by its first init; `changeType` doesn't relax it), (2) always split into two SourceBuffers, hls.js's
model, (3) remux the selected alternate's AAC into the video SourceBuffer. Chose (2) in its cheapest form:
the layout follows the manifest, never the selection. `media/hls/carried-audio.ts` resolves the rendition to
its lowest-bandwidth carrier variant's playlist (applied by the features' `parsePresentation` override — the
parser itself is unchanged), which also fixes auto-selection (the active-CDN scope keys on URL origin and had
been excluding the empty-url track, so these assets started on a dubbed alternate). At fetch time the audio
pipeline redirects a carried segment to the *selected video track's* segment at the same `startTime` (the
grids and the 10s origin align across Mux renditions) and takes the bytes from `primitives/segment-share.ts`,
an in-flight share the video pipeline publishes into (waits ≤1s for a publish, remembers published keys so a
late taker goes to the HTTP cache). Only the video fetch samples bandwidth; Mux segments send no
`Timing-Allow-Origin`, so Resource Timing can't detect a cache hit, hence the share rather than the cache.
Verified: 6 segment requests / 0 duplicates at startup; default→es→commentary→default switches clean with
the audio SourceBuffer's range within 20 ms of the video's. Sizes: mux-video/spf +0.57 kB, mux-audio/spf
+0.43 kB brotli. Residual: the share is a module-level singleton keyed by URL; the audio-only engine still
can't play a *single-audio* video asset's audio (no audio rendition exists to carry).

## Mux background video — landed 2026-10-20

`<mux-background-video>` / `MuxBackgroundVideo` were re-exports of the HLS-named element/component, so there
was no adapter to lay the transmux on. Now `MuxBackgroundVideoAdapter` (`@videojs/mux-video/spf/background-video`,
own entry so `/spf` never bundles the background engine) lays it; html `MuxBackgroundVideo extends
HlsBackgroundVideo` via a new `static Adapter` seam; react gets its own component over the Mux adapter.
Two prerequisites surfaced: the background engine declared no `mediaContainerData` (the transmux/relocation
steps crashed on `peek(undefined)` → they now no-op without the slot), and it composed no
`shiftTimestampsFeature`, so ANY non-zero-PTS source stranded at 0 — verified with Mux's instant clip
(`hls-instant-clip`: buffered [60, 92], readyState 1, never played). Composed it (+1.5 kB brotli on the
hls-background-video entries; CDN `mux-background-video` +6.0 kB total). Sandbox background pages take URL
presets only (`hls-1`, `hls-2`); `mux-source-ts` is a playback-ID preset and yields an empty `src` there.

## Result

Mux TS renditions play end to end in Chromium through the existing MSE pipeline, with no changes
to the actor, loader, or relocation layers beyond two config seams. Two real assets verified in
`playback/engines/hls/tests/engine-mpeg-ts.test.ts` (network-dependent, see Open questions):

| asset | shape | observed |
|---|---|---|
| `a4nOgmx…` | muxed H.264 + AAC, one SourceBuffer | buffered `[0.033, 23.86]` (10s PTS relocated to 0), 480×270 decoded, 25 frames / 0 dropped at 0.7s, audio decoding |
| `Sc89iW…` | multi-audio: muxed default + audio-only TS alternates | 2 SourceBuffers, video drops its muxed audio (track declares only `avc1`), Spanish 44.1 kHz rendition plays |

Sandbox smoke (Chrome, on a scratch page driving the engines directly — since removed; the committed Mux SPF
sandbox pages cover these cases now):

| case | observed |
|---|---|
| audio-only TS (`3zd01…`) through `createHlsMpegTsAudioEngine` on `<audio>` | plays, seeks (+60s → `[60, 100]` buffered), relocated from 10s, no errors |
| Elephants Dream alternate switching (Spanish → Commentary → Spanish) via `userAudioTrackSelection` | each switch re-inits the audio SourceBuffer and audio keeps decoding; no errors |
| **URI-less muxed default** (Elephants Dream "English", golf "Default") | selectable, but no audio segments are fetched for it (`url: ''`); playback **stalls at the end of the previously buffered alternate** (readyState 2, no error). Auto-selection skips it too, so these assets default to a *dubbed* alternate — which also makes them useless for lip-sync checks until this lands. |
| golf commentary TS (`yH00b…`, speech) | plays with the "English (auto-dubbed)" alternate; original audio is the muxed default (gap above) |

ffmpeg decodes the Node-side output of real segments cleanly; frame counts match the source
(299 video / 469 audio over two 5s segments). Transmux time per 5s segment: 270p 1–3 ms,
720p 2.5–5 ms, audio-only 0.5 ms (Node, cold JIT first).

## Size (minified / gzipped, `vp pack --minify`, single entry)

| bundle | min | gz | delta gz |
|---|---|---|---|
| `engines/hls/engine.ts` (fMP4-only video engine) | 88.7 KB | 26.66 KB | — |
| `engines/hls/engine-mpeg-ts.ts` (video engine + transmux) | 99.2 KB | 30.49 KB | **+3.84 KB** |
| `engines/hls/index.ts` before / after (all engines, now exports the TS one) | 94.0 / 104.7 KB | 28.49 / 32.40 KB | +3.91 KB |
| `media/mpeg-ts/transmux.ts` alone (demux + h264 + adts + mp4 writer) | 8.5 KB | 3.60 KB | |
| of which `h264.ts` with / without SPS parsing | 2.5 / 1.1 KB | 1.22 / 0.67 KB | SPS parse = 0.55 KB |

Reference points: hls.js's demux+remux is ~6.7 kloc, mux.js ~7.7 kloc, shaka ~8.8 kloc; this is
~700 lines because it targets one packager's output (H.264 + AAC-LC, AUD-delimited, in-band
SPS/PPS, no scrambling, no ID3/CEA-608, no MP3/AC-3/HEVC).

## Shape

- `media/mpeg-ts/demux.ts` — 188-byte packet walk, PAT → PMT, PES reassembly by PUSI, `concatPes`.
- `media/mpeg-ts/h264.ts` — NAL split over the *continuous* ES, AUD-keyed access units, SPS size.
- `media/mpeg-ts/adts.ts` — ADTS frame walk over the continuous ES, `AudioSpecificConfig`.
- `media/mp4/mux.ts` — `ftyp`/`moov` (`avc1`+`avcC`, `mp4a`+`esds`, `mvex`) and `moof`+`mdat`
  (`default-base-is-moof`, v1 `tfdt`, v1 `trun`). Reads back through the existing `box.ts` readers.
- `media/mpeg-ts/transmux.ts` — stateful per SourceBuffer: fragment numbering, init emitted when the
  codec config changes (first segment, rendition switch). Native timestamps; audio in sample-rate ticks.
- `playback/primitives/transmux-pipelines.ts` — `fetch → transmux → readSegmentOrigin → stamp →
  dispatch`. Sniffs `0x47`; non-TS passes through. The `append-init` op for a TS track (`url: ''`)
  dispatches an empty append so the actor records the track as initialized. Writes the init half of
  `mediaContainerData` (track id + timescale) so relocation discovers the `tfdt` unchanged.
- `playback/engines/hls/engine-mpeg-ts.ts` — `createHlsMpegTsVideoEngine`: the video engine with the
  transmux pipelines and three container-aware seams (`canPlayTrack`, `reportUnsupportedTrackConditions`,
  new `sourceBufferMimeCodec`) seeing TS as the fMP4 it becomes.
- Seams added to shared code: `relocationStepsFor` (exports the relocation steps),
  `sourceBufferMimeCodec` on `setupBufferActors`, `videoMessagePipelines` / `audioMessagePipelines`
  honored by `createHlsVideoEngine` config.

## Mux packaging facts the design depends on

- PES packets are **not** access-unit aligned: picture N's slice data runs into PES N+1; the PES
  PTS/DTS belong to the AU whose AUD starts inside it. A per-PES NAL splitter truncates every large
  frame. Same for ADTS frames.
- PTS starts at 10s (as CMAF). Every segment: PAT/PMT, IDR first, AUD per picture, SPS/PPS in-band.
- Muxed audio 48 kHz; audio-only alternates 44.1 kHz → audio track timescale must be the sample rate.
- Multi-audio assets declare the muxed default audio as a URI-less `EXT-X-MEDIA`.

## Suggested stages

1. **Land the engine variant as its own entry** (`@videojs/spf/hls-mpeg-ts` or a `<mux-video>`
   flavor) so fMP4-only consumers pay nothing. Decide SPS parse vs manifest `RESOLUTION` (−0.55 KB).
2. **Fixtures + unit tests**: a truncated low-bitrate Mux TS segment (~100 KB) or synthetic TS built
   in-test; today's coverage is the network-backed Chromium test plus ffmpeg validation of Node output.
3. **URI-less default audio** — DONE (see "Carried default audio" above); the earlier plan of carrying it
   in the video SourceBuffer was dropped because MSE fixes a SourceBuffer's track count at its first init.
4. **Live TS**: segment-spanning PES (a PES cut at a segment boundary), PTS rollover (33-bit wrap
   at ~26.5 h), discontinuities. VOD Mux segments are self-contained so none of this is exercised.
5. **Progressive**: TS is packet-granular, so the step could transmux per 128 KB chunk instead of
   buffering the whole segment; today's whole-segment buffering is the field norm (see the
   `timestampOffset` prior-art survey) and costs 2–5 ms per segment.
6. Optional: ID3 timed metadata (PMT 0x15) → `emsg` or cue bridge; CEA-608 is out of scope.

## Open questions

- Keep the network-backed test? It is the only end-to-end proof; the repo otherwise avoids live URLs
  in unit tests (clear-key test serves a local fixture).
- `sourceBufferMimeCodec` as a config seam vs. deriving the MSE MIME from the pipeline that produces
  the bytes (the container is a property of the pipeline, not the track).
- Whether `container-support.md`'s "not in scope" posture changes; this spike is its revisit evidence.
