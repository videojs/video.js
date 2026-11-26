# Friction log: building the GIF use case

What cost time while building this use case, beyond the architecture gaps the README lists under "What it surfaced".
Most of it is documentation or packaging rather than design. Each item says what happened and what would have
prevented it, so the actionable ones can become issues once the team has looked.

## API surface

- `definePlayerFeature` and `MediaAttachMixin` are marked `@internal`, yet they are the only way to add store state or
  register a custom element as a media. Any adapter or skin author hits both on day one. Either they are public, or
  there is a public wrapper that should be documented instead.
- The React media components share a `useSyncProps` helper (`packages/react/src/utils/use-sync-props.ts`) that is
  not exported. `react.tsx` here carries a copy. Anyone writing a React media component outside the package will copy
  it too.
- The store exposes state directly (`store.loop`, `store.currentFrame`), not through a `getState()` call. The store
  package documents this, but every other store library says `getState()`, and the first round of feature tests was
  written against the wrong shape.
- `paused`, `ended`, `started`, and `waiting` live in the playback feature. `loop` does not live anywhere. It is a
  `<video>` attribute every video skin wants to toggle, so its absence reads as an oversight rather than a decision.
- The playback-rate button's render state calls the value `rate`; the store calls it `playbackRate`. Same number, two
  names, and the skin code has to use both.

## Skins

- A time slider's fill width and thumb position come from the `--media-slider-fill` custom property. Nothing says so.
  The first attempt read `--slider-fill`, the skin rendered with no fill, and nobody noticed until a screenshot. The
  custom properties a skin is expected to read need a list, ideally on the primitives that set them.
- The HTML skins render in shadow DOM, so Tailwind cannot reach them and every HTML skin re-declares its CSS by hand.
  The React and HTML versions of this skin share no tokens; the same sizes, colors, and transitions are typed twice.
- `media-play-button` and the other buttons render no icons. The convention is to slot spans for each state and write
  the `data-paused` / `data-ended` CSS yourself. The only documentation of that convention is the default skin's
  template.
- `media-playback-rate-button` renders no rate text either. The skin binds it from the store.
- The stock skins show the poster layer until playback starts even when no poster is set, so a canvas media's first
  frame sits behind a dark overlay. (The README has the architectural version of this; the friction is that it took a
  screenshot to understand why the GIF "was not loading".)

## Sandbox and tooling

- The sandbox has no jsdom, so element and React component tests cannot run there. Rendering was verified with
  Playwright scripts against the dev server instead, which is the better check anyway, but it should be the documented
  path rather than something each author rediscovers.
- Vitest only collects `app/tests/**/*.test.ts`, which is why this use case's tests live apart from its code.
- `vp lint --quiet` hides warnings. "Lint is clean" meant nothing until `vp check` ran and turned up eight anti-slop
  warnings in files already called done. The anti-slop rules (`padding-line-between-statements`,
  `require-safety-comment`, `no-runtime-typeof`, and friends) are worth a short page of their own.
- `vp check` and `vp fmt` report "Expected at least one target file" when given absolute paths or when run from
  `apps/sandbox`. Repo-relative paths from the repo root work. The message does not say that.
- A fresh worktree needs, in order: `pnpm install --frozen-lockfile`, a full package build, the skins' shadcn build,
  and the sandbox setup script before any page loads. None of that is written down in one place.
- The lockfile release-age policy makes "add a dependency" a day-blocking operation. That is the real reason the GIF
  decoder in `gif/` is hand-written rather than a package. Fine for a sandbox experiment, but worth knowing before
  reaching for `pnpm add`.

## Node-only gotchas

- `HTMLCanvasElement` and `ImageData` do not exist in Node, so the adapter duck-types its canvas target and the tests
  stub `ImageData`. Workable, but it shaped the adapter's `attach()` signature, which takes an `EventTarget` and checks
  for `getContext` at runtime.
- `ImageDecoder` is also absent in Node, so the WebCodecs decoder is tested with a fake and the parser fallback carries
  the real decode coverage.
