# Tasks and runners

<!--
AI first draft (2026-10-23), for Christian to rewrite. Verified against packages/spf/src/core/tasks/task.ts
(Task, SerialRunner, ConcurrentRunner, RecurringRunner, runOnce), core/tasks/delayed-reschedule.ts, the package
root exports (Task, SerialRunner, ConcurrentRunner; RecurringRunner is internal), and the example in
packages/spf/src/playback/behaviors/resolve-track.ts. Usage claims: SourceBufferActor and the text-track segment
loader use SerialRunner; resolve-track and setup-media-keys use RecurringRunner; nothing in playback uses
ConcurrentRunner today.
-->

Playback is full of async work: fetching playlists, fetching segments, appending bytes to a `SourceBuffer`. That work has to stop when the source changes, and some of it must never overlap. A task wraps one piece of async work so it can be cancelled and inspected. A runner decides when tasks run.

## Tasks

A `Task` wraps an async function. The function receives an `AbortSignal`, and calling `abort()` on the task fires it. Pass the signal to `fetch()` and anything else that accepts one, and aborting the task cancels the request.

```ts
const task = new Task(async (signal) => {
  const response = await fetch(url, { signal });
  return response.text();
});
```

A task does nothing until something runs it. `run()` starts the work and returns a promise. Calling `run()` again returns the same promise, so a task runs its work at most once. To run the same work again, take a `clone()`: a fresh task with the same function and id.

A task also reports its progress. `status` is `'pending'`, `'running'`, `'done'`, or `'error'`, and `value` or `error` holds the result. `value` is always set before `status` becomes `'done'`.

## Runners

A runner takes tasks through `schedule()` and decides when each one runs. SPF has three:

- **`SerialRunner`** runs tasks one at a time, in the order they were scheduled. `SourceBufferActor` uses one, because a `SourceBuffer` accepts only one append at a time.
- **`ConcurrentRunner`** runs tasks at the same time and drops a task whose id is already in flight.
- **`RecurringRunner`** runs a task, then runs a fresh clone of it whenever its reschedule function says to. Scheduling a task with a different id aborts the current one and takes over.

Every runner has `abortAll()`, which aborts the tasks it holds, and `destroy()`, which also stops it from accepting more. The package exports `Task`, `SerialRunner`, and `ConcurrentRunner`. `RecurringRunner` is internal to SPF for now.

## An example: resolving a track

The `resolveVideoTrack` and `resolveAudioTrack` behaviors fetch the selected track's media playlist and parse it. Both are built on one setup function in `packages/spf/src/playback/behaviors/resolve-track.ts`. Trimmed, it looks like this:

```ts
// packages/spf/src/playback/behaviors/resolve-track.ts (trimmed)
const runner = new RecurringRunner<ResolvedTrack>(reschedule ?? runOnce);

return createMachineReactor({
  initial: 'presentation-unresolved',
  monitor: () => derivedStateSignal.get(),
  states: {
    'presentation-unresolved': {},
    'presentation-resolved': {
      entry: () => () => runner.abortAll(),
      effects: [
        () => {
          const trackId = state[selectedKey].get();
          const track = findTrackToResolve(presentation, trackId);
          // …
          runner.schedule(
            new Task(
              async (signal) => {
                const text = await fetchResolvableText(current, { signal });
                // …parse the playlist and write it into state.presentation
              },
              { id: track.id }
            )
          );
        },
      ],
    },
  },
});
```

Three things in this code connect tasks to the rest of the behavior:

- **The task id is the selected track's id.** Selecting a different track schedules a task with a different id, so the runner aborts the old fetch and starts the new one.
- **Leaving the state aborts the work.** The function `entry` returns runs when the reactor leaves `'presentation-resolved'`, as it does when the source changes. It calls `runner.abortAll()`, which fires every task's signal and cancels the fetch.
- **Config decides whether the task repeats.** For on-demand content, `reschedule` is absent and `runOnce` runs the task once. For live content, the live feature supplies a `reschedule` built with `delayedReschedule()`, and the runner reloads the playlist on a timer.

## Who owns a runner

A behavior or actor creates its runner and destroys it with its own cleanup. Runners aren't shared through state or context. The [reactors](./reactors.md) page covers `createMachineReactor` and its `entry` cleanup in more detail.

## Next

Some async work centers on one resource that has to process requests in order, such as a `SourceBuffer`. Read about [actors](./actors.md) next.
