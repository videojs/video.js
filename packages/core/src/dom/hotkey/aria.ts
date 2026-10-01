import type { HotkeyModifierKey, ParsedHotkeyBinding } from './hotkey';

const ARIA_MODIFIER_MAP: Record<HotkeyModifierKey, string> = {
  shift: 'Shift',
  ctrl: 'Control',
  alt: 'Alt',
  meta: 'Meta',
};

const DISPLAY_MODIFIER_MAP: Record<HotkeyModifierKey, string> = {
  shift: 'Shift',
  ctrl: 'Ctrl',
  alt: 'Alt',
  meta: 'Meta',
};

const MODIFIER_ORDER: readonly HotkeyModifierKey[] = ['ctrl', 'shift', 'alt', 'meta'];

/**
 * Convert parsed key bindings to a WAI-ARIA `aria-keyshortcuts` formatted string.
 *
 * @example
 *   ```ts
 *   toAriaKeyShortcut(parseHotkeyPattern('Ctrl+Shift+f'));
 *   // "Control+Shift+f"
 *
 *   toAriaKeyShortcut([...parseHotkeyPattern('k'), ...parseHotkeyPattern('Space')]);
 *   // "k Space"
 *   ```;
 *
 * @internal
 */
export function toAriaKeyShortcut(bindings: ParsedHotkeyBinding[]): string {
  return bindings
    .map((b) => {
      const parts: string[] = [];

      for (const mod of MODIFIER_ORDER) {
        if (b.modifiers.has(mod)) {
          parts.push(ARIA_MODIFIER_MAP[mod]);
        }
      }

      parts.push(b.originalKey);
      return parts.join('+');
    })
    .join(' ');
}

/**
 * Convert a parsed key binding to a compact display shortcut.
 *
 * @internal
 */
export function toDisplayKeyShortcut(binding: ParsedHotkeyBinding): string {
  const parts: string[] = [];

  for (const mod of MODIFIER_ORDER) {
    if (binding.modifiers.has(mod)) {
      parts.push(DISPLAY_MODIFIER_MAP[mod]);
    }
  }

  parts.push(toDisplayKey(binding.originalKey));
  return parts.join('+');
}

function toDisplayKey(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key;
}
