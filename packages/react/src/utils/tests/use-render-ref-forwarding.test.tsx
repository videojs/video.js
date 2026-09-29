import { cleanup, fireEvent, render } from '@testing-library/react';
import { Component, type ComponentProps, createRef, forwardRef, memo, type ReactNode, type Ref } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MuteButton } from '../../internal/skins/default-video/components/buttons/mute-button';
import { createPlayerWrapper } from '../../testing/mocks';
import { Popover } from '../../ui/popover';
import { renderElement } from '../use-render';

// `renderElement` reads the renderer version to decide whether a plain function render target needs a `forwardRef`
// wrapper to receive the host ref. Report React 18 so that path runs on the React 19 test renderer, which would
// otherwise hand `ref` over as a prop and hide the difference.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  version: '18.3.1',
}));

const FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
const MEMO_TYPE = Symbol.for('react.memo');

interface HostProps {
  render?: renderElement.ComponentProps<object>['render'];
  onClick?: () => void;
}

/** Composes its own ref with the forwarded one through `render`, like every media button and popup trigger. */
const Host = forwardRef(function Host({ render, ...props }: HostProps, ref: Ref<HTMLButtonElement>) {
  return renderElement('button', { render }, { state: {}, ref, props: [{ type: 'button', 'data-host': '' }, props] });
});

function PlainButton(props: ComponentProps<'button'>) {
  return <button {...props} />;
}

const ForwardRefButton = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(function ForwardRefButton(props, ref) {
  return <button ref={ref} {...props} />;
});

class ClassButton extends Component<ComponentProps<'button'>> {
  render(): ReactNode {
    return <button {...this.props} />;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe('renderElement', () => {
  describe('render prop as element without ref-as-prop', () => {
    it('wraps a plain function component in forwardRef', () => {
      const element = renderElement('button', { render: <PlainButton /> }, { state: {} });

      expect(element?.type).not.toBe(PlainButton);
      expect(element?.type).toHaveProperty('$$typeof', FORWARD_REF_TYPE);
    });

    it('reuses one wrapper per component', () => {
      const first = renderElement('button', { render: <PlainButton /> }, { state: {} });
      const second = renderElement('button', { render: <PlainButton /> }, { state: {} });

      expect(first?.type).toBe(second?.type);
    });

    it('keeps the render element key', () => {
      const element = renderElement('button', { render: <PlainButton key="thumb" /> }, { state: {} });

      expect(element?.key).toBe('thumb');
    });

    it('leaves tags, class components, and forwardRef components as they are', () => {
      expect(renderElement('button', { render: <span /> }, { state: {} })?.type).toBe('span');
      expect(renderElement('button', { render: <ClassButton /> }, { state: {} })?.type).toBe(ClassButton);
      expect(renderElement('button', { render: <ForwardRefButton /> }, { state: {} })?.type).toBe(ForwardRefButton);
    });

    it('wraps the function inside memo and keeps the memo', () => {
      const MemoButton = memo(PlainButton);
      const element = renderElement('button', { render: <MemoButton /> }, { state: {} });

      expect(element?.type).not.toBe(MemoButton);
      expect(element?.type).toHaveProperty('$$typeof', MEMO_TYPE);
      expect(element?.type).toHaveProperty('type.$$typeof', FORWARD_REF_TYPE);
    });

    it('delivers the composed ref to the element a plain function renders', () => {
      const ref = createRef<HTMLButtonElement>();

      render(<Host ref={ref} render={<PlainButton />} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.hasAttribute('data-host')).toBe(true);
    });

    it('does not remount the wrapped element when the host re-renders', () => {
      const ref = createRef<HTMLButtonElement>();
      const { rerender } = render(<Host ref={ref} render={<PlainButton />} />);
      const first = ref.current;

      rerender(<Host ref={ref} render={<PlainButton />} onClick={() => {}} />);

      expect(ref.current).toBe(first);
    });

    it('forwards a popover trigger ref through the generated mute button to its <button>', () => {
      const setMuted = vi.fn((muted: boolean) => muted);
      const { Wrapper } = createPlayerWrapper({
        volume: 1,
        muted: false,
        volumeAvailability: 'available',
        mutedAvailability: 'available',
        setVolume: () => 1,
        setMuted,
      });
      const ref = createRef<HTMLButtonElement>();

      render(
        <Popover.Root>
          <Popover.Trigger ref={ref} render={<MuteButton />} />
        </Popover.Root>,
        { wrapper: Wrapper }
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(ref.current!);

      expect(setMuted).toHaveBeenCalledExactlyOnceWith(true);
    });
  });
});
