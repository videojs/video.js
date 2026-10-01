import type { ReactiveController } from '@videojs/element';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { DestroyMixin } from '../destroy-mixin';
import { ReactiveElement } from '../reactive-element';

const DestroyableElement = DestroyMixin(ReactiveElement);

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<T extends HTMLElement>(ctor: abstract new () => T): T {
  const tag = uniqueTag('test-destroy');

  customElements.define(tag, class extends (ctor as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as T;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// destroy()
// ---------------------------------------------------------------------------

describe('DestroyMixin', () => {
  it('destroyed is false by default', () => {
    const el = createElement(DestroyableElement);

    expect(el.destroyed).toBe(false);
  });

  it('destroy() sets destroyed to true', () => {
    const el = createElement(DestroyableElement);

    el.destroy();
    expect(el.destroyed).toBe(true);
  });

  it('destroy() is idempotent', () => {
    const destroyCallback = vi.fn();

    class TestElement extends DestroyableElement {
      override destroyCallback(): void {
        destroyCallback();
        super.destroyCallback();
      }
    }

    const el = createElement(TestElement);

    el.destroy();
    el.destroy();

    expect(destroyCallback).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Deferred destruction (2 rAF)
// ---------------------------------------------------------------------------

describe('DestroyMixin deferred destruction', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('destroys after 2 animation frames when disconnected', () => {
    const el = createElement(DestroyableElement);

    document.body.appendChild(el);
    el.remove();

    // After first rAF — not yet destroyed.
    vi.advanceTimersByTime(16);
    expect(el.destroyed).toBe(false);

    // After second rAF — destroyed.
    vi.advanceTimersByTime(16);
    expect(el.destroyed).toBe(true);
  });

  it('cancels destruction when reconnected before 2 rAFs', () => {
    const el = createElement(DestroyableElement);

    document.body.appendChild(el);
    el.remove();
    vi.advanceTimersByTime(16); // 1 rAF

    // Reconnect before second rAF fires.
    document.body.appendChild(el);

    vi.advanceTimersByTime(16); // 2nd rAF — but cancelled by reconnect
    expect(el.destroyed).toBe(false);
  });

  it('keep-alive attribute prevents deferred destruction', () => {
    const el = createElement(DestroyableElement);

    el.setAttribute('keep-alive', '');

    document.body.appendChild(el);
    el.remove();

    vi.advanceTimersByTime(100);
    expect(el.destroyed).toBe(false);
  });

  it('manual destroy() works even with keep-alive', () => {
    const el = createElement(DestroyableElement);

    el.setAttribute('keep-alive', '');

    document.body.appendChild(el);
    el.destroy();
    expect(el.destroyed).toBe(true);
  });

  it('calls destroyCallback when deferred destruction fires', () => {
    const destroyCallback = vi.fn();

    class TestElement extends DestroyableElement {
      override destroyCallback(): void {
        destroyCallback();
        super.destroyCallback();
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    el.remove();
    vi.advanceTimersByTime(32);

    expect(destroyCallback).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Controller tracking & performUpdate guard
// ---------------------------------------------------------------------------

describe('DestroyMixin controller lifecycle', () => {
  it('hostDestroyed() is called on controllers', () => {
    const hostDestroyed = vi.fn();
    const controller: ReactiveController = { hostDestroyed };

    const el = createElement(DestroyableElement);

    el.addController(controller);
    el.destroy();

    expect(hostDestroyed).toHaveBeenCalledOnce();
  });

  it('connectedCallback no-ops after destroy', async () => {
    const el = createElement(DestroyableElement);

    document.body.appendChild(el);
    await el.updateComplete;

    el.destroy();
    el.remove();

    // Re-insert — should not re-initialize.
    const hostConnected = vi.fn();
    const controller: ReactiveController = { hostConnected };

    el.addController(controller);

    document.body.appendChild(el);

    expect(hostConnected).not.toHaveBeenCalled();
  });

  it('performUpdate no-ops after destroy', async () => {
    class TestElement extends DestroyableElement {
      updateRan = false;

      protected override update(changed: Map<string, unknown>): void {
        super.update(changed);
        this.updateRan = true;
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    el.updateRan = false;
    el.destroy();
    el.requestUpdate();

    // Flush microtasks.
    await new Promise((r) => setTimeout(r, 0));

    expect(el.updateRan).toBe(false);
  });
});
