---
status: implemented
date: 2026-09-14
definition: sketched
---

# Chapters

Chapter markers for HLS sources, from Apple's JSON chapters notation referenced by the multivariant playlist
(`#EXT-X-SESSION-DATA:DATA-ID="com.apple.hls.chapters",URI="…json"`). The engine records session data while parsing the
multivariant playlist, fetches and parses the chapters document once the presentation has a duration, and projects one
hidden `<track kind="chapters">` per title language onto the media element. The element is the store: no chapters state
signal exists, and consumers read the first chapters track's cues the way video.js's textTrack feature already reads an
authored `<track kind="chapters">` — so the time-slider chapters UI lights up with no player-side change.

This is not a subtitle feature. Chapters are session-level data, not a rendition: nothing is selected, no media
playlist or segments exist, and `selectedTextTrackId` is untouched. What it shares with [subtitles](./subtitles.md) is
the `<track>` mechanism and the text-track DOM surface.

## Status

- **Composition:** The `hls/video` engine and the `hls/audio` engine (an `<audio>` element carries text tracks too;
  podcast-style sources ship chapters). Not the `hls/background-video` engine.
- **Definition depth:** sketched — shipped behavior, decisions, and source pointers below.

## Decisions

- **Session data is recorded generically, consumed specifically.** `parseMultivariantPlaylist` stores every
  `#EXT-X-SESSION-DATA` tag as a `SessionDataEntry` (`dataId`, `value` or resolved `uri` with `format`, `language`)
  under `presentation.metadata`, the way media-playlist specifics sit under `MediaPlaylistMetadata`, read back via
  `getSessionData(presentation, dataId)`. Fetching is left to whichever behavior knows a `DATA-ID`. A second consumer is
  a second pure parser plus a sibling behavior — no registry object, no behavior factory, matching the flat
  composition the engines use elsewhere.
- **No `chapters` state signal.** A signal would be a second copy of what the DOM `TextTrack` already holds, with its own
  clear-on-source-change to keep in sync, and nothing but the projector would read it. One DOM behavior fetches, parses,
  and projects; the pure parser is unit-tested on its own.
- **The open last chapter ends at `Number.MAX_SAFE_INTEGER`, and stays there.** The notation leaves the last chapter
  open unless it declares a `duration`. The HTML spec spells "unbounded" as `endTime = Infinity`, but Chromium, WebKit,
  and Firefox all reject a non-finite cue time (measured 2026-09-15), so the track carries the largest safe integer — as
  Mux Elements' `playback-core` did — and nothing waits for or chases a duration: projection happens as soon as the
  presentation resolves, and the cue is never amended (amending fires no event anyway). Consumers that need the chapter
  to end where the media ends clamp on read: video.js's `textTrack` store feature normalizes `chaptersCues` to the
  media duration once it is finite and re-syncs on `durationchange`, so a chapters list reads a true last-chapter
  length while the track itself is static. The time-slider UI already clamps every cue end to the media duration.
- **One hidden track per language, order is the selection.** Consumers take the first `kind="chapters"` track, so the
  `preferredSubtitleLanguage` track is appended first, then `und`, then first-seen. All tracks stay on the element for a
  consumer that wants another language. Language matching is exact-tag.
- **Srcless tracks, filled after their load settles.** A `<track>` with no `src` still runs the track processing model
  once its mode leaves `disabled`: the empty URL fails the load, `readyState` becomes `ERROR`, `error` fires. Measured in
  Chromium, WebKit, and Firefox (2026-09-14): Chromium and WebKit drop any cue added *before* that point; all three keep
  cues added after it. A `data:text/vtt` `src` would avoid the dance but WebKit refuses one whenever the media element
  has `crossorigin` set — and `<mux-video crossorigin>` is the primary consumer. So the track is set `hidden` to settle,
  filled while `disabled`, then set `hidden` again; that last mode change queues the `TextTrackList` `change` that
  observers re-read cues on (a srcless `<track>` never fires `load`). The subtitle tracks go through the same sequence
  implicitly — their cues arrive after a segment fetch, long after the settle.
- **Own ownership tag.** Chapters tracks carry `data-src-chapters-track`, not the subtitle tracks' `data-src-track`, so
  each cleanup removes only its own. A host-page `<track kind="chapters">` precedes the engine's in `textTracks` (tree
  order: the custom element clones slotted children first), so a page that supplies its own chapters keeps them; no
  opt-out config was added.
- **Exactly one document, quiet failures.** The first `com.apple.hls.chapters` entry with a URI is read; Apple carries
  every language inside the document, so a playlist repeating the `DATA-ID` per `LANGUAGE` is not an expected shape. An
  entry carrying `VALUE` instead of `URI` is skipped. A document that won't load or won't parse is warned about
  (ungated, like the package's other reporting paths) and projects nothing.

## What's not implemented

Extension boundaries, each a candidate slice on this doc or its own:

- **Images.** `Chapter.images` is parsed (URLs resolved against the document) but not projected — no thumbnail or
  chapter-art consumer yet.
- **Metadata.** `Chapter.metadata` is passed through untouched; nothing reads it.
- **Other `DATA-ID`s.** Recorded on the presentation, no consumer. Reading one is `getSessionData(presentation, id)`.
- **Several chapters entries.** Only the first with a URI is read; merging per-`LANGUAGE` documents would need a
  cue-dedupe policy nothing calls for yet.
- **Live / EVENT chapters.** The open chapter's `MAX_SAFE_INTEGER` end is never clamped while the duration is
  non-finite, and the time-slider UI shows nothing for a non-finite duration.
- **Language fallback.** Exact BCP-47 match only; no region/base-language collapsing.

## Implementation surface

**Composition:** `chaptersFeature` (`packages/spf/src/playback/engines/hls/features/chapters.ts`),
composed by `packages/spf/src/playback/engines/hls/engine.ts` and
`packages/spf/src/playback/engines/hls/engine-audio-only.ts`.

| Piece | File | Responsibility |
|---|---|---|
| `loadChapters` | `packages/spf/src/playback/behaviors/dom/load-chapters.ts` | Reactor gated on media element + resolved presentation + a chapters entry with a URI; hands its controller's signal to `loadChaptersTracks`, aborting it on exit |
| `loadChaptersTracks` | `packages/spf/src/media/dom/text/load-chapters-tracks.ts` | Fetches, parses, and adds one document's tracks; aborting its signal cancels the fetch and removes them. Also used by the hls.js and native HLS adapters |
| `parseMultivariantPlaylist` | `packages/spf/src/media/hls/parse-multivariant.ts` | Records `#EXT-X-SESSION-DATA` as `SessionDataEntry[]` under `presentation.metadata` |
| `parseSessionData` / `findSessionDataUri` | `packages/spf/src/media/hls/session-data.ts` | One tag → `SessionDataEntry`; the first entry's resolved `URI` read straight from playlist text, for native HLS |
| `getSessionData` / `getMultivariantPlaylistMetadata` | `packages/spf/src/media/types/index.ts` | Typed reads of the recorded entries |
| `parseHlsJsonChapters` | `packages/spf/src/media/hls/parse-json-chapters.ts` | Apple JSON (typed as its schema, `HlsJsonChapters`) → `Chapter[]`, document order, `duration` or next start as end, images resolved |
| `addChaptersTracksToMedia` / `removeAllChaptersTracksFromMedia` | `packages/spf/src/media/dom/text/chapters-tracks.ts` | Per-language hidden tracks, ordering, settle-then-fill, `OPEN_CHAPTER_END`, ownership tag |

**State:** reads `presentation` (its session-data metadata); writes none. **Context:** reads `mediaElement`.

## Config surface

```ts
{
  preferredSubtitleLanguage?: string; // shared with subtitles: which language's chapters track leads
}
```

## Verification

- `packages/spf/src/media/hls/tests/parse-multivariant.test.ts` — `EXT-X-SESSION-DATA` recording, URI resolution,
  `FORMAT` default, repeated `DATA-ID` per `LANGUAGE`, spec-invalid tags skipped.
- `packages/spf/src/media/types/tests/metadata.test.ts` — the accessors.
- `packages/spf/src/media/hls/tests/parse-json-chapters.test.ts` — document order, end derivation, images, metadata,
  entries without titles.
- `packages/spf/src/media/dom/text/tests/chapters-tracks.test.ts` — element shape, ordering, settle-then-fill,
  `change` after fill, the `OPEN_CHAPTER_END` end, ownership isolation from subtitle tracks.
- `packages/spf/src/media/hls/tests/session-data.test.ts` — `findSessionDataUri`: resolution, first entry with a URI.
- `packages/spf/src/media/dom/text/tests/load-chapters-tracks.test.ts` — preferred language, removal and
  cancellation on abort, an already-aborted signal.
- `packages/spf/src/playback/behaviors/dom/tests/load-chapters.test.ts` — gating (media element, entry),
  projection, first-entry selection, quiet failure, abort on source change, cleanup on unload and destroy.
- `packages/spf/src/playback/engines/hls/tests/engine.test.ts`, `engine-audio-only.test.ts` — end to end from a
  manifest carrying the tag, including that the track's mode changes never register as subtitle intent.
- `packages/core/src/dom/store/features/tests/text-track.test.ts` — `chaptersCues` clamped to a finite media duration
  and re-synced on `durationchange`.
- **Sandbox / smoke:** no in-repo source — the chapters-bearing Mux assets live on staging, and staging URLs stay out
  of the repository; reviewers get one out of band and assign it as a `source` on the `*-mux-video-spf` presets.
  Verified headless in Chromium against a CMAF staging asset (2026-09-15): the track projects before playback (cues
  `0→3`, `3→open`), the store mirrors them in `chaptersCues` with the open end clamped to the media duration, the time slider partitions at 12.6%, and the hover
  title follows the pointer.

## Outside SPF

The hls.js adapter (`HlsJsChaptersMixin`) and native HLS playback (`NativeHlsChaptersMixin`, fetching the
multivariant playlist itself) load the same tracks through SPF's `loadChaptersTracks(media, url, signal)` from
`@videojs/spf/dom`; native HLS finds the document with `findSessionDataUri` from `@videojs/spf/hls`.

- **hls.js reads the last entry.** hls.js keeps one `sessionData` entry per `DATA-ID`, the last, and the mixin reads
  it as-is rather than reparsing the playlist. SPF and native HLS read the first entry with a `URI`, so the paths
  differ only for a playlist naming several chapters documents.
- **Language preference.** The hls.js mixin leads with hls.js's own `subtitlePreference.lang`, the counterpart of
  SPF's `preferredSubtitleLanguage`. Native HLS has no preference to read, so `und`, then first-seen, leads.
- **Mux's metadata document is fetched twice.** Mux publishes asset metadata as an Apple JSON chapters document, so
  when a playlist names it as its chapters, `MuxMetadataLoader` and `loadChaptersTracks` each fetch it. Sharing the
  request would need a hook between the adapters for a small, cacheable (`max-age=300`) document.
- **Safari's own chapter tracks.** WebKit reads the same session data and adds one chapters text track per language
  after the `<track>` children, holding no cues (measured in Playwright WebKit on macOS, 2026-09-30). The projected
  track leads, so the store reads it. `apps/e2e/suites/player/tests/hls-chapters.spec.ts` covers this.
- **Native HLS must not swallow child errors.** A srcless `<track>` settles by firing `error`, and
  `NativeHlsErrorsMixin`'s capture listener on the media element used to stop it before it reached the track, so
  cues were never filled.

## Related features

- **[subtitles](./subtitles.md)** — shares the `<track>` mechanism and the text-track DOM surface; distinct
  ownership tag, no participation in text selection. Its `syncTextTracks` `change` bridge only reads showing
  caption/subtitle tracks, which is what makes the chapters track's mode changes inert to it.
- **hls-multivariant-parsing** *(not yet documented)* — session-data recording is one slice of multivariant parsing.

## See also

- [presentation-modeling.md](../presentation-modeling.md) — the format-neutral `Presentation` shape and its `metadata`
  bag that session data lands in
- [text-track-architecture.md](../text-track-architecture.md) — the text-track Actor/Reactor deep-dive the subtitle
  tracks come from
- [conventions/behaviors.md](../conventions/behaviors.md) — the flat-composition and cleanup conventions this follows
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md) — engine composition walkthrough
