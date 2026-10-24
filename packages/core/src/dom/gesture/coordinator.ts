import { isInteractiveTarget, listen } from '@videojs/utils/dom';

import { isInteractionLocked } from '../ui/interaction-lock';
import { getGestureActionValue } from './action-value';
import type {
  GestureActivateEvent,
  GestureBinding,
  GestureMatchResult,
  GestureRecognizer,
  GestureRegion,
  GestureType,
} from './gesture';
import { resolveRegion } from './region';

const TAP_THRESHOLD = 250;

/** @internal */
export class GestureCoordinator {
  #target: HTMLElement;
  #bindings: GestureBinding[] = [];
  #recognizers = new Set<GestureRecognizer>();
  #disconnect: AbortController | null = null;
  #subscribers = new Set<(event: GestureActivateEvent) => void>();

  constructor(target: HTMLElement) {
    this.#target = target;
  }

  get bindings(): readonly GestureBinding[] {
    return this.#bindings;
  }

  subscribe(callback: (event: GestureActivateEvent) => void): () => void {
    this.#subscribers.add(callback);
    return () => this.#subscribers.delete(callback);
  }

  /**
   * Whether a registered binding claims this tap for the given action. A claimed tap belongs to the gesture layer, so
   * callers should leave it alone. Taps on interactive targets (buttons, sliders) are never claimed — the same
   * filtering the pointerup listener applies. A disabled binding still claims: disabling a gesture opts out of the
   * action, it doesn't hand the tap back to a fallback handler.
   */
  claimsTap(event: PointerEvent, action: string): boolean {
    if (isInteractionLocked(this.#target)) return true;

    if (isInteractiveTarget(event)) return false;

    return this.#bindings.some(
      (b) => b.type === 'tap' && b.action === action && (!b.pointer || b.pointer === event.pointerType)
    );
  }

  add(binding: GestureBinding): () => void {
    const value = getGestureActionValue(binding.action ?? '', binding.region, binding.value);
    const wrapped: GestureBinding = {
      ...binding,
      value,
      onActivate: (event) => {
        if (this.#subscribers.size > 0) {
          const activateEvent: GestureActivateEvent = {
            type: binding.type,
            source: 'gesture',
            action: binding.action,
            value,
            region: binding.region,
            pointer: binding.pointer,
            event,
          };

          for (const cb of this.#subscribers) {
            try {
              cb(activateEvent);
            } catch (error) {
              if (__DEV__) console.warn('[vjs-gesture] subscribe callback threw:', error);
            }
          }
        }

        binding.onActivate(event);
      },
    };

    this.#bindings.push(wrapped);
    this.#recognizers.add(wrapped.recognizer);
    this.#connect();

    let removed = false;

    return () => {
      if (removed) return;

      removed = true;

      const idx = this.#bindings.indexOf(wrapped);

      if (idx !== -1) this.#bindings.splice(idx, 1);

      this.#maybeDisconnect();
    };
  }

  // --- Private ---

  #connect(): void {
    if (this.#disconnect) return;

    this.#disconnect = new AbortController();
    const { signal } = this.#disconnect;

    let pointerDownTime = 0;

    listen(
      this.#target,
      'pointerdown',
      (event) => {
        if (isInteractionLocked(this.#target)) {
          pointerDownTime = 0;
          return;
        }

        if (event.button !== 0) return;

        pointerDownTime = Date.now();
      },
      { signal }
    );

    listen(
      this.#target,
      'pointerup',
      (event) => {
        if (isInteractionLocked(this.#target)) {
          pointerDownTime = 0;
          return;
        }

        if (event.button !== 0) return;

        if (Date.now() - pointerDownTime > TAP_THRESHOLD) return;

        if (isInteractiveTarget(event)) return;

        const pointerType = event.pointerType;
        const clientX = event.clientX;
        const target = this.#target;
        const bindings = this.#bindings;

        const matches: GestureMatchResult = {
          resolve: (type) => matchBindings(bindings, type, pointerType, clientX, target),
        };

        for (const recognizer of this.#recognizers) {
          recognizer.handleUp(matches, event);
        }
      },
      { signal }
    );
  }

  #maybeDisconnect(): void {
    if (this.#bindings.length > 0) return;

    for (const recognizer of this.#recognizers) {
      recognizer.reset();
    }

    this.#recognizers.clear();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }
}

const coordinators = new WeakMap<HTMLElement, GestureCoordinator>();

/**
 * Look up the gesture coordinator for a target element, if one exists.
 *
 * @internal
 */
export function findGestureCoordinator(target: HTMLElement): GestureCoordinator | undefined {
  return coordinators.get(target);
}

/** @internal */
export function getGestureCoordinator(target: HTMLElement): GestureCoordinator {
  let coordinator = coordinators.get(target);

  if (!coordinator) {
    coordinator = new GestureCoordinator(target);
    coordinators.set(target, coordinator);
  }

  return coordinator;
}

// --- Matching ---

function matchBindings(
  bindings: GestureBinding[],
  type: GestureType,
  pointerType: string,
  clientX: number,
  target: HTMLElement
): GestureBinding[] {
  const rect = target.getBoundingClientRect();
  const activeRegions = getActiveRegions(bindings, type, pointerType);
  const region = activeRegions.size > 0 ? resolveRegion(clientX, rect, activeRegions) : null;

  const matches: GestureBinding[] = [];

  for (const binding of bindings) {
    if (binding.disabled) continue;

    if (binding.type !== type) continue;

    if (binding.pointer && binding.pointer !== pointerType) continue;

    if (binding.region) {
      if (binding.region !== region) continue;
    } else if (region !== null) {
      continue;
    }

    matches.push(binding);
  }

  return matches;
}

function getActiveRegions(bindings: GestureBinding[], type: GestureType, pointerType: string): Set<GestureRegion> {
  const regions = new Set<GestureRegion>();

  for (const binding of bindings) {
    if (binding.disabled) continue;

    if (binding.type !== type) continue;

    if (binding.pointer && binding.pointer !== pointerType) continue;

    if (binding.region) regions.add(binding.region);
  }

  return regions;
}
