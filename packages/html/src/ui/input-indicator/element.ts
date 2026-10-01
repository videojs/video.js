import {
  getRenderedIndicatorState,
  type IndicatorLifecycleState,
  type IndicatorVisibilityHandle,
  type InputActionEvent,
  isIndicatorPresent,
  type MediaSnapshot,
} from '@videojs/core';
import {
  getIndicatorVisibilityCoordinator,
  getMediaSnapshot,
  subscribeToInputActions,
  type TransitionApi,
} from '@videojs/core/dom';
import type { PropertyValues } from '@videojs/element';
import { ContextConsumer } from '@videojs/element/context';
import type { State as StoreState } from '@videojs/store';

import { containerContext, playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { UIElement } from '../ui-element';
import type { LiveIndicator } from './live-indicator';

/** Shared imperative API for status / volume / seek indicator cores. */
export interface InputIndicatorCoreApi<IndicatorState extends IndicatorLifecycleState> {
  readonly state: StoreState<IndicatorState>;
  destroy(): void;
  close(): void;
  processEvent(event: InputActionEvent, snapshot: MediaSnapshot): boolean;
}

export interface InputIndicatorOptions {
  replayOnUpdate?: boolean | undefined;
}

export abstract class InputIndicatorElement<IndicatorState extends IndicatorLifecycleState> extends UIElement {
  protected abstract get core(): InputIndicatorCoreApi<IndicatorState>;
  /** @internal */
  protected abstract get transition(): TransitionApi;
  protected abstract get liveIndicator(): LiveIndicator<IndicatorState>;
  protected get options(): InputIndicatorOptions {
    return {};
  }

  protected abstract syncCoreProps(): void;

  protected readonly player = new PlayerController(this, playerContext);
  /** @internal */
  protected readonly container = new ContextConsumer(this, {
    context: containerContext,
    callback: () => this.#reconnect(),
    subscribe: true,
  });

  #disconnect: AbortController | null = null;
  #inputActionUnsubscribe: (() => void) | null = null;
  #visibilityUnsubscribe: (() => void) | null = null;
  #visibilityHandle: IndicatorVisibilityHandle | null = null;
  #lastGeneration = 0;
  #snapshot: IndicatorState | null = null;

  #getVisibilityHandle(): IndicatorVisibilityHandle {
    return (this.#visibilityHandle ??= { close: () => this.core.close() });
  }

  #payloadSnapshot(): IndicatorState {
    return this.#snapshot ?? this.core.state.current;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.#snapshot = this.core.state.current;

    this.#disconnect = new AbortController();
    this.core.state.subscribe(() => this.requestUpdate(), { signal: this.#disconnect.signal });
    this.transition.state.subscribe(() => this.requestUpdate(), { signal: this.#disconnect.signal });
    this.hidden = true;
    this.#reconnect();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#inputActionUnsubscribe?.();
    this.#visibilityUnsubscribe?.();
    this.#inputActionUnsubscribe = null;
    this.#visibilityUnsubscribe = null;
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  override destroyCallback(): void {
    this.#inputActionUnsubscribe?.();
    this.#visibilityUnsubscribe?.();
    this.core.destroy();
    this.transition.destroy();
    this.liveIndicator.remove();
    super.destroyCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.syncCoreProps();
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);
    this.#syncTransition();

    const currentState = this.core.state.current;
    const transitionState = this.transition.state.current;
    const present = isIndicatorPresent(currentState, transitionState);

    if (!present) {
      this.liveIndicator.remove();
      return;
    }

    const state = getRenderedIndicatorState(currentState, this.#payloadSnapshot(), transitionState);

    this.liveIndicator.render(state);
  }

  #syncTransition(): void {
    const currentState = this.core.state.current;

    if (currentState.open) {
      this.#snapshot = currentState;

      if (this.#lastGeneration !== currentState.generation) {
        this.#lastGeneration = currentState.generation;
        const transitionState = this.transition.state.current;

        if (!transitionState.active || this.options.replayOnUpdate !== false) {
          void this.transition.open(this.liveIndicator.element);
        } else if (transitionState.status === 'ending') {
          this.transition.cancel();
        }
      }

      return;
    }

    const { active, status } = this.transition.state.current;

    if (active && status !== 'ending') {
      void this.transition.close(this.liveIndicator.element);
    }
  }

  #reconnect(): void {
    // Context can resolve before this field assignment completes.
    if (!this.container) return;

    this.#inputActionUnsubscribe?.();
    this.#visibilityUnsubscribe?.();
    this.#inputActionUnsubscribe = null;
    this.#visibilityUnsubscribe = null;

    const container = this.container.value?.container;
    if (!container) return;

    const visibility = getIndicatorVisibilityCoordinator(container);
    const visibilityHandle = this.#getVisibilityHandle();

    this.#visibilityUnsubscribe = visibility.register(visibilityHandle);

    this.#inputActionUnsubscribe = subscribeToInputActions(container, (event) => {
      if (this.core.processEvent(event, getMediaSnapshot(this.player.value))) {
        visibility.show(visibilityHandle);
      }
    });
  }
}
