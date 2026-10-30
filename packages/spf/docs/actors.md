# Actors

<!--
AI first draft (2026-10-23), for Christian to rewrite. Verified against core/actors/*, src/index.ts
exports, internal/design/spf/conventions/actors.md, playback/actors/dom/source-buffer.ts,
behaviors/dom/setup-buffer-actors.ts, behaviors/dom/load-segments.ts, and behaviors/dom/end-of-stream.ts.
Snippets are trimmed from those files.
-->

Some work can't overlap. Appends to a `SourceBuffer` have to run one at a time, in order, and a new request can arrive while an old one is still running. An actor owns that kind of resource and handles requests to it as discrete messages.

## What an actor is

An actor receives typed messages through `send()`. It owns a resource or a queue, and it decides what each message means given what it is doing right now. When the work is done, `destroy()` releases what the actor owns.

Use an actor when the input is a decision, like "append these bytes" or "load this range." When the input is a value that changes over time, a [reactor](./reactors.md) or an effect fits better.

## Three shapes

`@videojs/spf` exports two actor factories and one actor type:

- **`createMachineActor()`** builds an actor with named states, a handler per message type in each state, and an optional runner for async work. Use it when the actor's state decides what a message does.
- **`createTransitionActor()`** builds an actor from a reducer: `(context, message) => context`. Use it for bookkeeping, where the actor's job is to keep some data current.
- **`CallbackActor`** is a type with only `send()` and `destroy()`. There is no factory for it. Use it for fire-and-forget work that nobody needs to observe.

## A real actor

`SourceBufferActor` wraps one `SourceBuffer`. It is a machine actor with two states and a `SerialRunner`, so appends never overlap:

```ts
// packages/spf/src/playback/actors/dom/source-buffer.ts (trimmed)
return createMachineActor({
  runner: () => new SerialRunner(),
  initial: 'idle',
  context: { segments: [], bufferedRanges: [], initTrackId: undefined },
  states: {
    idle: {
      on: {
        'append-init': onMessage,
        'append-segment': onMessage,
        remove: onMessage,
      },
    },
    updating: {
      onSettled: 'idle',
      on: {
        cancel: (_, { runner }) => runner.abortAll(),
      },
    },
  },
});
```

An append message moves the actor to `updating` and schedules a task on the runner. When every scheduled task settles, `onSettled` returns the actor to `idle`. In `updating`, the only message it handles is `cancel`. Messages a state has no handler for are dropped.

## Snapshots

Every actor built by a factory exposes a `snapshot` signal. The snapshot holds the actor's state as `value` and its data as `context`. Other code reads the snapshot to observe the actor and sends messages to change it.

The `endOfStream` behavior reads buffer actors this way. It waits until each actor is `idle` and its appended segments include the track's last segment:

```ts
// packages/spf/src/playback/behaviors/dom/end-of-stream.ts (trimmed)
const snapshot = actor.snapshot.get();
if (snapshot.value !== 'idle') return 'preconditions-unmet';

const { initTrackId, segments: appended } = snapshot.context;
```

Because the snapshot is a signal, reading it inside a reactor or effect reruns that code when the actor changes.

## Behaviors and actors

Behaviors create actors and talk to them through context. One behavior creates an actor and publishes it to a context key. Other behaviors read that key and send messages.

`setupVideoBufferActors` creates the video `SourceBufferActor` and the `SegmentLoaderActor` that feeds it, then publishes both:

```ts
// packages/spf/src/playback/behaviors/dom/setup-buffer-actors.ts (trimmed)
const bufferActor = createSourceBufferActor(buffer);
const segmentLoader = createSegmentLoaderActor(bufferActor, fetch, { forwardBuffer, backBuffer, messagePipelines }, { state, context, config });

context[actorKey].set(bufferActor);
context[loaderKey].set(segmentLoader);
```

`loadVideoSegments` reads the loader from context and sends it a message:

```ts
// packages/spf/src/playback/behaviors/dom/load-segments.ts (trimmed)
const loader = context[loaderKey].get();
if (!track || !loader) return;

loader.send({ type: 'load', track });
```

The behavior that creates an actor also destroys it. Here, the cleanup destroys the loader first, so in-flight appends abort before the buffer actor tears down, and then clears both context keys. See the [setupBufferActors](./reference/behaviors/dom/setup-buffer-actors.md) and [loadSegments](./reference/behaviors/dom/load-segments.md) reference pages.

## Next

Read about [reactors](./reactors.md): the shape that turns changing state into those messages.
