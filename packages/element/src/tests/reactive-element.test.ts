import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ReactiveElement } from '../reactive-element';
import type { PropertyValues, ReactiveController } from '../types';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<T extends HTMLElement>(ctor: { new (): T }): T {
  const tag = uniqueTag('test-el');

  if (!customElements.get(tag)) {
    customElements.define(tag, class extends (ctor as typeof HTMLElement) {} as typeof HTMLElement);
  }

  return document.createElement(tag) as T;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ReactiveElement', () => {
  it('extends HTMLElement', () => {
    const el = createElement(ReactiveElement);

    expect(el).toBeInstanceOf(HTMLElement);
  });

  it('runs willUpdate and update on first connect', async () => {
    const willUpdate = vi.fn();
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      protected override willUpdate(changed: PropertyValues) {
        super.willUpdate(changed);
        willUpdate(changed);
      }
      protected override update(changed: PropertyValues) {
        super.update(changed);
        update(changed);
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(willUpdate).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });

  it('does not run update before connect', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      protected override update() {
        update();
      }
    }

    createElement(TestElement);

    // Flush multiple microtasks — update should never fire without connect
    await new Promise((r) => setTimeout(r, 10));

    expect(update).not.toHaveBeenCalled();
  });
});

describe('ReactiveElement properties', () => {
  it('reflects string attribute to property', () => {
    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = 'default';
    }

    const el = createElement(TestElement);

    el.setAttribute('label', 'hello');
    expect(el.label).toBe('hello');
  });

  it('reflects boolean attribute to property', () => {
    class TestElement extends ReactiveElement {
      static override properties = {
        disabled: { type: Boolean },
      };
      disabled = false;
    }

    const el = createElement(TestElement);

    el.setAttribute('disabled', '');
    expect(el.disabled).toBe(true);

    el.removeAttribute('disabled');
    expect(el.disabled).toBe(false);
  });

  it('coerces number attribute to property', () => {
    class TestElement extends ReactiveElement {
      static override properties = {
        count: { type: Number },
      };
      count = 0;
    }

    const el = createElement(TestElement);

    el.setAttribute('count', '42');
    expect(el.count).toBe(42);
    expect(typeof el.count).toBe('number');

    el.setAttribute('count', '3.14');
    expect(el.count).toBe(3.14);

    el.setAttribute('count', 'not-a-number');
    expect(el.count).toBeNaN();
  });

  it('supports custom attribute names', () => {
    class TestElement extends ReactiveElement {
      static override properties = {
        negativeSign: { type: String, attribute: 'negative-sign' },
      };
      negativeSign = '-';
    }

    const el = createElement(TestElement);

    el.setAttribute('negative-sign', '\u2212');
    expect(el.negativeSign).toBe('\u2212');
  });

  it('triggers requestUpdate on property change', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = 'default';

      protected override update(changed: PropertyValues) {
        super.update(changed);
        update(changed);
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    update.mockClear();
    const previous = el.updateComplete;

    el.label = 'new';
    const completion = el.updateComplete;

    expect(completion).not.toBe(previous);
    expect(el.isUpdatePending).toBe(true);
    expect(await completion).toBe(true);
    expect(el.isUpdatePending).toBe(false);

    expect(update).toHaveBeenCalledOnce();
    const changed = update.mock.calls[0]![0] as PropertyValues;

    expect(changed.get('label')).toBe('default');
  });

  it('batches multiple property changes into single update', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
        disabled: { type: Boolean },
      };
      label = '';
      disabled = false;

      protected override update(changed: PropertyValues) {
        super.update(changed);
        update(changed);
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    update.mockClear();

    el.label = 'hello';
    el.disabled = true;
    await el.updateComplete;

    expect(update).toHaveBeenCalledOnce();
    const changed = update.mock.calls[0]![0] as PropertyValues;

    expect(changed.has('label')).toBe(true);
    expect(changed.has('disabled')).toBe(true);
  });

  it('preserves the first old value when batching changes to the same property', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = 'default';

      protected override update(changed: PropertyValues) {
        super.update(changed);
        update(changed);
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    update.mockClear();

    el.label = 'first';
    el.label = 'second';
    await el.updateComplete;

    expect(update).toHaveBeenCalledOnce();
    const changed = update.mock.calls[0]![0] as PropertyValues;

    expect(el.label).toBe('second');
    expect(changed.get('label')).toBe('default');
  });

  it('does not trigger update when value is unchanged', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = 'same';

      protected override update() {
        update();
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    update.mockClear();

    el.label = 'same';

    // Flush multiple microtasks — update should not fire
    await new Promise((r) => setTimeout(r, 10));

    expect(update).not.toHaveBeenCalled();
  });
});

describe('ReactiveElement controllers', () => {
  it('dispatches hostConnected on connect', () => {
    const controller: ReactiveController = {
      hostConnected: vi.fn(),
      hostDisconnected: vi.fn(),
    };

    const el = createElement(ReactiveElement);

    el.addController(controller);

    document.body.appendChild(el);
    expect(controller.hostConnected).toHaveBeenCalledOnce();
  });

  it('dispatches hostDisconnected on disconnect', () => {
    const controller: ReactiveController = {
      hostConnected: vi.fn(),
      hostDisconnected: vi.fn(),
    };

    const el = createElement(ReactiveElement);

    el.addController(controller);

    document.body.appendChild(el);
    el.remove();
    expect(controller.hostDisconnected).toHaveBeenCalledOnce();
  });

  it('dispatches hostConnected immediately if already connected', () => {
    const controller: ReactiveController = {
      hostConnected: vi.fn(),
    };

    const el = createElement(ReactiveElement);

    document.body.appendChild(el);

    el.addController(controller);
    expect(controller.hostConnected).toHaveBeenCalledOnce();
  });

  it('removes controller', () => {
    const controller: ReactiveController = {
      hostDisconnected: vi.fn(),
    };

    const el = createElement(ReactiveElement);

    el.addController(controller);
    el.removeController(controller);

    document.body.appendChild(el);
    el.remove();
    expect(controller.hostDisconnected).not.toHaveBeenCalled();
  });

  it('dispatches to multiple controllers', () => {
    const c1: ReactiveController = { hostConnected: vi.fn() };
    const c2: ReactiveController = { hostConnected: vi.fn() };

    const el = createElement(ReactiveElement);

    el.addController(c1);
    el.addController(c2);

    document.body.appendChild(el);
    expect(c1.hostConnected).toHaveBeenCalledOnce();
    expect(c2.hostConnected).toHaveBeenCalledOnce();
  });
});

describe('ReactiveElement lifecycle', () => {
  it('calls firstUpdated only once on first update', async () => {
    const firstUpdated = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = '';

      protected override firstUpdated(changed: PropertyValues) {
        firstUpdated(new Map(changed));
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(firstUpdated).toHaveBeenCalledOnce();

    // Second update should not call firstUpdated again
    firstUpdated.mockClear();
    el.label = 'new';
    await el.updateComplete;

    expect(firstUpdated).not.toHaveBeenCalled();
  });

  it('calls updated after every update', async () => {
    const updated = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = '';

      protected override updated(changed: PropertyValues) {
        updated(new Map(changed));
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(updated).toHaveBeenCalledOnce();

    // Should fire on subsequent updates too
    updated.mockClear();
    el.label = 'new';
    await el.updateComplete;

    expect(updated).toHaveBeenCalledOnce();
    const changed = updated.mock.calls[0]![0] as PropertyValues;

    expect(changed.get('label')).toBe('');
  });

  it('calls lifecycle methods in correct order (matches Lit)', async () => {
    const calls: string[] = [];

    const controller: ReactiveController = {
      hostUpdate: () => calls.push('hostUpdate'),
      hostUpdated: () => calls.push('hostUpdated'),
    };

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = '';

      constructor() {
        super();
        this.addController(controller);
      }

      protected override willUpdate(_changed: PropertyValues) {
        calls.push('willUpdate');
      }
      protected override update(_changed: PropertyValues) {
        calls.push('update');
      }
      protected override firstUpdated(_changed: PropertyValues) {
        calls.push('firstUpdated');
      }
      protected override updated(_changed: PropertyValues) {
        calls.push('updated');
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    // Lit order: willUpdate → hostUpdate → update → hostUpdated → firstUpdated → updated
    expect(calls).toEqual(['willUpdate', 'hostUpdate', 'update', 'hostUpdated', 'firstUpdated', 'updated']);

    // Second update — no firstUpdated
    calls.length = 0;
    el.label = 'new';
    await el.updateComplete;

    expect(calls).toEqual(['willUpdate', 'hostUpdate', 'update', 'hostUpdated', 'updated']);
  });

  it('sets hasUpdated to true after first update', async () => {
    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = '';
    }

    const el = createElement(TestElement);

    expect(el.hasUpdated).toBe(false);

    document.body.appendChild(el);
    expect(el.hasUpdated).toBe(false);

    await el.updateComplete;
    expect(el.hasUpdated).toBe(true);
  });

  it('hasUpdated is true inside firstUpdated and updated (matches Lit)', async () => {
    let hasUpdatedDuringFirstUpdated: boolean | undefined;
    let hasUpdatedDuringUpdated: boolean | undefined;

    class TestElement extends ReactiveElement {
      protected override firstUpdated(_changed: PropertyValues) {
        hasUpdatedDuringFirstUpdated = this.hasUpdated;
      }
      protected override updated(_changed: PropertyValues) {
        hasUpdatedDuringUpdated = this.hasUpdated;
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    // Matches Lit: hasUpdated is set before firstUpdated and updated
    expect(hasUpdatedDuringFirstUpdated).toBe(true);
    expect(hasUpdatedDuringUpdated).toBe(true);
    expect(el.hasUpdated).toBe(true);
  });
});

describe('ReactiveElement isUpdatePending', () => {
  it('is true after requestUpdate, false after update completes', async () => {
    const el = createElement(ReactiveElement);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.isUpdatePending).toBe(false);

    el.requestUpdate();
    expect(el.isUpdatePending).toBe(true);

    await el.updateComplete;
    expect(el.isUpdatePending).toBe(false);
  });

  it('is true during update cycle', async () => {
    let pendingDuringUpdate: boolean | undefined;
    let pendingDuringUpdated: boolean | undefined;

    class TestElement extends ReactiveElement {
      protected override update(_changed: PropertyValues) {
        pendingDuringUpdate = this.isUpdatePending;
      }
      protected override updated(_changed: PropertyValues) {
        pendingDuringUpdated = this.isUpdatePending;
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;

    // isUpdatePending is true during update, false during updated
    // (matches Lit: __markUpdated runs after update, before _$didUpdate)
    expect(pendingDuringUpdate).toBe(true);
    expect(pendingDuringUpdated).toBe(false);
  });
});

describe('ReactiveElement performUpdate', () => {
  it('flushes a pending update synchronously', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = '';

      override performUpdate() {
        super.performUpdate();
      }

      protected override update(changed: PropertyValues) {
        super.update(changed);
        update(changed);
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;
    update.mockClear();

    el.label = 'sync';
    expect(el.isUpdatePending).toBe(true);

    // Flush synchronously
    el.performUpdate();
    expect(update).toHaveBeenCalledOnce();
    expect(el.isUpdatePending).toBe(false);
  });

  it('is a no-op when no update is pending', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      override performUpdate() {
        super.performUpdate();
      }

      protected override update() {
        update();
      }
    }

    const el = createElement(TestElement);

    document.body.appendChild(el);
    await el.updateComplete;
    update.mockClear();

    el.performUpdate();
    expect(update).not.toHaveBeenCalled();
  });
});

describe('ReactiveElement updateComplete', () => {
  it('resolves after first update when connected', async () => {
    const el = createElement(ReactiveElement);

    document.body.appendChild(el);

    const result = await el.updateComplete;

    expect(result).toBe(true);
    expect(el.hasUpdated).toBe(true);
  });
});

describe('ReactiveElement property inheritance', () => {
  it('inherits properties from parent class', () => {
    class Base extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = '';
    }

    class Child extends Base {
      static override properties = {
        ...Base.properties,
        disabled: { type: Boolean },
      };
      disabled = false;
    }

    const el = createElement(Child);

    el.setAttribute('label', 'test');
    expect(el.label).toBe('test');

    el.setAttribute('disabled', '');
    expect(el.disabled).toBe(true);
  });
});

describe('ReactiveElement upgrade', () => {
  it('restores own properties before connected lifecycle consumers run', async () => {
    let connectedLabel: string | undefined;
    let controllerLabel: string | undefined;

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = 'default';

      constructor() {
        super();
        this.addController({
          hostConnected: () => (controllerLabel = this.label),
        });
      }

      override connectedCallback() {
        super.connectedCallback();
        connectedLabel = this.label;
      }
    }

    const tag = uniqueTag('connect-lifecycle-el');

    customElements.define(tag, TestElement);

    // SAFETY: The tag was registered with TestElement immediately above.
    const el = document.createElement(tag) as TestElement;

    Object.defineProperty(el, 'label', {
      value: 'pre-connect',
      writable: true,
      configurable: true,
      enumerable: true,
    });
    document.body.appendChild(el);

    await vi.waitFor(() => expect(connectedLabel).toBe('pre-connect'));
    expect(controllerLabel).toBe('pre-connect');
  });

  it('does not overwrite properties set after connection but before the first update', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      label = 'default';

      protected override update(changed: PropertyValues) {
        super.update(changed);
        update(this.label);
      }
    }

    const tag = uniqueTag('connect-el');

    customElements.define(tag, TestElement);

    // SAFETY: The tag was registered with TestElement immediately above.
    const el = document.createElement(tag) as TestElement;

    document.body.appendChild(el);
    el.label = 'newer';
    await el.updateComplete;

    expect(el.label).toBe('newer');
    expect(update).toHaveBeenLastCalledWith('newer');

    update.mockClear();
    el.label = 'later';
    await el.updateComplete;

    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith('later');
  });

  it('activates reactive accessors shadowed by native class fields', async () => {
    const update = vi.fn();

    class TestElement extends ReactiveElement {
      static override properties = {
        label: { type: String },
      };
      declare label: string;

      constructor() {
        super();

        // Native class fields use DefineField semantics rather than invoking a prototype setter.
        Object.defineProperty(this, 'label', {
          value: 'default',
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      protected override update() {
        update(this.label);
      }
    }

    const tag = uniqueTag('upgrade-class-field-el');

    customElements.define(tag, TestElement);

    // SAFETY: The tag was registered with TestElement immediately above.
    const el = document.createElement(tag) as TestElement;

    document.body.appendChild(el);
    await el.updateComplete;

    expect(Object.hasOwn(el, 'label')).toBe(false);
    expect(el.label).toBe('default');

    update.mockClear();
    el.label = 'changed';
    await el.updateComplete;

    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith('changed');
  });
});
