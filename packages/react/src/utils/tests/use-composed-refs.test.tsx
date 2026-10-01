import { render } from '@testing-library/react';
import type { MutableRefObject, RefObject } from 'react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { composeRefs, useComposedRefs } from '../use-composed-refs';

// Helper to create a mutable ref object for testing (without using deprecated createRef)
function createMutableRef<T>(initialValue: T | null = null): MutableRefObject<T | null> {
  return { current: initialValue };
}

describe('composeRefs', () => {
  it('sets value on multiple refs', () => {
    const callbackRef = vi.fn();
    const refObject = createMutableRef<string>();
    const composed = composeRefs(callbackRef, refObject);

    composed('test-value');

    expect(callbackRef).toHaveBeenCalledWith('test-value');
    expect(refObject.current).toBe('test-value');
  });

  it('handles undefined refs', () => {
    const callbackRef = vi.fn();
    const composed = composeRefs(undefined, callbackRef, undefined);

    composed('test-value');

    expect(callbackRef).toHaveBeenCalledWith('test-value');
  });

  it('clears RefObject on cleanup', () => {
    const cleanup = vi.fn();
    const callbackRef = vi.fn().mockReturnValue(cleanup);
    const refObject = createMutableRef<string>();
    const composed = composeRefs(callbackRef, refObject);

    const returnedCleanup = composed('test-value') as (() => void) | void;

    expect(refObject.current).toBe('test-value');
    expect(returnedCleanup).toBeTypeOf('function');

    if (typeof returnedCleanup === 'function') {
      returnedCleanup();
    }

    expect(cleanup).toHaveBeenCalledOnce();
    expect(refObject.current).toBeNull();
  });
});

describe('useComposedRefs', () => {
  it('returns a stable callback ref', () => {
    let composedRef1: ((value: HTMLDivElement | null) => void) | null = null;
    let composedRef2: ((value: HTMLDivElement | null) => void) | null = null;

    function TestComponent() {
      const ref1 = useRef<HTMLDivElement>(null);
      const ref2 = useRef<HTMLDivElement>(null);
      const composed = useComposedRefs(ref1, ref2);

      if (!composedRef1) {
        composedRef1 = composed;
      } else {
        composedRef2 = composed;
      }

      return <div ref={composed}>Test</div>;
    }

    const { rerender } = render(<TestComponent />);

    rerender(<TestComponent />);

    // Same refs should produce same composed ref
    expect(composedRef1).toBe(composedRef2);
  });

  it('works with forwardRef pattern', () => {
    const externalRef = createMutableRef<HTMLDivElement>();

    function TestComponent({ forwardedRef }: { forwardedRef: RefObject<HTMLDivElement | null> }) {
      const internalRef = useRef<HTMLDivElement>(null);
      const composedRef = useComposedRefs(forwardedRef, internalRef);

      return <div ref={composedRef}>Test</div>;
    }

    render(<TestComponent forwardedRef={externalRef} />);

    expect(externalRef.current).toBeInstanceOf(HTMLDivElement);
  });
});
