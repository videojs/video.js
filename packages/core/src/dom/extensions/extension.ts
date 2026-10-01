import type { PlayerTarget } from '../player';
import type { MediaOverrideSource } from './media';

/**
 * The player as an extension sees it, handed over when the extension connects: facts about the player itself, which
 * hold across media changes. Extends as extensions need more of the player.
 *
 * @internal
 */
export interface ExtensionPlayer {
  /** Epoch milliseconds at which the player was created, before any extension or media existed. */
  readonly initTime: number;
}

/**
 * A player extension joins a player, follows its attached media, and may take over media members while it is active.
 *
 * Extensions are owned by whoever registers them (an element, a hook); the player only drives their lifecycle.
 *
 * - `connect` runs once, when the extension is registered with a player, and `disconnect` when it is released.
 * - `attach` runs whenever the media changes (not when only the container does), after `connect`. It receives the media
 *   the player resolved, never the facade the store sees, so an extension can read the real state under its own
 *   overrides. `detach` runs before the next `attach`, when the media goes away, and before `disconnect`.
 *
 * An extension that declares no `mediaOverride` is an observer (analytics, for example): registering it never wraps the
 * media the store sees or re-attaches the store.
 *
 * @internal
 */
export interface PlayerExtension extends MediaOverrideSource {
  connect?(player: ExtensionPlayer): void;
  disconnect?(): void;
  attach?(target: PlayerTarget): void;
  detach?(): void;
  destroy?(): void;
}

/** @internal */
export interface PlayerExtensionConstructor<T extends PlayerExtension = PlayerExtension> {
  new (...args: any[]): T;
}
