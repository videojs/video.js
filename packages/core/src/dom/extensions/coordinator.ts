import type { Media } from '@videojs/media';

import type { PlayerTarget } from '../player';
import type { ExtensionPlayer, PlayerExtension, PlayerExtensionConstructor } from './extension';
import { createMediaFacade } from './media';

/** Whether `extension` can take over media members, as opposed to only observing the player. */
function overridesMedia(extension: PlayerExtension | undefined): boolean {
  return !!extension && 'mediaOverride' in extension;
}

/**
 * Holds one extension per class for a player and keeps them attached to the player's current media.
 *
 * Create one per player, when the player is created: its creation time is the player's `initTime`, and it outlives any
 * store the player replaces. Registered extensions connect to its {@link ExtensionPlayer}. The player wraps its media
 * with {@link PlayerExtensionCoordinator.getStoreMedia} before attaching the store, and re-attaches the store whenever
 * `onChange` fires so features re-read members an extension now owns (such as `remote`).
 *
 * @internal
 */
export class PlayerExtensionCoordinator {
  readonly #extensions = new Map<PlayerExtensionConstructor, PlayerExtension>();
  // One facade per media, so `store.target.media` stays the same object across store re-attaches.
  readonly #facades = new WeakMap<Media, Media>();
  readonly #player: ExtensionPlayer = { initTime: Date.now() };
  readonly #onChange: () => void;
  #target: PlayerTarget | null = null;

  /** @param onChange - Called after an extension that overrides media members is registered or released. */
  constructor(onChange: () => void) {
    this.#onChange = onChange;
  }

  get size(): number {
    return this.#extensions.size;
  }

  get<T extends PlayerExtension>(Extension: PlayerExtensionConstructor<T>): T | undefined {
    return this.#extensions.get(Extension) as T | undefined;
  }

  /**
   * Register `extension`, replacing any earlier instance of the same class: connect it to the player and attach it to
   * the current target. Returns a release callback that only removes this exact instance.
   */
  register(extension: PlayerExtension): () => void {
    const Extension = extension.constructor as PlayerExtensionConstructor;
    const previous = this.#extensions.get(Extension);

    if (previous !== extension) {
      if (previous) this.#leave(previous);

      this.#extensions.set(Extension, extension);
      extension.connect?.(this.#player);

      if (this.#target) extension.attach?.(this.#target);

      if (overridesMedia(previous) || overridesMedia(extension)) this.#onChange();
    }

    return () => this.#release(extension);
  }

  /**
   * Attach every extension to `target`. Extensions follow the media: a target with the same media is recorded without
   * re-attaching them, so a container change never restarts an extension's session.
   */
  attach(target: PlayerTarget): void {
    if (this.#target?.media === target.media) {
      this.#target = target;
      return;
    }

    this.detach();
    this.#target = target;

    for (const extension of this.#extensions.values()) {
      extension.attach?.(target);
    }
  }

  detach(): void {
    if (!this.#target) return;

    for (const extension of this.#extensions.values()) {
      extension.detach?.();
    }

    this.#target = null;
  }

  /** Detach, disconnect, and drop every registration. Extensions are destroyed by their owners, not here. */
  destroy(): void {
    this.detach();

    for (const extension of this.#extensions.values()) {
      extension.disconnect?.();
    }

    this.#extensions.clear();
  }

  /**
   * The media as the store should see it: `media` itself unless a registered extension can override media members,
   * otherwise a facade that routes each member through the extensions' overrides first.
   */
  getStoreMedia<T extends Media>(media: T): T {
    if (!this.#hasMediaOverrides()) return media;

    let facade = this.#facades.get(media);

    if (!facade) {
      facade = createMediaFacade(media, () => this.#extensions.values());
      this.#facades.set(media, facade);
    }

    // SAFETY: facades are keyed by the media they wrap, and a facade over a `T` is a `T`.
    return facade as T;
  }

  #hasMediaOverrides(): boolean {
    for (const extension of this.#extensions.values()) {
      if (overridesMedia(extension)) return true;
    }

    return false;
  }

  #release(extension: PlayerExtension): void {
    const Extension = extension.constructor as PlayerExtensionConstructor;
    if (this.#extensions.get(Extension) !== extension) return;

    this.#extensions.delete(Extension);
    this.#leave(extension);

    if (overridesMedia(extension)) this.#onChange();
  }

  /** Undo `register` for an extension that is no longer registered: detach it from the media, then disconnect it. */
  #leave(extension: PlayerExtension): void {
    if (this.#target) extension.detach?.();

    extension.disconnect?.();
  }
}
