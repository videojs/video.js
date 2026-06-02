# React Native — Media-contract feature reuse (base-lib prerequisites)

**Status:** STUB — not started

Required work before RN can reuse the base-lib store features over the DOM-free
`Media` contract instead of faking an `HTMLMediaElement`. Design context:
[`internal/design/react-native/index.md` § Not portable as-is](../../../internal/design/react-native/index.md)
and the "Closing the shared-feature DOM leaks" open question.

**Important:** almost all of this work lands in `packages/core` and
`packages/utils` (the base lib), **not** in the RN package. It removes DOM leaks
and DOM-bucket dependencies from features that have no business carrying them.
RN is the forcing function, but the base lib is the beneficiary.

## Where things stand (audit)

The contract is built and adopted: `PlayerTarget.media` is typed as `Media`
(not `HTMLMediaElement`), features narrow via `dom/media/predicate.ts` guards,
and `listen(media, …)` already type-checks against the contract. What blocks
running features on a *non-DOM* `Media` implementation:

### Tier A — adapter-shared, no inline DOM-global leak
`buffer`, `error`, `live`, `playback-rate`, `stream-type`, `time`. Observe the
media surface via the contract; only blocked by the shared DOM *utilities* they
import (below).

### Tier B — adapter-shared, one enumerated inline leak each
- `playback.ts:43` — `media.readyState < HTMLMediaElement.HAVE_FUTURE_DATA`
- `source.ts:32` — `media.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA`
- `volume.ts:62` — `document.createElement('video')` (volume-support probe)

`HTMLMediaElement` is undefined in RN, so the first two **crash**; the third is a
DOM-only capability probe.

### Tier C — RN-variant-required regardless (inherently platform-specific)
`fullscreen`, `pip`, `controls`, `remote-playback`, `text-track`. Their DOM
dependence is intrinsic (Fullscreen/PiP APIs, pointer/focus activity, `<track>`
discovery, W3C Remote Playback) and often lives in imported helpers
(`requestFullscreen`, `findGestureCoordinator`, `getTextTrackList`,
`findTrackElement`). These are re-authored as RN feature variants (same state
shape) — **out of scope for this plan**; tracked under RN feature variants.

## Tasks

### 1. Export the readyState constant; fix Tier B leaks
- [ ] Export `MediaReadyState` from `core/media/types.ts` (today only the
      `MediaReadyStateValue` *type* is exported; the const is module-private).
- [ ] `playback.ts` / `source.ts`: replace `HTMLMediaElement.HAVE_*` with the
      contract constant. Removes the crash from two core features.

### 2. DOM-free utilities for shared features
Shared features import from `@videojs/utils/dom`; RN should not pull the DOM
bucket. Decide per helper — contract-native equivalent vs. inline the contract's
own API:
- [ ] `listen` — `Media.addEventListener` (EventTargetLike) **already accepts a
      `{ signal }` option**, so shared features can drop `listen` and call
      `media.addEventListener(type, cb, { signal })` directly. (`listen` stays
      for real DOM targets like `container` in Tier C.) Confirm and migrate.
- [ ] `onEvent` (used by `time.ts`) — needs an EventTargetLike-compatible variant
      (DOM-free location, e.g. `@videojs/utils`), or rewrite on the contract.
- [ ] `serializeTimeRanges` (used by `buffer.ts`) — operate on `TimeRangeLike`
      (the contract type), not DOM `TimeRanges`. Move to a DOM-free util.

### 3. Volume-support probe (volume.ts)
- [ ] Replace `document.createElement('video')` volume probe with a
      capability-based or platform-injected probe (the result is a boolean
      "does this platform honor `volume`"). Candidates: a `MediaVolumeCapability`
      detail, or a small platform hook. iOS/Android answer natively.

### 4. Verify features run on a non-DOM Media
- [ ] Add a minimal in-memory `Media` test host (implements the capability
      interfaces + `EventTargetLike`, no DOM) and exercise each Tier A/B feature's
      `state()` + `attach()` against it (seed, event → `set`, actions → host).
- [ ] This doubles as the contract for the RN native host to satisfy.

### 5. Coordinate with media.md (draft)
- [ ] `media.md` is `status: draft`; confirm the capability surface is stable
      before depending on it. Flag any shape this work forces (e.g. a
      `MediaReadyState` export, a volume-probe capability) back into the doc.

## Out of scope

- RN feature variants for Tier C (`fullscreen`, `pip`, `controls`,
  `remote-playback`, `text-track`) — separate work; same state shapes.
- The RN native host implementation itself (see
  [`persistent-session.md`](./persistent-session.md) and the native module
  structure in the design doc).

## Definition of done

Every Tier A/B feature compiles and runs against the in-memory non-DOM `Media`
host with no reference to `HTMLMediaElement`, `document`, or `@videojs/utils/dom`;
the readyState constant is exported and used; the shared DOM utilities have
DOM-free equivalents. At that point RN composes the shared features directly over
its native `Media` host.
