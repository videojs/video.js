# Friction log: building the audiobook use case

What cost time while building this use case, beyond the architecture gaps the README lists under "What it surfaced".
The GIF use case has its own log with the tooling and skin-authoring items that this one hit again.

- Feature inputs are text only. `PlayerFeatureConfig` types every input action as taking `string | null | undefined`,
  and the error that says so is a `satisfies` failure deep in a mapped type, not a sentence. It took reading
  `player.ts` to learn that an object can never be a player input.
- `state()` receives `get`, but its return type is `{}` there because the state type is what `state()` returns. Using
  `get()` inside an action compiles only in `attach`. The bookmarks feature keeps its list in a closure instead; the
  shape of that rule should be in the `definePlayerFeature` doc comment.
- Store subscribers are notified on the next microtask. Two tests were written assuming synchronous notification and
  failed in ways that looked like feature bugs.
- `usePlayerExtension` and `useExtensionRegistrar` are internal, so a custom extension cannot be registered from React
  at all. That turned Media Session from an extension into a feature.
- `audioFeatures` has no `textTrack`, so chapters on an audio player are opt-in and nothing says so until the slider
  renders one undivided segment.
- `SeekButton`, `PlayButton`, and friends render no icon and no text. `aria-label` is there; the visible part is the
  author's job, and every skin draws it again. For skip buttons that means drawing the number into the arrow by hand.
- The React `Dialog` works as a bottom sheet with no fuss, but there is no example of it outside the error dialog, so
  whether `Popup` portals, traps focus, or closes on backdrop click was found by trying it.
- Playwright: Chrome's autoplay policy needs `--autoplay-policy=no-user-gesture-required` or the first `play()` is
  refused; a `networkidle` wait never resolves while the Vite dev server's HMR socket is open, so wait for `load`.
- archive.org's `download/` path for images returns 500 at random; the `services/img/` thumbnail path does not. The
  cover component carries a fallback for it.
- The sandbox setup script re-mirrors every template and regenerates the skin registry, which makes the dev server
  reload every open page for several seconds. Running a browser check during that window times out.
