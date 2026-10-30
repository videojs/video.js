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

## The audio, two ways

Three public-domain recordings from LibriVox, chosen for range: a three-hour collaborative reading where the reader
changes every chapter (Alice), an eight-hour solo novel (Frankenstein, Cori Samuel), and an eleven-hour story
collection where each "chapter" is a self-contained story (The Adventures of Sherlock Holmes, Mark F. Smith).

The switch at the top of the library plays the same recording from two places, which is the point of the page:

- **Mux stream.** LibriVox publishes one MP3 per section; each title was stitched into one AAC file with ffmpeg so
  every chapter sits on a single clock, and sent to Mux as an audio-only asset with loudness normalization (the
  collaborative reading needs it), an `audio.m4a` static rendition, the title in `meta.title`, the LibriVox id in
  `meta.external_id`, and a `text_type: "chapters"` track holding the sections, measured off the stitched file. Mux
  publishes the title in the asset's metadata document and names the chapters in the HLS manifest as
  `com.apple.hls.chapters` session data; the Mux adapter reads the first and the hls.js adapter loads the second as a
  chapters `<track>`, so the app passes nothing but a `src` and the player has a title and chapters. Auto-generated
  English subtitles were requested too, for a future read-along.
- **Plain file.** LibriVox's single-file M4B edition of the same recording on archive.org, played by a stock `<Audio>`.
  A file carries nothing the browser exposes, so the app supplies the title through the Player and the chapters as a
  `<track kind="chapters">` built from `library.ts`. Alice has no file source: its archive.org item sits on a node that
  refuses ranged requests.

Everything else is the same code on both sides: the position, bookmarks, and recent places are keyed by title, not by
source, so switching the source picks up where the other left off. `library.ts` is generated from the stitch output by
`scripts/gen-library.py` (`scripts/stitch.py` does the stitching) and holds the chapter table, readers, cover, Mux
playback and track ids, and the file URL for each title. `chapters/*.chapters.json` are the documents attached to the
Mux assets, in Apple's HLS chapters JSON shape (`start-time`, `titles`), which is what Mux validates a chapters track
against; it rejects WebVTT.

## Parts

- `books.ts` — the `Audiobook` and `AudiobookChapter` shapes, the Mux source URL, the chapters-as-WebVTT document for
  the plain-file `<track>`, and `chapterAt()`.
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
  media component (`<MuxAudio>` for the stream, `<Audio>` plus a chapters `<track>` for the file, and the lock-screen
  metadata either way), `useChapters()` and `useTitle()` which read whatever the media brought, the mini bar, the full
  view, and the four sheets behind its tabs. Composed from stock primitives: `PlayButton`, `SeekButton`, `TimeSlider`
  with
  `TimeSlider.Chapters`, `Time.Value`, and `Dialog` for the sheets.
- `../../templates/audiobook-react/` — the app shell: a phone frame, the library, and the state that says which title
  is open and whether the full view is up.

Tests are in `app/tests/{progress,bookmarks,sleep-timer,media-session}-feature.test.ts` over a `FakeAudio` helper
that fires the events a `<audio>` would.

## What the architecture handled without changes

- A player that outlives the page's views. The `Player` is React context; the library, the mini bar, and the full
  view all read the same store, and the media element stays mounted while the listener browses.
- Chapters on `<audio>`. The `textTrack` feature reads a `<track kind="chapters">` off an audio element exactly as it
  does off a video, whether the app added it or the hls.js adapter did from the manifest's session data, and
  `TimeSlider.Chapters` splits the slider per chapter with no audio-specific code.
- Title and chapters from the stream. With the chapters track on the Mux asset, the Mux media needs only its `src`: the
  adapters already fetch the metadata document and the chapters document, and the skin reads both off the store.
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
- A Mux chapters track is validated against Apple's HLS chapters JSON, not WebVTT, and the error says only "failed
  validation". An errored track cannot be deleted and blocks any other chapters track on the asset, so a wrong first
  try costs a re-upload. Both belong in the Mux docs; the first belongs in the API error.
- A position-anchored sleep timer, resume-on-return, bookmarks, and listening stats all needed nothing from the media
  beyond `currentTime`, `paused`, and the standard events. The capability model held; the gaps were all in what the
  presets ship, not in what the contract allows.
