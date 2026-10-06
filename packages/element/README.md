# @videojs/element

[![package-badge]][package]

A lightweight reactive custom element base class for Video.js. Type-aligned with [Lit's ReactiveElement](https://github.com/lit/lit/tree/main/packages/reactive-element) but stripped down to only what we use.

```bash
npm install @videojs/element
```

## Why?

Video.js web components used `@lit/reactive-element` but only needed a fraction of its API — reactive properties, batched updates, and controllers. The rest (Shadow DOM, `static styles`, decorators, complex attribute converters, `shouldUpdate`, custom scheduling) shipped as dead code (~2.8 kB brotli).

`@videojs/element` provides the same programming model at ~840 B brotli.

## Quick Start

```ts
import { ReactiveElement } from '@videojs/element';
import type { PropertyValues } from '@videojs/element';

class MyElement extends ReactiveElement {
  static override properties = {
    label: { type: String },
    disabled: { type: Boolean },
  };

  label = 'Click me';
  disabled = false;

  protected override update(changed: PropertyValues): void {
    super.update(changed);
    this.textContent = this.label;
  }
}

customElements.define('my-element', MyElement);
```

## Alignment with Lit

The API is a subset of Lit's `ReactiveElement`. Types are aligned so controllers written for Lit work with `@videojs/element` without changes.

### What's included

- **`static properties`** — Declare reactive properties with `type` (`String`, `Boolean`, `Number`) and `attribute` (custom attribute name)
- **Reactive accessors** — Installed automatically, change detection via `Object.is()`
- **Batched updates** — Multiple property changes in one tick trigger a single update via `queueMicrotask()`
- **Full lifecycle** — `willUpdate` → `update` → `firstUpdated` (first time) → `updated` → `updateComplete`
- **`hasUpdated`** — `false` until first update completes, `true` during `firstUpdated` and `updated` (matches Lit)
- **`isUpdatePending`** — `true` while an update is queued or in progress
- **`performUpdate()`** — Synchronously flush a pending update
- **`scheduleUpdate()`** — Override point for custom update timing (default calls `performUpdate()`)
- **Reactive controllers** — `addController`/`removeController` with `hostConnected`, `hostDisconnected`, `hostUpdate`, `hostUpdated`
- **Element upgrade handling** — Properties set before registration are preserved

### What's NOT included

| Lit feature | Why excluded |
|---|---|
| Shadow DOM / `createRenderRoot()` | We use light DOM exclusively |
| `static styles` / CSS adoption | No shadow root to adopt into |
| Decorators (`@property`, `@state`) | We use `static properties` |
| `shouldUpdate()` | No use case for skipping updates |
| `getUpdateComplete()` | No async update chaining needed |
| `reflect` option | No property-to-attribute reflection |
| `converter` option | Simple type coercion is sufficient |
| `state` option | All properties are observable |
| `hasChanged` option | `Object.is()` is always used |

### Property inheritance

Lit walks the prototype chain to collect properties from all ancestors. We don't — subclasses that define their own `static properties` must spread the parent:

```ts
class FancyButton extends MyButton {
  static override properties = {
    ...MyButton.properties,
    variant: { type: String },
  };
}
```

This is only needed when a subclass declares `static properties`. If it doesn't, JS static property inheritance means the parent's properties are used automatically.

## Context

Context is re-exported from [`@lit/context`](https://github.com/lit/lit/tree/main/packages/context) — the same implementation used across the Lit ecosystem:

```ts
import { createContext, ContextProvider, ContextConsumer } from '@videojs/element/context';
```

This provides tree-scoped data sharing without prop drilling, using Lit's [Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](../../LICENSE)

[package]: https://www.npmjs.com/package/@videojs/element
[package-badge]: https://img.shields.io/npm/v/@videojs/element?label=@videojs/element
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/v10/discussions
