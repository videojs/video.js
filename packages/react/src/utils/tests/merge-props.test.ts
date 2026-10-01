import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { mergeProps } from '../merge-props';

// Create a minimal mock event for testing
function createMockEvent(): MouseEvent<HTMLButtonElement> {
  return { type: 'click' } as MouseEvent<HTMLButtonElement>;
}

describe('mergeProps', () => {
  describe('event handlers', () => {
    it.each([2, 3, 4])('calls %i handlers once in right-to-left order (rightmost first)', (count) => {
      const log: number[] = [];
      const handlers = Array.from({ length: count }, (_, index) => vi.fn(() => log.push(index + 1)));
      const merged = mergeProps<'button'>(...handlers.map((onClick) => ({ onClick })));

      merged.onClick?.(createMockEvent());

      expect(log).toEqual(Array.from({ length: count }, (_, index) => count - index));

      for (const handler of handlers) expect(handler).toHaveBeenCalledOnce();
    });

    it('skips undefined handlers', () => {
      const log: string[] = [];

      const merged = mergeProps<'button'>(
        { onClick: () => log.push('1') },
        { onClick: undefined },
        { onClick: () => log.push('3') }
      );

      merged.onClick?.(createMockEvent());

      expect(log).toEqual(['3', '1']);
    });

    it('handles onKeyDown event handlers', () => {
      const log: string[] = [];

      const merged = mergeProps<'button'>({ onKeyDown: () => log.push('1') }, { onKeyDown: () => log.push('2') });

      merged.onKeyDown?.({} as React.KeyboardEvent<HTMLButtonElement>);

      expect(log).toEqual(['2', '1']);
    });

    it('passes event to all handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const event = createMockEvent();

      const merged = mergeProps<'button'>({ onClick: handler1 }, { onClick: handler2 });

      merged.onClick?.(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });
  });

  describe('className', () => {
    it('concatenates multiple classNames', () => {
      const merged = mergeProps<'div'>({ className: 'a' }, { className: 'b' }, { className: 'c' });

      expect(merged.className).toBe('c b a');
    });

    it('returns single className if only one defined', () => {
      const merged = mergeProps<'div'>({ className: 'only' }, { id: 'test' });

      expect(merged.className).toBe('only');
    });

    it('returns undefined if no classNames defined', () => {
      const merged = mergeProps<'div'>({ id: 'test' }, { title: 'hello' });

      expect(merged.className).toBeUndefined();
    });

    it('handles undefined className in middle', () => {
      const merged = mergeProps<'div'>({ className: 'a' }, { className: undefined }, { className: 'c' });

      expect(merged.className).toBe('c a');
    });
  });

  describe('style', () => {
    it('merges multiple style objects', () => {
      const merged = mergeProps<'div'>(
        { style: { color: 'blue' } },
        { style: { backgroundColor: 'green' } },
        { style: { color: 'red', border: '1px solid' } }
      );

      expect(merged.style).toEqual({
        color: 'red',
        backgroundColor: 'green',
        border: '1px solid',
      });
    });

    it('returns single style if only one defined', () => {
      const style = { color: 'red' };
      const merged = mergeProps<'div'>({ style }, { id: 'test' });

      expect(merged.style).toEqual(style);
    });

    it('returns undefined if no styles defined', () => {
      const merged = mergeProps<'div'>({ id: 'test' }, { title: 'hello' });

      expect(merged.style).toBeUndefined();
    });

    it('handles undefined style in middle', () => {
      const merged = mergeProps<'div'>(
        { style: { color: 'blue' } },
        { style: undefined },
        { style: { backgroundColor: 'red' } }
      );

      expect(merged.style).toEqual({
        color: 'blue',
        backgroundColor: 'red',
      });
    });
  });

  describe('regular props', () => {
    it('overwrites with rightmost value (last wins)', () => {
      const merged = mergeProps<'button'>({ title: 'first' }, { title: 'second' }, { title: 'third' });

      expect(merged.title).toBe('third');
    });

    it('preserves non-conflicting props from all sources', () => {
      const merged = mergeProps<'button'>(
        { id: 'my-id' },
        { role: 'button' },
        { 'aria-label': 'Click me', 'aria-pressed': true, 'aria-disabled': false }
      );

      expect(merged.id).toBe('my-id');
      expect(merged.role).toBe('button');
      expect(merged['aria-label']).toBe('Click me');
      expect(merged['aria-pressed']).toBe(true);
      expect(merged['aria-disabled']).toBe(false);
    });

    it('handles boolean props', () => {
      const merged = mergeProps<'button'>({ disabled: true }, { disabled: false });

      expect(merged.disabled).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles undefined prop sets', () => {
      const handler = vi.fn();
      const merged = mergeProps<'button'>({ onClick: handler }, undefined, { title: 'test' });

      expect(merged.onClick).toBe(handler);
      expect(merged.title).toBe('test');
    });

    it('handles empty prop sets', () => {
      const handler = vi.fn();
      const merged = mergeProps<'button'>({}, { onClick: handler }, {});

      expect(merged.onClick).toBe(handler);
    });

    it('returns empty object for no arguments', () => {
      const merged = mergeProps<'button'>();

      expect(merged).toEqual({});
    });

    it('returns empty object for all undefined arguments', () => {
      const merged = mergeProps<'button'>(undefined, undefined);

      expect(merged).toEqual({});
    });

    it('does not merge ref (just overwrites)', () => {
      const ref1 = { current: null };
      const ref2 = { current: null };

      const merged = mergeProps<'button'>({ ref: ref1 }, { ref: ref2 });

      expect(merged.ref).toBe(ref2);
    });
  });
});
