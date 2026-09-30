import { isMacOS } from '@videojs/utils/dom';

import type { HotkeyProps } from '../../core/ui/hotkey/core';
import type { InputAction } from '../../core/ui/input-action';
import { getMediaInputActionValue } from '../media-action-value';
import { HotkeyCoordinator } from './coordinator';

export type HotkeyModifierKey = 'shift' | 'ctrl' | 'alt' | 'meta';

export interface ParsedHotkeyBinding {
  modifiers: Set<HotkeyModifierKey>;
  /** Lowercased key for matching. */
  key: string;
  /** Original casing preserved for ARIA formatting. */
  originalKey: string;
}

export interface HotkeyOptions extends Pick<HotkeyProps, 'keys' | 'target' | 'disabled' | 'value'> {
  onActivate: (event: KeyboardEvent, key: string) => void;
  /** Whether `event.repeat` should fire the callback. */
  repeatable?: boolean | undefined;
  /** Action name for the ARIA registry and subscriber events. */
  action?: InputAction | undefined;
}

const MODIFIER_KEYS = new Set(['shift', 'ctrl', 'alt', 'meta']);

/**
 * Parse a key pattern string into one or more bindings.
 *
 * @example
 *   ```ts
 *   parseHotkeyPattern('>');
 *   // [{ modifiers: Set(), key: '>', originalKey: '>' }]
 *
 *   parseHotkeyPattern('0-9');
 *   // 10 bindings, one per digit
 *   ```;
 */
export function parseHotkeyPattern(pattern: string): ParsedHotkeyBinding[] {
  // Range expansion: "0-9" → individual digit bindings.
  if (pattern === '0-9') {
    return Array.from({ length: 10 }, (_, i) => ({
      modifiers: new Set<HotkeyModifierKey>(),
      key: String(i),
      originalKey: String(i),
    }));
  }

  const segments = pattern.split('+');
  const rawKey = segments.pop()!;
  const modifiers = new Set<HotkeyModifierKey>();

  for (const seg of segments) {
    const lower = seg.toLowerCase();

    if (lower === 'mod') {
      modifiers.add(isMacOS() ? 'meta' : 'ctrl');
    } else if (MODIFIER_KEYS.has(lower)) {
      modifiers.add(lower as HotkeyModifierKey);
    } else if (__DEV__) {
      console.warn(`[vjs-hotkey] Unknown modifier: "${seg}" in pattern "${pattern}"`);
    }
  }

  // "Space" is the readable name but KeyboardEvent.key is " ".
  const key = rawKey === 'Space' ? ' ' : rawKey.toLowerCase();

  return [{ modifiers, key, originalKey: rawKey }];
}

/**
 * Single non-letter character — layout-dependent modifiers (Shift, Alt/Option) were used to produce the character
 * itself, not as deliberate modifiers (e.g. Shift+. → ">", Option+Shift → ">" on some Mac layouts). Letters excluded
 * because Shift changes case intentionally (k vs K). Named keys excluded because event.key.length > 1 (ArrowLeft, Tab,
 * etc.).
 */
function isImplicitModifierKey(key: string): boolean {
  return key.length === 1 && !/[a-z]/i.test(key);
}

/** Whether a parsed binding matches a keyboard event. */
export function matchesHotkeyEvent(binding: ParsedHotkeyBinding, event: KeyboardEvent): boolean {
  // IME composition filtering.
  if (event.key === 'Unidentified') return false;

  // Case-insensitive key comparison.
  if (event.key.toLowerCase() !== binding.key) return false;

  // Implicit modifiers: non-letter character keys (>, <, ?, !) may require Shift or
  // Alt (Option) to produce on some layouts but not others. Treat these modifiers as
  // present only when the binding explicitly asks for them.
  const implicit = isImplicitModifierKey(event.key);
  const shiftKey = implicit ? event.shiftKey && binding.modifiers.has('shift') : event.shiftKey;
  const altKey = implicit ? event.altKey && binding.modifiers.has('alt') : event.altKey;

  // Exact modifier matching — all four must agree.
  if (shiftKey !== binding.modifiers.has('shift')) return false;

  if (event.ctrlKey !== binding.modifiers.has('ctrl')) return false;

  if (altKey !== binding.modifiers.has('alt')) return false;

  if (event.metaKey !== binding.modifiers.has('meta')) return false;

  return true;
}

// --- Coordinator management ---

const coordinators = new WeakMap<HTMLElement, HotkeyCoordinator>();

/** Look up the coordinator for a target element, if one exists. */
export function findHotkeyCoordinator(target: HTMLElement): HotkeyCoordinator | undefined {
  return coordinators.get(target);
}

/** Look up or create the hotkey coordinator for a target element. */
export function getHotkeyCoordinator(target: HTMLElement): HotkeyCoordinator {
  let coordinator = coordinators.get(target);

  if (!coordinator) {
    coordinator = new HotkeyCoordinator(target);
    coordinators.set(target, coordinator);
  }

  return coordinator;
}

/**
 * Register a hotkey binding on a target element.
 *
 * @example
 *   ```ts
 *   const cleanup = createHotkey(container, {
 *     keys: 'k',
 *     onActivate: () => (store.paused ? store.play() : store.pause()),
 *   });
 *
 *   // Later: remove the binding
 *   cleanup();
 *   ```;
 *
 * @returns A cleanup function that removes the binding.
 */
export function createHotkey(target: HTMLElement, options: HotkeyOptions): () => void {
  const coordinator = getHotkeyCoordinator(target);
  const key = parseHotkeyPattern(options.keys)[0]?.originalKey;

  return coordinator.add({
    ...options,
    value: getMediaInputActionValue(options.action ?? '', key, options.value),
  });
}
