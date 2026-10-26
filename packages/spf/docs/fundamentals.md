# SPF fundamentals

SPF builds long-lived systems from small behaviors connected by signals. Features group the behaviors that give an engine one ability, and an engine composes features. The framework supplies composition, lifecycle, and work primitives; a domain supplies the behaviors, features, and engine adapter.

Source and tests define exact types and runtime behavior. This guide explains the mental model. The [API reference](./reference/README.md) lists every engine, feature, and behavior with the config, state, and context keys each one reads and writes.

## Behaviors and compositions

A behavior declares the state and context keys it participates in and installs one concern. Its setup may return cleanup or an object with `destroy()`.

`createComposition()` manages the behaviors as one lifecycle. It does these four things:

1. creates one signal for every declared key;
2. supplies the shared state, context, and immutable configuration to each behavior;
3. retains every cleanup handle;
4. destroys all behaviors and clears the signal maps together.

Type inference intersects the requirements of the behavior tuple. Incompatible state, context, or configuration types fail at the composition call.

Use `defineBehavior()` for ordinary source behaviors. It verifies that runtime key declarations match the typed setup slices.

## Features and engines

A feature is a group of behaviors that together give an engine one ability, such as playing video, handling DRM, or following a live stream. It also carries the config defaults and initial state those behaviors need. Use `defineFeature()` to declare one. SPF features live inside an engine and are unrelated to the player's store features.

A feature can depend on another feature's writes. For example, the video feature loads nothing until some feature writes `context.mediaSource`. Each feature's reference page lists what it requires from other features.

An engine is an ordered list of features. `flattenFeatures()` concatenates their behaviors in feature order and merges their `defaultConfig` and `initialState` values. A later feature's value replaces an earlier one's.

`defineCompositionFactory()` turns that behavior list and its defaults into an engine's `createEngine()`. A default fills any config key the caller leaves out or passes as `undefined`, and the key becomes optional in the engine's config type.

## State, context, and configuration

- **State** contains reactive engine facts and consumer intent.
- **Context** contains owned resources, platform objects, and actor references.
- **Configuration** contains immutable tuning and replaceable strategies supplied by the engine variant.

Each behavior expresses key access with `Signal<T>` for values it writes and `ReadonlySignal<T>` for values it only consumes. This is a local ownership contract over shared signal identities.

Initial state or context materializes values that no behavior naturally seeds. Features contribute initial state, and an engine merges it. State and context written from outside the composition that no behavior declares are its external signals, declared with `defineExternalSignals()`.

## Signals

Use signals for state over time:

- `signal()` owns a writable value;
- `computed()` derives a value from tracked reads;
- `effect()` connects reactive state to work and returns cleanup;
- `untrack()` or `peek()` reads context without adding a dependency;
- `update()` replaces structured state through an updater.

Effects are appropriate for direct synchronization. When tracked inputs derive meaningful lifecycle states with different setup or cleanup, use a reactor.

## Tasks and runners

A task is one cancellable asynchronous operation with inspectable status, value, and error. It starts only when run or scheduled.

Runners own scheduling:

- `SerialRunner` executes tasks in submission order when work cannot overlap.
- `ConcurrentRunner` runs independent tasks and deduplicates by task ID.

Tasks are internal work units. A behavior or actor owns their runner and destroys it with the surrounding lifecycle.

## Actors

Actors receive discrete messages and own resources or queues.

- A callback actor is the lightest fire-and-forget shape.
- A transition actor reduces messages into observable context.
- A machine actor uses explicit states, per-state handlers, optional runners, settling transitions, and destruction.

Use actor snapshots for observation, not as another mutation channel. The creator owns actor destruction.

## Reactors

Reactors observe signals and derive finite lifecycle state. Their monitor chooses the active state; each state may provide:

- `entry` work that runs once and is automatically untracked;
- reactive `effects` that rerun with dependencies;
- cleanup that runs before rerun, on state exit, and on destruction.

Reactors do not own a message channel. They commonly translate shared engine state into messages for an actor that owns the resource.

## External adapters

An engine adapter should not depend on internal behavior instances. It drives input and observes output through the engine's `state` and `context` signals, which are the same signals every behavior receives, so an HTML, React, or other platform adapter needs nothing else.

The adapter owns platform semantics such as attachment, play activation, and property synchronization. The engine owns streaming behavior and cleanup.

## Design constraints

- Prefer one writer per resolved state key; represent external intent separately from automatic policy.
- Put browser APIs behind explicit DOM boundaries.
- Abort source-bound work and release owned resources on source replacement.
- Use the smallest primitive matching the work.
- Treat source, tests, and public entry points as the contract.

## Current sources

- API reference: [`packages/spf/docs/reference/`](./reference/README.md), generated from the source JSDoc
- Public primitives: `packages/spf/src/index.ts`
- Composition, including features: `packages/spf/src/core/composition/`
- Signals, tasks, actors, and reactors: corresponding directories under `packages/spf/src/core/`
- Tests: colocated `tests/` directories
- Internal rationale and conventions: `internal/design/spf/`
