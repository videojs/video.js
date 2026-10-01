/** An object that can host Reactive Controllers and call their lifecycle callbacks. */
export interface ReactiveControllerHost {
  /**
   * Adds a controller to the host, which sets up the controller's lifecycle methods to be called with the host's
   * lifecycle.
   */
  addController(controller: ReactiveController): void;

  /** Removes a controller from the host. */
  removeController(controller: ReactiveController): void;

  /**
   * Requests a host update which is processed asynchronously. The update can be waited on via the `updateComplete`
   * property.
   */
  requestUpdate(): void;

  /**
   * Returns a Promise that resolves when the host has completed updating. The Promise value is a boolean that is `true`
   * if the element completed the update without triggering another update. The Promise result is `false` if a property
   * was set inside `updated()`. If the Promise is rejected, an exception was thrown during the update.
   */
  readonly updateComplete: Promise<boolean>;
}

/**
 * A Reactive Controller is an object that enables sub-component code organization and reuse by aggregating the state,
 * behavior, and lifecycle hooks related to a single feature.
 *
 * Controllers are added to a host component, or other object that implements the {@linkcode ReactiveControllerHost}
 * interface, via the `addController()` method. They can hook their host component's lifecycle by implementing one or
 * more of the lifecycle callbacks, or initiate an update of the host component by calling `requestUpdate()` on the
 * host.
 */
export interface ReactiveController {
  /**
   * Called when the host is connected to the component tree. For custom element hosts, this corresponds to the
   * `connectedCallback()` lifecycle, which is only called when the component is connected to the document.
   */
  hostConnected?(): void;

  /**
   * Called when the host is disconnected from the component tree. For custom element hosts, this corresponds to the
   * `disconnectedCallback()` lifecycle, which is called when the host or an ancestor component is disconnected from the
   * document.
   */
  hostDisconnected?(): void;

  /**
   * Called when the host is permanently destroyed. Unlike `hostDisconnected`, this signals that the host will not
   * reconnect — all resources should be released.
   */
  hostDestroyed?(): void;

  /** Called during the client-side host update, just before the host calls its own update. */
  hostUpdate?(): void;

  /** Called after a host update, just before the host calls `firstUpdated` and `updated`. */
  hostUpdated?(): void;
}

/** A Map of property keys to previous values, provided to lifecycle methods that receive changed properties. */
export type PropertyValues = Map<string, unknown>;

/** Defines options for a reactive property. */
export interface PropertyDeclaration {
  /**
   * Indicates the type of the property. This is used as a hint to determine how to convert between attributes and
   * properties.
   */
  readonly type?: typeof String | typeof Boolean | typeof Number;

  /**
   * Indicates the attribute name to use for this property. By default, the property name is used as-is, so a camelCase
   * property needs an explicit lowercase `attribute` (such as `'content-title'`) to match an HTML attribute.
   */
  readonly attribute?: string;
}

/**
 * Map of property names to {@linkcode PropertyDeclaration} options.
 *
 * @example
 *   ```ts
 *   static override properties = {
 *   src: { type: String },
 *   muted: { type: Boolean },
 *   } satisfies PropertyDeclarationMap<keyof MyElement>;
 *   ```;
 */
export type PropertyDeclarationMap<K extends string = string> = Record<K, PropertyDeclaration>;
