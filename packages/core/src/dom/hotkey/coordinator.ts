import { isEditableTarget, isInteractiveActivation, listen } from '@videojs/utils/dom';
import { isUndefined } from '@videojs/utils/predicate';

import { isInteractionLocked } from '../ui/interaction-lock';
import { toAriaKeyShortcut, toDisplayKeyShortcut } from './aria';
import type { HotkeyOptions, ParsedHotkeyBinding } from './hotkey';
import { matchesHotkeyEvent, parseHotkeyPattern } from './hotkey';

/** @internal */
export interface HotkeyActivateEvent {
  source: 'hotkey';
  action?: string | undefined;
  value?: number | undefined;
  event: KeyboardEvent;
}

interface HotkeyBinding {
  parsed: ParsedHotkeyBinding[];
  options: HotkeyOptions;
  /** Registration order for DOM-order tie-breaking. */
  id: number;
}

export interface HotkeyShortcutDetails {
  aria?: string | undefined;
  shortcut?: string | undefined;
}

/** @internal */
export class HotkeyCoordinator {
  #target: HTMLElement;
  #bindings: HotkeyBinding[] = [];
  #nextId = 0;
  #disconnect: AbortController | null = null;
  #docDisconnect: AbortController | null = null;
  #activationSubscribers = new Set<(event: HotkeyActivateEvent) => void>();
  #shortcutSubscribers = new Set<() => void>();
  #destroyed = false;

  constructor(target: HTMLElement) {
    this.#target = target;
  }

  subscribe(callback: (event: HotkeyActivateEvent) => void): () => void {
    this.#activationSubscribers.add(callback);
    return () => this.#activationSubscribers.delete(callback);
  }

  subscribeShortcutChanges(callback: () => void): () => void {
    this.#shortcutSubscribers.add(callback);
    return () => this.#shortcutSubscribers.delete(callback);
  }

  add(options: HotkeyOptions): () => void {
    const parsed = parseHotkeyPattern(options.keys);
    const binding: HotkeyBinding = { parsed, options, id: this.#nextId++ };

    this.#bindings.push(binding);
    this.#sortBindings();

    // Lazily connect listeners.
    if (options.target === 'document') {
      this.#connectDocument();
    } else {
      this.#connect();
    }

    this.#notify();

    let removed = false;

    return () => {
      if (removed) return;

      removed = true;

      const idx = this.#bindings.indexOf(binding);

      if (idx !== -1) this.#bindings.splice(idx, 1);

      this.#maybeDisconnect();
      this.#notify();
    };
  }

  getAriaKeys(action: string): string | undefined {
    return this.getShortcut(action).aria;
  }

  getShortcut(action: string, value?: number | undefined): HotkeyShortcutDetails {
    const bindings = this.#getActionBindings(action, value);
    if (!bindings.length) return {};

    const parsed = bindings.flatMap((binding) => binding.parsed);
    const preferred = bindings[bindings.length - 1]!;

    return {
      aria: toAriaKeyShortcut(parsed),
      shortcut: this.#formatDisplayShortcut(preferred),
    };
  }

  destroy(): void {
    if (this.#destroyed) return;

    this.#destroyed = true;
    this.#disconnect?.abort();
    this.#disconnect = null;
    this.#docDisconnect?.abort();
    this.#docDisconnect = null;
    this.#bindings = [];
    this.#notify();
    this.#activationSubscribers.clear();
    this.#shortcutSubscribers.clear();
  }

  // --- Private ---

  #sortBindings(): void {
    this.#bindings.sort((a, b) => {
      // Higher specificity (more modifiers) first.
      const specDiff = b.parsed[0]!.modifiers.size - a.parsed[0]!.modifiers.size;
      if (specDiff !== 0) return specDiff;

      // Then registration order.
      return a.id - b.id;
    });
  }

  #connect(): void {
    if (this.#disconnect) return;

    this.#disconnect = new AbortController();
    listen(this.#target, 'keydown', this.#handleEvent, { signal: this.#disconnect.signal });
  }

  #connectDocument(): void {
    if (this.#docDisconnect) return;

    this.#docDisconnect = new AbortController();
    listen(document, 'keydown', this.#handleEvent, { signal: this.#docDisconnect.signal });
  }

  #maybeDisconnect(): void {
    const hasPlayer = this.#bindings.some((b) => b.options.target !== 'document');
    const hasDoc = this.#bindings.some((b) => b.options.target === 'document');

    if (!hasPlayer) {
      this.#disconnect?.abort();
      this.#disconnect = null;
    }

    if (!hasDoc) {
      this.#docDisconnect?.abort();
      this.#docDisconnect = null;
    }
  }

  #handleEvent = (event: KeyboardEvent): void => {
    if (isInteractionLocked(this.#target)) return;

    // IME composition filtering.
    if (event.key === 'Unidentified') return;

    // Let interactive elements handle their own activation keys.
    if (isInteractiveActivation(event)) return;

    if (event.defaultPrevented) return;

    const editable = isEditableTarget(event);

    for (const binding of this.#bindings) {
      const { options, parsed } = binding;
      if (options.disabled) continue;

      if (event.repeat && options.repeatable === false) continue;

      // Only consider bindings matching the event's target scope.
      const isDocBinding = options.target === 'document';
      const isDocEvent = event.currentTarget === document;
      if (isDocBinding !== isDocEvent) continue;

      for (const p of parsed) {
        if (!matchesHotkeyEvent(p, event)) continue;

        // Input safety: single-key shortcuts suppressed in editable fields.
        if (editable && p.modifiers.size === 0) continue;

        if (this.#activationSubscribers.size > 0) {
          const activateEvent: HotkeyActivateEvent = {
            source: 'hotkey',
            action: options.action,
            value: options.value,
            event,
          };

          for (const cb of this.#activationSubscribers) {
            try {
              cb(activateEvent);
            } catch (error) {
              if (__DEV__) console.warn('[vjs-hotkey] subscribe callback threw:', error);
            }
          }
        }

        event.preventDefault();
        options.onActivate(event, p.originalKey);
        return;
      }
    }
  };

  #getActionBindings(action: string, value?: number | undefined): HotkeyBinding[] {
    return this.#bindings
      .filter((binding) => {
        if (binding.options.disabled) return false;

        if (binding.options.action !== action) return false;

        if (isUndefined(value)) return true;

        return binding.options.value === value;
      })
      .sort((a, b) => a.id - b.id);
  }

  #formatDisplayShortcut(binding: HotkeyBinding): string {
    if (binding.options.keys === '0-9') return binding.options.keys;

    return toDisplayKeyShortcut(binding.parsed[0]!);
  }

  #notify(): void {
    for (const subscriber of this.#shortcutSubscribers) {
      subscriber();
    }
  }
}
