---
status: implemented
date: 2026-03-05
---

# Destroy Lifecycle: DestroyMixin

## Decision

The deferred destruction lifecycle is implemented as a **composable mixin** (`DestroyMixin`)
exported from `@videojs/element`, rather than being added directly to `ReactiveElement`.

`ReactiveElement` stays structurally compatible with Lit's `ReactiveElement`.

## Architecture

```
@videojs/utils/dom   → deferFrames() composable utility
@videojs/element     → DestroyMixin(HTMLElement) — generic, works with any base
@videojs/html        → UIElement = DestroyMixin(ReactiveElement) + hostDestroyed()
@videojs/core        → HlsCustomMedia = DestroyMixin(HTMLElement) via CustomMediaMixin
```

### DestroyMixin

Adds `destroyed`, `destroy()`, `destroyCallback()`, deferred 2-rAF scheduling on
disconnect, cancel on reconnect, and `keep-alive` attribute support. Works with any
`HTMLElement` subclass.

### UIElement

Composes `DestroyMixin(ReactiveElement)` and bridges `destroyCallback()` to
`hostDestroyed()` on reactive controllers. Also guards `performUpdate()` when destroyed.

### HlsCustomMedia

Uses `DestroyMixin(HTMLElement)` as the base for `CustomMediaMixin`. The `DelegateMedia`
class (from `DelegateMixin`) overrides `destroyCallback()` to call
`this.#delegate.destroy?.()`, which destroys the HLS engine.

## Why a Mixin

- `ReactiveElement` stays Lit-compatible (no added public surface)
- Works with `HTMLElement` directly (no `ReactiveElement` required for media components)
- Composable — any element can opt in

## Alternatives Considered

- **Put everything on `ReactiveElement`** — Simpler (direct `#controllers`
  access), but breaks Lit structural compat. Rejected.
- **Separate `UIElement` class without mixin** — Doesn't compose with
  `CustomMediaMixin(HTMLElement)` for media components. Rejected.
