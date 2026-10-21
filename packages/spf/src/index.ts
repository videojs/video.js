/**
 * Stream Processing Framework (SPF) for Video.js 10
 *
 * The compositional primitives: createComposition, signals, tasks, actors, reactors. Media-domain helpers and the HLS
 * playback engines live behind the `./dom`, `./hls`, and per-engine `./hls/*` subpaths.
 *
 * @packageDocumentation
 */

export const VERSION = '0.1.0';

// =============================================================================
// Composition
// =============================================================================

export type {
  Behavior,
  BehaviorCleanup,
  BehaviorDeps,
  Composition,
  CompositionOptions,
  ContextSignals,
  InferBehaviorConfig,
  InferBehaviorContext,
  InferBehaviorState,
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
  StateSignals,
} from './core/composition/create-composition';
export { createComposition, defineBehavior, defineCompositionFactory } from './core/composition/create-composition';
export { defineExternalSignals } from './core/composition/define-external-signals';

// =============================================================================
// Signals
// =============================================================================

export { effect } from './core/signals/effect';
export type { Computed, ReadonlySignal, Signal, SignalOptions } from './core/signals/primitives';
export { computed, signal, snapshot, untrack, update } from './core/signals/primitives';

// =============================================================================
// Tasks
// =============================================================================

export type { TaskConfig, TaskLike, TaskStatus } from './core/tasks/task';
export { ConcurrentRunner, SerialRunner, Task } from './core/tasks/task';

// =============================================================================
// Machine (shared by actors and reactors)
// =============================================================================

export type { Machine, MachineSnapshot } from './core/machine';

// =============================================================================
// Actors
// =============================================================================

export type { ActorSnapshot, CallbackActor, SignalActor } from './core/actors/actor';
export type {
  ActorDefinition,
  ActorStateDefinition,
  HandlerContext,
  MessageActor,
  RunnerLike,
} from './core/actors/create-machine-actor';
export { createMachineActor } from './core/actors/create-machine-actor';
export type { TransitionActor } from './core/actors/create-transition-actor';
export { createTransitionActor } from './core/actors/create-transition-actor';

// =============================================================================
// Reactors
// =============================================================================

export type {
  Reactor,
  ReactorDefinition,
  ReactorDeriveFn,
  ReactorEffectFn,
  ReactorStateDefinition,
} from './core/reactors/create-machine-reactor';
export { createMachineReactor } from './core/reactors/create-machine-reactor';
