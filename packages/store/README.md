# @videojs/store

[![package-badge]][package]

A reactive store for managing state owned by external systems. Built for media players, streaming libraries, and real-time systems where you don't own the state.

> **Note:** The authoring APIs this README describes, including `createStore`, `defineSlice`, `combine`, `createState`, `flush`, `isState`, `InferStoreTarget`, and the store error helpers, are internal building blocks of the Video.js player and may change between releases. To read player state, use the player's own APIs, such as `usePlayer` and `PlayerController`. The store APIs that are stable and documented are `useStore`, `useSelector`, `useSnapshot`, `createSelector`, `shallowEqual`, `StoreController`, `SnapshotController`, and `SubscriptionController`; see the [API reference](https://videojs.org/docs/framework/react).

```bash
npm install @videojs/store
```

## Why?

[Traditional state management](#how-its-different) assumes you own the state. But when working with a `<video>` element, Web Sockets, streaming libraries, and real-time systems, the external system is the authority. You observe it, send requests to it, and react to its changes.

`@videojs/store` embraces this model:

- **Read Path**: Observe external state, sync to reactive store
- **Write Path**: Send requests to the target, handle failures

```ts
import { createStore, defineSlice } from '@videojs/store';

const volumeSlice = defineSlice<HTMLMediaElement>()({
  state: () => ({ volume: 1 }),
  attach: ({ target, set, signal }) => {
    const sync = () => set({ volume: target.volume });
    target.addEventListener('volumechange', sync, { signal });
  },
});

const store = createStore<HTMLMediaElement>()(volumeSlice);
store.attach(videoElement);

// State is flat on the store
const { volume } = store;
```

## Core Concepts

### Target

The target is a reference to the external system. Slices read from and write to it.

```ts
const videoElement = document.querySelector('video');
store.attach(videoElement);
```

### Slices

A slice defines state, how to sync it from the target, and actions to modify the target.

```ts
import { defineSlice } from '@videojs/store';
import { listen } from '@videojs/utils/dom';

const volumeSlice = defineSlice<HTMLMediaElement>()({
  state: ({ target }) => ({
    volume: 1,
    muted: false,

    // Sync - use target() directly
    setVolume(value: number) {
      const media = target();
      media.volume = Math.max(0, Math.min(1, value));
    },

    // Action - directly updates target
    toggleMuted() {
      const media = target();
      media.muted = !media.muted;
      return media.muted;
    },
  }),

  attach({ target, signal, set }) {
    const sync = () => set({ volume: target.volume, muted: target.muted });

    sync();

    listen(target, 'volumechange', sync, { signal });
  },
});
```

### Slice Type Inference

State types are fully inferred from the slice config:

```ts
import type { InferSliceState } from '@videojs/store';

const volumeSlice = defineSlice<HTMLMediaElement>()({
  state: () => ({ volume: 1, muted: false, /* actions */ }),
  // ...
});

// Infer types from the slice
type VolumeState = InferSliceState<typeof volumeSlice>;
// { volume: number; muted: boolean; setVolume: ...; toggleMuted: ... }
```

### Combining Slices

Use `combine` to merge multiple slices into one:

```ts
import { combine, createStore, defineSlice } from '@videojs/store';

const volumeSlice = defineSlice<HTMLMediaElement>()({ /* ... */ });
const playbackSlice = defineSlice<HTMLMediaElement>()({ /* ... */ });

// Combine into a single slice
const mediaSlice = combine(volumeSlice, playbackSlice);
const store = createStore<HTMLMediaElement>()(mediaSlice);
```

Behavior:
- State factories are called in order, results merged (last wins on conflict)
- All attach handlers run; errors are caught and reported via `reportError`
- Use `UnionSliceState<Slices>` for combined state type inference

```ts
import type { UnionSliceState } from '@videojs/store';

const slices = [volumeSlice, playbackSlice] as const;
type MediaState = UnionSliceState<typeof slices>;
```

### Actions

Actions modify the target. You can call `target()` to access the attached target.

```ts
state: ({ target }) => ({
  volume: 1,

  // Action
  setVolume(volume: number) {
    const media = target();
    media.volume = volume;
    return media.volume;
  },

  // Fire-and-forget
  logVolume() {
    console.log('Current volume:', target().volume);
  },
}),
```

## Store

The store connects a slice to a target.

```ts
// Simple
const store = createStore<HTMLMediaElement>()(volumeSlice);

// With combined slices and options
const store = createStore<HTMLMediaElement>()(
  combine(volumeSlice, playbackSlice),
  {
    onSetup: ({ store, signal }) => {
      // Called when store is created
    },

    onAttach: ({ store, target, signal }) => {
      // Called when target is attached
    },

    onError: ({ error, store }) => {
      // Global error handler
    },
  }
);
```

### Type Inference

```ts
import type { InferStoreState, InferStoreTarget } from '@videojs/store';

const store = createStore<HTMLMediaElement>()(volumeSlice);

type State = InferStoreState<typeof store>;
type Target = InferStoreTarget<typeof store>;
```

### Attaching a Target

```ts
const detach = store.attach(videoElement);

// State syncs from target (flat access)
const { paused, volume } = store;

// Actions go to target (flat access)
store.play();
store.setVolume(0.5);

// Detach when done
detach();
```

### Destroying a Store

Clean up when the store is no longer needed:

```ts
// Detaches target, aborts signals, cleans up
store.destroy();
```

### Subscribing to State

State is reactive—subscribe to be notified when any property changes:

```ts
const unsubscribe = store.subscribe(() => {
  const { volume } = store;
  console.log('State changed:', volume);
});
```

Mutations are auto-batched—multiple changes in the same tick trigger only one notification.

## Cancellation Signals

Use `signals` to manage cancellation for async operations. The store provides an `AbortControllerRegistry` instance that tracks the attach lifecycle and supports keyed cancellation for superseding work.

```ts
state: ({ target, signals }) => ({
  // Supersede pattern: new seek cancels previous seek
  async seek(time: number) {
    const signal = signals.supersede(signalKeys.seek);
    // ...
  },

  // Cancel all pending operations (e.g., when loading new source)
  loadSource(src: string) {
    signals.clear();
    // ...
  },
}),
```

**API:**

| Method | Description |
|--------|-------------|
| `signals.base` | Attach-scoped signal. Aborts on detach or reattach. |
| `signals.supersede(key)` | Returns signal that aborts when same key is superseded or base aborts. |
| `signals.clear()` | Aborts all keyed signals, leaving base intact. |

Define shared keys for cross-slice coordination:

```ts
export const signalKeys = {
  seek: Symbol.for('@videojs/seek'),
} as const;
```

## Error Handling

Handle errors locally via `try/catch`, or globally via `onError`. An action that throws or rejects always fails for its caller; when `onError` is set, it also receives that error once. Errors from `onSetup`, `onAttach`, or a slice's `attach` have no caller, so they go to `onError`, or to `console.error` without one.

```ts
import { isStoreError } from '@videojs/store';

// Global error handling
const store = createStore<HTMLMediaElement>()(volumeSlice, {
  onError: ({ error, store }) => {
    console.error('Store error:', error);
  },
});

// Local error handling
try {
  await store.play();
} catch (error) {
  if (isStoreError(error)) {
    switch (error.code) {
      case 'NO_TARGET':
        // No media element attached
        break;
      default:
        console.error(`[${error.code}]`, error.message);
    }
  }
}
```

All store errors include a `code` for programmatic handling:

| Code         | Description                  |
| ------------ | ---------------------------- |
| `DESTROYED`  | Store destroyed              |
| `NO_TARGET`  | No target attached           |

## State Primitives

The store uses explicit state containers internally. These primitives are internal too, and may change between releases:

```ts
import { createState, flush, isState } from '@videojs/store';

// Create state container
const state = createState({ volume: 1, muted: false });

// Read via .current
const { volume } = state.current; // 1

// Mutate via patch() - changes are auto-batched
state.patch({ volume: 0.5 });
state.patch({ volume: 0.5, muted: true });
// Only ONE notification fires (after microtask)

// Subscribe to changes
state.subscribe(() => {
  const { volume } = state.current;
  console.log('Changed:', volume);
});

// Optional abort signal for cleanup
const controller = new AbortController();
state.subscribe(() => {}, { signal: controller.signal });
controller.abort();

// Check if value is state
isState(state); // true

// Force immediate notification (mainly for tests)
flush();
```

## How It's Different

|                   | Redux/Zustand    | React Query           | @videojs/store             |
| ----------------- | ---------------- | --------------------- | -------------------------- |
| **Authority**     | You own state    | Server owns state     | External system owns state |
| **Mutations**     | Sync reducers    | Async server requests | Actions to target          |
| **State source**  | Internal store   | HTTP cache            | Synced from target         |
| **Subscriptions** | To store changes | To query cache        | To target events           |
| **Use case**      | App state        | Server data           | Media, WebSocket, hardware |

**Redux/Zustand**: Great for state you control. But when a `<video>` element is the source of truth, you end up fighting the pattern—syncing external state into the store, handling race conditions between your state and the element's actual state.

**React Query**: Perfect for server state with request/response. But media elements aren't request/response—they're live, event-driven systems with their own lifecycle.

**@videojs/store**: Built for external authority. The target is the source of truth. You observe it, request changes, and react to its events.

```ts
// Redux approach - fighting the abstraction
dispatch(play());
// Hope the video actually plays...
// Manually sync video.paused back to store...
// Handle race conditions...

// @videojs/store - working with the abstraction
store.play();                 // Actions call into the target
const { paused } = store;     // Always reflects video.paused
```

## Community

If you need help with anything related to Video.js 10, or if you'd like to casually chat with other
members:

- [Join Discord Server][discord]
- [See GitHub Discussions][gh-discussions]

## License

[Apache-2.0](../../LICENSE)

[package]: https://www.npmjs.com/package/@videojs/store
[package-badge]: https://img.shields.io/npm/v/@videojs/store?label=@videojs/store
[discord]: https://discord.gg/JBqHh485uF
[gh-discussions]: https://github.com/videojs/v10/discussions
