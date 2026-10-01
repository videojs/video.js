import { flush } from '@videojs/store';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createDismissLayer } from '../dismiss-layer';
import { createTransition } from '../transition';

function createTestLayer(overrides?: Partial<Parameters<typeof createDismissLayer>[0]>) {
  const onEscapeDismiss = vi.fn<(event: KeyboardEvent) => void>();
  const transition = createTransition();
  const layer = createDismissLayer({
    transition,
    onEscapeDismiss,
    ...overrides,
  });

  return { layer, onEscapeDismiss, transition };
}

describe('createDismissLayer', () => {
  describe('open', () => {
    it('starts the open transition', () => {
      const { layer } = createTestLayer();

      const result = layer.open();

      expect(result).toBeInstanceOf(Promise);
      expect(layer.input.current).toEqual({ active: true, status: 'starting' });
    });

    it('returns null if already open', () => {
      const { layer } = createTestLayer();

      layer.open();
      const result = layer.open();

      expect(result).toBeNull();
    });

    it('cancels ending transition and re-opens', () => {
      const { layer } = createTestLayer();

      layer.open();
      layer.close(null);
      expect(layer.input.current.status).toBe('ending');

      const result = layer.open();

      expect(result).toBeInstanceOf(Promise);
      expect(layer.input.current.active).toBe(true);
      expect(layer.input.current.status).not.toBe('ending');
    });

    it('returns null after destroy', () => {
      const { layer } = createTestLayer();

      layer.destroy();
      const result = layer.open();

      expect(result).toBeNull();
    });
  });

  describe('close', () => {
    it('starts the close transition', () => {
      const { layer } = createTestLayer();

      layer.open();
      const result = layer.close(null);

      expect(result).toBeInstanceOf(Promise);
      expect(layer.input.current).toEqual({ active: true, status: 'ending' });
    });

    it('returns null if already closed', () => {
      const { layer } = createTestLayer();

      const result = layer.close(null);

      expect(result).toBeNull();
    });

    it('returns null if already ending', () => {
      const { layer } = createTestLayer();

      layer.open();
      layer.close(null);
      const result = layer.close(null);

      expect(result).toBeNull();
    });

    it('returns null after destroy', () => {
      const { layer } = createTestLayer();

      layer.open();
      layer.destroy();
      const result = layer.close(null);

      expect(result).toBeNull();
    });
  });

  describe('escape dismiss', () => {
    it('calls onEscapeDismiss when Escape is pressed while active', () => {
      const { layer, onEscapeDismiss } = createTestLayer();

      layer.open();
      flush();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onEscapeDismiss).toHaveBeenCalledOnce();
    });

    it('does not call onEscapeDismiss when not active', () => {
      const { onEscapeDismiss } = createTestLayer();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onEscapeDismiss).not.toHaveBeenCalled();
    });

    it('does not call onEscapeDismiss when closeOnEscape returns false', () => {
      const { layer, onEscapeDismiss } = createTestLayer({
        closeOnEscape: () => false,
      });

      layer.open();
      flush();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onEscapeDismiss).not.toHaveBeenCalled();
    });

    it('does not call onEscapeDismiss when Escape was already handled', () => {
      const { layer, onEscapeDismiss } = createTestLayer();
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });

      layer.open();
      flush();

      event.preventDefault();
      document.dispatchEvent(event);

      expect(onEscapeDismiss).not.toHaveBeenCalled();
    });

    it('ignores non-Escape keys', () => {
      const { layer, onEscapeDismiss } = createTestLayer();

      layer.open();
      flush();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(onEscapeDismiss).not.toHaveBeenCalled();
    });

    it('removes document listener while ending', () => {
      const { layer, onEscapeDismiss } = createTestLayer();

      layer.open();
      flush();

      layer.close(null);
      flush();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(layer.input.current).toEqual({ active: true, status: 'ending' });
      expect(onEscapeDismiss).not.toHaveBeenCalled();
    });
  });

  describe('onDocumentActive', () => {
    it('calls onDocumentActive with signal when layer becomes active', () => {
      const onDocumentActive = vi.fn();
      const { layer } = createTestLayer({ onDocumentActive });

      layer.open();
      flush();

      expect(onDocumentActive).toHaveBeenCalledOnce();
      expect(onDocumentActive.mock.calls[0]![0]).toBeInstanceOf(AbortSignal);
    });

    it('aborts the signal when layer becomes inactive', () => {
      const signals: AbortSignal[] = [];
      const onDocumentActive = vi.fn((signal: AbortSignal) => {
        signals.push(signal);
      });

      const { layer } = createTestLayer({ onDocumentActive });

      layer.open();
      flush();

      expect(signals[0]!.aborted).toBe(false);

      layer.close(null);
      flush();

      expect(signals[0]!.aborted).toBe(true);
    });
  });

  describe('destroy', () => {
    it('aborts the lifecycle signal', () => {
      const { layer } = createTestLayer();

      expect(layer.signal.aborted).toBe(false);

      layer.destroy();

      expect(layer.signal.aborted).toBe(true);
    });

    it('destroys the transition', () => {
      const transition = createTransition();
      const spy = vi.spyOn(transition, 'destroy');

      const { layer } = createTestLayer({ transition });

      layer.destroy();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('cleans up document listeners', () => {
      const { layer, onEscapeDismiss } = createTestLayer();

      layer.open();
      flush();

      layer.destroy();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(onEscapeDismiss).not.toHaveBeenCalled();
    });
  });
});
