---
status: draft
---

# React Native Player Public API

> **STUB** — opened to get buy-in on the RN player's public API surface. The
> owned design (architecture, native construction, decisions) lives in
> [`internal/design/react-native/`](../internal/design/react-native/index.md);
> this RFC exists for the cross-package, user-facing contract that needs
> alignment.

## Problem Statement

The planned `@videojs/react-native` package needs a public API. The design doc
commits to a [parity principle](../internal/design/react-native/index.md#guiding-principle-parity-with-the-react-player):
the RN player should match `@videojs/react` as closely as the platform allows —
same component names, prop names, hook signatures, layer split, and feature set.

That principle is a public-API and product-direction commitment across packages,
so it needs buy-in rather than being decided unilaterally:

- It constrains the RN API to track the React API (and arguably the reverse — RN
  needs may push capabilities like external-store ownership back onto web).
- It introduces platform-only surface (a separate `<BackgroundablePlayer.Provider>`
  and a persistent `backgroundSession`) that has no web equivalent.
- It defines where divergence is allowed (styling, accessibility mapping).

What happens if we do nothing: the RN package gets built with an ad-hoc API that
drifts from the React player, and cross-platform users re-learn the player per
platform.

## Customer Salience

*(To be filled in.)* Initial read:

- **Who:** player integrators building on both web and native; teams
  standardizing on Video.js across platforms.
- **How many:** a meaningful minority today (RN is unbuilt), growing as RN ships.
- **How strongly:** parity strongly reduces cross-platform learning cost; API
  drift would be a persistent friction for anyone targeting both.

## Options Considered

*(To be filled in. Sketch:)*

**Option 1: Strict parity** — RN mirrors React API 1:1 except where the platform
makes it impossible. Lowest cross-platform learning cost; constrains RN to React
shapes that may not always fit native idiom.

**Option 2: RN-idiomatic API** — design RN's API to native conventions, parity
as a non-goal. Best native feel; highest divergence and learning cost.

**Option 3: Parity-by-default with documented exceptions (design-doc lean)** —
match React wherever the platform allows; each divergence (styling, a11y
mapping, platform-only capabilities) is justified and documented.

## Recommendation

*(To be filled in.)* Design-doc lean is Option 3. RFC exists to confirm that's
the right cross-package tradeoff and to align on the divergence list.

## Open items to resolve here

- The exact divergence list (styling, accessibility mapping, platform-only
  capabilities).
- Whether external/hoisted-store ownership (needed for the RN persistent
  session) is also exposed on the web for true parity.
- Public shape of platform-only surface: the separate
  `<BackgroundablePlayer.Provider>` (vs. a `backgroundPlayback` boolean on the
  shared provider), the `backgroundSession` imperative API, and the
  persistent-session model. Whether two providers (over a shared core) is the
  right web-parity tradeoff vs. distinguishing by a `store` prop on a single
  provider.

## Final Decision

*(Completed after review)*

**Decision:**
**Rationale:**
**Date:**

## See Also

- [`internal/design/react-native/index.md`](../internal/design/react-native/index.md)
  — owned design (architecture + API surface).
- [`internal/design/react-native/decisions.md`](../internal/design/react-native/decisions.md)
  — debated native-construction decisions.
- [`.claude/plans/react-native/persistent-session.md`](../.claude/plans/react-native/persistent-session.md)
  — implementation plan for the persistent session.
- [`rfc/player-api/`](./player-api/index.md) — the web player API RFC this aims
  for parity with.
