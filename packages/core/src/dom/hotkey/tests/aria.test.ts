import { describe, expect, it } from 'vite-plus/test';

import { toAriaKeyShortcut, toDisplayKeyShortcut } from '../aria';
import { parseHotkeyPattern } from '../hotkey';

describe('toAriaKeyShortcut', () => {
  it('formats a simple key', () => {
    expect(toAriaKeyShortcut(parseHotkeyPattern('k'))).toBe('k');
  });

  it('maps ctrl to Control', () => {
    expect(toAriaKeyShortcut(parseHotkeyPattern('Ctrl+k'))).toBe('Control+k');
  });

  it('maps shift to Shift', () => {
    expect(toAriaKeyShortcut(parseHotkeyPattern('Shift+ArrowLeft'))).toBe('Shift+ArrowLeft');
  });

  it('formats multiple modifiers in consistent order', () => {
    const result = toAriaKeyShortcut(parseHotkeyPattern('Shift+Ctrl+f'));

    expect(result).toBe('Control+Shift+f');
  });

  it('separates alternatives with space', () => {
    const bindings = [...parseHotkeyPattern('k'), ...parseHotkeyPattern('Space')];

    expect(toAriaKeyShortcut(bindings)).toBe('k Space');
  });

  it('preserves original key casing', () => {
    expect(toAriaKeyShortcut(parseHotkeyPattern('ArrowRight'))).toBe('ArrowRight');
  });

  it('handles digit range bindings', () => {
    const bindings = parseHotkeyPattern('0-9');
    const result = toAriaKeyShortcut(bindings);

    expect(result).toBe('0 1 2 3 4 5 6 7 8 9');
  });
});

describe('toDisplayKeyShortcut', () => {
  it('formats a compact display key', () => {
    const binding = parseHotkeyPattern('Ctrl+Shift+k')[0]!;

    expect(toDisplayKeyShortcut(binding)).toBe('Ctrl+Shift+K');
  });
});
