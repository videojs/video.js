# Use case: an audiobook app

Libby, Audible, and Apple Books all play the same kind of thing: one very long audio file, a table of contents on top
of it, and a listener who comes back to it over weeks. The player is a part of the app, not a box on a page. This use
case builds that app around a Video.js player: one store, one media, a mini bar that follows the listener through the
library, a full view on top, and the four pieces of state an audiobook needs that a video does not.

Everything lives in the sandbox for now. Nothing here is published or part of a package.

## Page

| Page                | What it shows                                                                      |
| ------------------- | ---------------------------------------------------------------------------------- |
| `/audiobook-react/` | A phone-sized library of three LibriVox titles, a mini player, and "Now playing". |

Open a title, press play, skip around, jump chapters from Contents, drop a bookmark with a note, set a sleep timer for
the end of the chapter, change the speed, collapse to the mini bar, reload the page: it picks up where you were. The
lock screen and hardware keys work through the Media Session API.

## The audio

Three public-domain recordings from LibriVox, chosen for range: a three-hour collaborative reading where the reader
changes every chapter (Alice), an eight-hour solo novel (Frankenstein, Cori Samuel), and an eleven-hour story
collection where each "chapter" is a self-contained story (The Adventures of Sherlock Holmes, Mark F. Smith).

LibriVox publishes one MP3 per section. Each title was stitched into one AAC file with ffmpeg so that every chapter
sits on a single clock, the way the apps above present it, and the chapter boundaries were measured off the actual
files rather than LibriVox's rounded section lengths. Each file was then sent to Mux as an audio-only asset with
loudness normalization (the collaborative reading needs it), an `audio.m4a` static rendition for a future "download
for offline" affordance, and the title, LibriVox id, and archive.org item in `meta` and `passthrough`. The player
streams the HLS rendition. `library.ts` is generated from the stitch output by `scripts/gen-library.py`
(`scripts/stitch.py` does the stitching) and holds the chapter table, readers, cover, and links for each title.

Mux carries the chapters itself: each asset has a `text_type: "chapters"` track, which Mux validates against
Apple's HLS chapters JSON shape (`start-time`, `titles`), not WebVTT, and serves back as both JSON and
WebVTT beside the stream. The player loads that WebVTT as its `<track kind="chapters">`, so the chapters the app shows
are the ones on the asset. `chapters/*.chapters.json` are the documents that were attached.

## Parts

- `books.ts` — the `Audiobook` and `AudiobookChapter` shapes, the Mux source URL, the chapters-as-WebVTT document, and
  `chapterAt()`.
- `library.ts` — the three titles. Generated; do not edit by hand.
- `features/` — four store features, none of them audiobook-specific:
  - `progressFeature` remembers the position per title and restores it once the media has metadata, counts seconds
    actually listened, and keeps "recent places": where the listener was before each long jump, so a slip of the
    finger is recoverable. Keyed by the `progressKey` player input.
  - `bookmarksFeature` keeps bookmarks with notes per title, keyed by `bookmarksKey`. The media only lends its clock.
  - `sleepTimerFeature` pauses at a wall-clock moment (`{ minutes }`) or at a media position (`{ until }`), which is
    how "end of this chapter" works at any playback rate. Seeking past the position cancels it.
  - `mediaSessionFeature` publishes metadata, playback state, and position to the platform and takes play, pause,
    seek, and skip from the lock screen and hardware keys. Any media with pause and seek qualifies.
  - `storage.ts` is `localStorage` behind try/catch, with a memory version for tests. Each feature takes one.
- `skin/react.tsx` — the player (`createPlayer` over the audio preset plus `textTrack` and the four features), the
  media component (`<MuxAudio>` with the chapters `<track>` and the lock-screen metadata), the mini bar, the full view,
  and the four sheets behind its tabs. Composed from stock primitives: `PlayButton`, `SeekButton`, `TimeSlider` with
  `TimeSlider.Chapters`, `Time.Value`, and `Dialog` for the sheets.
- `../../templates/audiobook-react/` — the app shell: a phone frame, the library, and the state that says which title
  is open and whether the full view is up.

Tests are in `app/tests/{progress,bookmarks,sleep-timer,media-session}-feature.test.ts` over a `FakeAudio` helper
that fires the events a `<audio>` would.

## What the architecture handled without changes

- A player that outlives the page's views. The `Player` is React context; the library, the mini bar, and the full
  view all read the same store, and the media element stays mounted while the listener browses.
- Chapters on `<audio>`. The `textTrack` feature reads a `<track kind="chapters">` off an audio element exactly as it
  does off a video, and `TimeSlider.Chapters` splits the slider per chapter with no audio-specific code.
- Four features in one `createPlayer` call, two of them with player inputs (`progressKey`, `bookmarksKey`) that
  arrive as ordinary props on `<AudiobookPlayer>`.
- Mux audio-only HLS through the stock `MuxAudio` component with nothing but a `src`.

## What it surfaced

- The audio preset leaves `textTrack` out. Chapters are the most common text track an audio title has, so an audio
  player that wants them has to add the feature itself. The preset should probably include it.
- Feature inputs are text only. `PlayerFeatureConfig` requires each action to accept `string | null | undefined`,
  which is right for an HTML attribute and wrong for a React prop that wants to carry an object. The book, the
  lock-screen metadata, and a storage instance all had to go around the input mechanism: the first as a React prop, the
  second as a store action called from an effect, the third as a factory argument.
- Store subscribers hear about a change on the next microtask, not synchronously. Fine for UI, surprising in a
  feature whose `attach` reacts to another feature's input, and surprising in a test.
- There is no public way to register a custom extension from React. `usePlayerExtension` and `useExtensionRegistrar`
  are internal, so Media Session became a feature rather than the extension it more naturally is.
- `playbackRates` is not configurable. The stock rate button cycles 0.2 to 2 in steps nobody listening to a book
  wants, so the skin carries its own button over `setPlaybackRate`.
- `MediaSession` appears nowhere in the packages. Every audio app and most video apps want it; it is a one-feature
  job and belongs in core.
- A position-anchored sleep timer, resume-on-return, bookmarks, and listening stats all needed nothing from the media
  beyond `currentTime`, `paused`, and the standard events. The capability model held; the gaps were all in what the
  presets ship, not in what the contract allows.
