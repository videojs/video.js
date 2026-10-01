import type { PropertyDeclaration, PropertyDeclarationMap, PropertyValues, ReactiveController } from './types';

interface ResolvedMeta {
  props: Map<string, PropertyDeclaration>;
  attrToProp: Map<string, string>;
}

const cache = new WeakMap<typeof ReactiveElement, ResolvedMeta>();
const propertyKeys = new Map<string, symbol>();
const HTMLElementBase = globalThis.HTMLElement ?? class {};

/**
 * Lightweight reactive custom element base class.
 *
 * Drop-in subset of Lit's `ReactiveElement` — supports `static properties`, attribute-to-property conversion, batched
 * async updates, and reactive controllers. No Shadow DOM, no `static styles`, no decorators.
 *
 * Updates are batched using the same Promise-based scheduling as Lit: property changes enqueue a microtask, and the
 * update is gated behind `connectedCallback` so the first update only runs once the element is in the document.
 *
 * Subclasses that extend another element with properties must spread them:
 *
 * @example
 *   ```ts
 *   class MyButton extends ReactiveElement {
 *     static override properties = {
 *       label: { type: String },
 *       disabled: { type: Boolean },
 *     };
 *
 *     label = 'Click me';
 *     disabled = false;
 *
 *     protected override update(changed: PropertyValues): void {
 *       super.update(changed);
 *       this.textContent = this.label;
 *     }
 *   }
 *
 *   // Inheritance — spread parent properties
 *   class FancyButton extends MyButton {
 *     static override properties = {
 *       ...MyButton.properties,
 *       variant: { type: String },
 *     };
 *
 *     variant = 'primary';
 *   }
 *   ```;
 */
export class ReactiveElement extends HTMLElementBase {
  /**
   * User-supplied object that maps property names to {@linkcode PropertyDeclaration} objects containing options for
   * configuring reactive properties. When a reactive property is set the element will update and render.
   */
  static properties: PropertyDeclarationMap = {};

  /** Returns a list of attributes corresponding to the registered properties. */
  static get observedAttributes(): string[] {
    return [...resolve(this).attrToProp.keys()];
  }

  // --- Instance state ---

  #controllers: Set<ReactiveController> = new Set();
  #changedProperties: PropertyValues = new Map();
  #instanceProperties: Map<string, unknown> | undefined;
  #propertiesUpgraded = false;

  /**
   * Promise that gates the first update until `connectedCallback`. Also used to serialize updates — each
   * `#enqueueUpdate` awaits the previous `#updatePromise`, so property changes are batched and updates never overlap.
   * Matches Lit's scheduling model.
   */
  #updatePromise: Promise<boolean>;

  /** True if there is a pending update as a result of calling `requestUpdate()`. Should only be read. */
  isUpdatePending = false;

  /**
   * Is set to `true` after the first update. The element code cannot assume that the DOM is fully initialized before
   * the element `hasUpdated`.
   */
  hasUpdated = false;

  constructor() {
    super();

    // Initialize to an unresolved Promise so we can make sure the element
    // has connected before the first update. The resolver is assigned to
    // `this.enableUpdating`, overriding the no-op prototype method.
    this.#updatePromise = new Promise<boolean>(
      (res) => (this.enableUpdating = res as (requestedUpdate: boolean) => void)
    );

    // Save instance properties that might shadow prototype accessors.
    // Handles the "upgrade" case where properties were set before registration.
    const { props } = resolve(this.constructor as typeof ReactiveElement);

    for (const name of props.keys()) {
      if (Object.hasOwn(this, name)) {
        (this.#instanceProperties ??= new Map()).set(name, (this as Record<string, unknown>)[name]);
        delete (this as Record<string, unknown>)[name];
      }
    }

    // Enqueue the first update. It won't run until connectedCallback calls
    // `this.enableUpdating(true)` which resolves the #updatePromise gate.
    this.requestUpdate();
  }

  /**
   * Note, this method should be considered final and not overridden. It is overridden on the element instance with a
   * function that triggers the first update.
   */
  protected enableUpdating(_requestedUpdate: boolean): void {}

  /**
   * Registers a {@linkcode ReactiveController} to participate in the element's reactive update cycle. The element
   * automatically calls into any registered controllers during its lifecycle callbacks.
   *
   * If the element is connected when `addController()` is called, the controller's `hostConnected()` callback will be
   * immediately called.
   */
  addController(controller: ReactiveController): void {
    this.#controllers.add(controller);

    if (this.isConnected) {
      controller.hostConnected?.();
    }
  }

  /** Removes a {@linkcode ReactiveController} from the element. */
  removeController(controller: ReactiveController): void {
    this.#controllers.delete(controller);
  }

  /** On first connection, enables updating and notifies controllers. */
  connectedCallback(): void {
    this.#upgradeProperties();
    this.enableUpdating(true);

    for (const c of this.#controllers) {
      c.hostConnected?.();
    }
  }

  disconnectedCallback(): void {
    for (const c of this.#controllers) {
      c.hostDisconnected?.();
    }
  }

  /**
   * Synchronizes property values when attributes change.
   *
   * Specifically, when an attribute is set, the corresponding property is set. You should rarely need to implement this
   * callback. If this method is overridden, `super.attributeChangedCallback(name, _old, value)` must be called.
   */
  attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    const { props, attrToProp } = resolve(this.constructor as typeof ReactiveElement);
    const propName = attrToProp.get(attr);
    if (!propName) return;

    const decl = props.get(propName);
    if (!decl) return;

    let value: unknown = newValue;

    if (decl.type === Boolean) {
      value = newValue !== null;
    } else if (decl.type === Number) {
      value = newValue === null ? null : Number(newValue);
    }

    (this as Record<string, unknown>)[propName] = value;
  }

  /**
   * Requests an update which is processed asynchronously. This should be called when an element should update based on
   * some state not triggered by setting a reactive property. In this case, pass no arguments. It should also be called
   * when manually implementing a property setter. In this case, pass the property `name` and `oldValue` to ensure that
   * any configured property options are honored.
   */
  requestUpdate(name?: string, oldValue?: unknown): void {
    if (name !== undefined && !this.#changedProperties.has(name)) {
      this.#changedProperties.set(name, oldValue);
    }

    if (this.isUpdatePending) return;

    this.#updatePromise = this.#enqueueUpdate();
  }

  /**
   * Sets up the element to asynchronously update. Awaits the previous `#updatePromise` which both serializes updates
   * and (on first update) waits for `connectedCallback` to resolve the gate.
   */
  async #enqueueUpdate(): Promise<boolean> {
    this.isUpdatePending = true;

    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await this.#updatePromise;
    } catch (e: unknown) {
      // Refire any previous errors async so they do not disrupt the
      // update cycle.
      Promise.reject(e);
    }

    const result = this.scheduleUpdate();

    // If `scheduleUpdate` returns a Promise, we await it. This is done to
    // enable coordinating updates with a scheduler.
    if (result != null) {
      await result;
    }

    return !this.isUpdatePending;
  }

  /**
   * Schedules an element update. You can override this method to change the timing of updates by returning a Promise.
   * The update will await the returned Promise, and you should resolve the Promise to allow the update to proceed. If
   * this method is overridden, `super.scheduleUpdate()` must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```ts
   * override protected async scheduleUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.scheduleUpdate();
   * }
   * ```
   */
  protected scheduleUpdate(): void | Promise<unknown> {
    this.performUpdate();
  }

  /**
   * Performs an element update. Note, if an exception is thrown during the update, `firstUpdated` and `updated` will
   * not be called.
   *
   * Call `performUpdate()` to immediately process a pending update. This should generally not be needed, but it can be
   * done in rare cases when you need to update synchronously.
   */
  protected performUpdate(): void {
    // Abort any update if one is not pending when this is called.
    // This can happen if `performUpdate` is called early to "flush"
    // the update.
    if (!this.isUpdatePending) return;

    const changed = this.#changedProperties;

    this.willUpdate(changed);

    for (const c of this.#controllers) {
      c.hostUpdate?.();
    }

    this.update(changed);

    // The update is no longer pending and further updates are now allowed.
    this.#changedProperties = new Map();
    this.isUpdatePending = false;

    for (const c of this.#controllers) {
      c.hostUpdated?.();
    }

    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changed);
    }

    this.updated(changed);
  }

  /**
   * Invoked before `update()` to compute values needed during the update.
   *
   * Implement `willUpdate` to compute property values that depend on other properties and are used in the rest of the
   * update process.
   *
   * ```ts
   * willUpdate(changed) {
   *   if (changed.has('firstName') || changed.has('lastName')) {
   *     this.sha = computeSHA(`${this.firstName} ${this.lastName}`);
   *   }
   * }
   * ```
   */
  protected willUpdate(_changed: PropertyValues): void {}

  /**
   * Updates the element. Override it to render and keep the element's DOM up to date; properties are not reflected to
   * attributes. Setting properties inside this method will _not_ trigger another update.
   */
  protected update(_changed: PropertyValues): void {}

  /**
   * Invoked when the element is first updated. Implement to perform one time work on the element after update.
   *
   * Setting properties inside this method will trigger the element to update again after this update cycle completes.
   */
  protected firstUpdated(_changed: PropertyValues): void {}

  /**
   * Invoked whenever the element is updated. Implement to perform post-updating tasks via DOM APIs, for example,
   * focusing an element.
   *
   * Setting properties inside this method will trigger the element to update again after this update cycle completes.
   */
  protected updated(_changed: PropertyValues): void {}

  /**
   * Returns a Promise that resolves when the element has completed updating. The Promise value is a boolean that is
   * `true` if the element completed the update without triggering another update. The Promise result is `false` if a
   * property was set inside `updated()`.
   */
  get updateComplete(): Promise<boolean> {
    return this.#updatePromise;
  }

  /**
   * Replays properties set before registration through their reactive accessors. This runs after subclass fields have
   * initialized but before connection lifecycle consumers, so user values win over defaults and are immediately
   * usable.
   */
  #upgradeProperties(): void {
    if (this.#propertiesUpgraded) return;

    this.#propertiesUpgraded = true;

    const { props } = resolve(this.constructor as typeof ReactiveElement);

    for (const name of props.keys()) {
      const hasSavedValue = this.#instanceProperties?.has(name) ?? false;
      const hasOwnValue = Object.hasOwn(this, name);
      if (!hasSavedValue && !hasOwnValue) continue;

      const value = hasSavedValue ? this.#instanceProperties?.get(name) : Reflect.get(this, name);

      if (hasOwnValue) Reflect.deleteProperty(this, name);

      Reflect.set(this, name, value);
    }

    this.#instanceProperties = undefined;
  }
}

/**
 * Resolve `ctor.properties` into lookup Maps and install reactive accessors on the prototype. Runs once per class,
 * result is cached.
 *
 * Subclasses that need parent properties must spread them: `static override properties = { ...Parent.properties, ...
 * }`.
 */
function resolve(ctor: typeof ReactiveElement): ResolvedMeta {
  const existing = cache.get(ctor);
  if (existing) return existing;

  const props = new Map<string, PropertyDeclaration>();
  const attrToProp = new Map<string, string>();

  for (const [name, decl] of Object.entries(ctor.properties)) {
    props.set(name, decl);
    attrToProp.set(decl.attribute ?? name, name);

    // Install reactive accessor on the prototype
    if (!Object.getOwnPropertyDescriptor(ctor.prototype, name)?.get) {
      let key = propertyKeys.get(name);

      if (!key) {
        key = Symbol(name);
        propertyKeys.set(name, key);
      }

      Object.defineProperty(ctor.prototype, name, {
        get(this: ReactiveElement) {
          return (this as unknown as Record<symbol, unknown>)[key];
        },
        set(this: ReactiveElement, value: unknown) {
          const old = (this as unknown as Record<symbol, unknown>)[key];

          (this as unknown as Record<symbol, unknown>)[key] = value;

          if (!Object.is(old, value)) {
            this.requestUpdate(name, old);
          }
        },
        configurable: true,
        enumerable: true,
      });
    }
  }

  const meta: ResolvedMeta = { props, attrToProp };

  cache.set(ctor, meta);
  return meta;
}
