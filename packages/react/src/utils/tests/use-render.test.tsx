import { cleanup, render } from '@testing-library/react';
import type { ForwardedRef, Ref } from 'react';
import { createRef, forwardRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { renderElement } from '../use-render';

afterEach(cleanup);

interface TestState {
  active?: boolean;
}

interface TestComponentProps extends renderElement.ComponentProps<TestState> {
  active?: boolean;
  id?: string;
  title?: string;
  onClick?: () => void;
  'data-testid'?: string;
}

const TestComponent = forwardRef(function TestComponent(props: TestComponentProps, ref: ForwardedRef<HTMLDivElement>) {
  const { className, style, render: renderProp, active = false, ...elementProps } = props;
  const state: TestState = { active };

  return renderElement(
    'div',
    { className, style, render: renderProp },
    {
      state,
      ref,
      props: [{ 'data-component': 'test' }, elementProps],
    }
  );
});

describe('renderElement', () => {
  describe('default tag rendering', () => {
    it('renders the specified element tag', () => {
      const { container } = render(<TestComponent />);
      const element = container.firstElementChild;

      expect(element?.tagName).toBe('DIV');
    });

    it('spreads props onto the element', () => {
      const { container } = render(<TestComponent id="my-id" title="my-title" />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('id')).toBe('my-id');
      expect(element?.getAttribute('title')).toBe('my-title');
    });

    it('includes internal props', () => {
      const { container } = render(<TestComponent />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('data-component')).toBe('test');
    });
  });

  describe('className', () => {
    it('accepts className as string', () => {
      const { container } = render(<TestComponent className="my-class" />);
      const element = container.firstElementChild;

      expect(element?.className).toContain('my-class');
    });

    it('accepts className as function of state', () => {
      const { container } = render(
        <TestComponent active className={(state) => (state.active ? 'active' : 'inactive')} />
      );
      const element = container.firstElementChild;

      expect(element?.className).toContain('active');
      expect(element?.className).not.toContain('inactive');
    });

    it('handles className function returning undefined', () => {
      function WithInternalClass() {
        return renderElement(
          'div',
          { className: () => undefined },
          {
            state: {},
            props: [{ className: 'internal' }],
          }
        );
      }

      const { container } = render(<WithInternalClass />);

      expect(container.firstElementChild?.className).toBe('internal');
    });

    it('merges className with props className', () => {
      // Create a component that has internal className in props
      const ComponentWithInternalClass = forwardRef(function ComponentWithInternalClass(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: [{ className: 'internal-class' }, elementProps],
          }
        );
      });

      const { container } = render(<ComponentWithInternalClass className="external-class" />);
      const element = container.firstElementChild;

      expect(element?.className).toContain('internal-class');
      expect(element?.className).toContain('external-class');
    });
  });

  describe('style', () => {
    it('accepts style as object', () => {
      const { container } = render(<TestComponent style={{ color: 'red' }} />);
      const element = container.firstElementChild as HTMLElement;

      expect(element?.style.color).toBe('red');
    });

    it('accepts style as function of state', () => {
      const { container } = render(
        <TestComponent active style={(state) => ({ color: state.active ? 'green' : 'red' })} />
      );
      const element = container.firstElementChild as HTMLElement;

      expect(element?.style.color).toBe('green');
    });

    it('handles style function returning undefined', () => {
      const { container } = render(
        <TestComponent style={(state) => (state.active ? { color: 'green' } : undefined)} />
      );
      const element = container.firstElementChild as HTMLElement;

      expect(element?.style.color).toBe('');
    });

    it('merges style with props style', () => {
      const ComponentWithInternalStyle = forwardRef(function ComponentWithInternalStyle(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: [{ style: { padding: '10px' } }, elementProps],
          }
        );
      });

      const { container } = render(<ComponentWithInternalStyle style={{ color: 'red' }} />);
      const element = container.firstElementChild as HTMLElement;

      expect(element?.style.padding).toBe('10px');
      expect(element?.style.color).toBe('red');
    });
  });

  describe('render prop as function', () => {
    it('calls render function with merged props and state', () => {
      const renderFn = vi.fn((props, state) => <span {...props} data-active={String(state.active)} />);

      const { container } = render(<TestComponent active render={renderFn} data-testid="custom" />);

      expect(renderFn).toHaveBeenCalled();

      const [receivedProps, receivedState] = renderFn.mock.calls[0]!;

      expect(receivedProps['data-testid']).toBe('custom');
      expect(receivedProps['data-component']).toBe('test');
      expect(receivedState).toEqual({ active: true });

      const element = container.firstElementChild;

      expect(element?.tagName).toBe('SPAN');
      expect(element?.getAttribute('data-active')).toBe('true');
    });

    it('passes ref to render function props', () => {
      const componentRef = createRef<HTMLSpanElement>();

      render(<TestComponent ref={componentRef as Ref<HTMLDivElement>} render={(props) => <span {...props} />} />);

      expect(componentRef.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('merges className and style into props', () => {
      const renderFn = vi.fn((props) => <span {...props} />);

      render(<TestComponent className="my-class" style={{ color: 'red' }} render={renderFn} />);

      const [receivedProps] = renderFn.mock.calls[0]!;

      expect(receivedProps.className).toContain('my-class');
      expect(receivedProps.style).toEqual({ color: 'red' });
    });
  });

  describe('render prop as element', () => {
    it('clones element with merged props', () => {
      const { container } = render(<TestComponent render={<span />} data-testid="merged" />);

      const element = container.firstElementChild;

      expect(element?.tagName).toBe('SPAN');
      expect(element?.getAttribute('data-testid')).toBe('merged');
      expect(element?.getAttribute('data-component')).toBe('test');
    });

    it('merges className from render element and component', () => {
      const { container } = render(
        <TestComponent className="component-class" render={<span className="render-class" />} />
      );

      const element = container.firstElementChild;

      expect(element?.className).toContain('component-class');
      expect(element?.className).toContain('render-class');
    });

    it('merges style from render element and component', () => {
      const { container } = render(
        <TestComponent style={{ color: 'red' }} render={<span style={{ fontSize: '16px' }} />} />
      );

      const element = container.firstElementChild as HTMLElement;

      expect(element?.style.color).toBe('red');
      expect(element?.style.fontSize).toBe('16px');
    });

    it('preserves render element ref', () => {
      const CustomElement = forwardRef<HTMLSpanElement, React.ComponentPropsWithRef<'span'>>(
        function CustomElement(props, ref) {
          return <span ref={ref} {...props} />;
        }
      );

      const renderRef = createRef<HTMLSpanElement>();
      const componentRef = createRef<HTMLDivElement>();

      render(<TestComponent ref={componentRef} render={<CustomElement ref={renderRef} />} />);

      expect(renderRef.current).toBeInstanceOf(HTMLSpanElement);
      expect(componentRef.current).toBeInstanceOf(HTMLSpanElement);
      expect(renderRef.current).toBe(componentRef.current);
    });
  });

  describe('ref composition', () => {
    it('forwards single ref', () => {
      const ref = createRef<HTMLDivElement>();

      render(<TestComponent ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('keeps a single callback ref attached across renders', () => {
      const ref = vi.fn();
      const { rerender } = render(<TestComponent ref={ref} />);
      const element = ref.mock.calls[0]![0];

      rerender(<TestComponent ref={ref} active />);

      expect(ref).toHaveBeenCalledTimes(1);
      expect(ref).toHaveBeenCalledWith(element);
    });

    it('forwards array of refs', () => {
      const ref1 = createRef<HTMLDivElement>();
      const ref2 = createRef<HTMLDivElement>();

      // Component that accepts array of refs
      const MultiRefComponent = forwardRef(function MultiRefComponent(
        props: TestComponentProps,
        _ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref: [ref1, ref2],
            props: [elementProps],
          }
        );
      });

      render(<MultiRefComponent />);

      expect(ref1.current).toBeInstanceOf(HTMLDivElement);
      expect(ref2.current).toBeInstanceOf(HTMLDivElement);
      expect(ref1.current).toBe(ref2.current);
    });

    it('handles undefined refs in array', () => {
      const ref1 = createRef<HTMLDivElement>();

      const MultiRefComponent = forwardRef(function MultiRefComponent(
        props: TestComponentProps,
        _ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref: [ref1, undefined] as Ref<HTMLDivElement>[],
            props: [elementProps],
          }
        );
      });

      render(<MultiRefComponent />);

      expect(ref1.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('props merging', () => {
    it('merges array of props objects', () => {
      const ComponentWithMultipleProps = forwardRef(function ComponentWithMultipleProps(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: [{ 'data-first': 'first' }, { 'data-second': 'second' }, elementProps],
          }
        );
      });

      const { container } = render(<ComponentWithMultipleProps data-third="third" />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('data-first')).toBe('first');
      expect(element?.getAttribute('data-second')).toBe('second');
      expect(element?.getAttribute('data-third')).toBe('third');
    });

    it('chains event handlers from props array', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const ComponentWithHandlers = forwardRef(function ComponentWithHandlers(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, onClick, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: [{ onClick: handler1 }, { onClick }, elementProps],
          }
        );
      });

      const { container } = render(<ComponentWithHandlers onClick={handler2} />);
      const element = container.firstElementChild as HTMLElement;

      element.click();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('last prop wins for non-special props', () => {
      const ComponentWithConflictingProps = forwardRef(function ComponentWithConflictingProps(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: [{ title: 'first' }, { title: 'second' }, elementProps],
          }
        );
      });

      const { container } = render(<ComponentWithConflictingProps title="third" />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('title')).toBe('third');
    });
  });

  describe('state data attributes', () => {
    it('does not generate data-* attributes without an explicit mapping', () => {
      const { container } = render(<TestComponent active />);
      const element = container.firstElementChild;

      expect(element?.hasAttribute('data-active')).toBe(false);
    });

    it('generates mapped data-* attributes from state with multiple properties', () => {
      interface MultiState {
        paused: boolean;
        ended: boolean;
        volume: number;
      }

      const MultiStateComponent = forwardRef(function MultiStateComponent(
        props: { paused?: boolean; ended?: boolean; volume?: number } & renderElement.ComponentProps<MultiState>,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const {
          className,
          style,
          render: renderProp,
          paused = false,
          ended = false,
          volume = 1,
          ...elementProps
        } = props;
        const state: MultiState = { paused, ended, volume };
        const stateAttrMap = {
          paused: 'data-paused',
          ended: 'data-ended',
          volume: 'data-volume',
        } as const;

        return renderElement(
          'div',
          { className, style, render: renderProp },
          { state, ref, props: [elementProps], stateAttrMap }
        );
      });

      const { container } = render(<MultiStateComponent paused ended={false} volume={0.5} />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('data-paused')).toBe('');
      expect(element?.hasAttribute('data-ended')).toBe(false);
      expect(element?.getAttribute('data-volume')).toBe('0.5');
    });

    it('supports explicit state attribute mapping', () => {
      interface VolumeState {
        muted: boolean;
        volumeLevel: 'low' | 'high';
      }

      const mapping = {
        muted: 'data-muted',
        volumeLevel: 'data-volume-level',
      } as const;

      const VolumeComponent = forwardRef(function VolumeComponent(
        props: { muted?: boolean; volumeLevel?: 'low' | 'high' } & renderElement.ComponentProps<VolumeState>,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, muted = false, volumeLevel = 'high', ...elementProps } = props;
        const state: VolumeState = { muted, volumeLevel };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          { state, ref, props: [elementProps], stateAttrMap: mapping }
        );
      });

      const { container } = render(<VolumeComponent muted volumeLevel="low" />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('data-muted')).toBe('');
      expect(element?.getAttribute('data-volume-level')).toBe('low');
      expect(element?.hasAttribute('data-volumelevel')).toBe(false);
    });

    it('state data-* attributes can be overridden by explicit props', () => {
      const ComponentWithExplicitDataAttr = forwardRef(function ComponentWithExplicitDataAttr(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            stateAttrMap: { active: 'data-active' },
            // Explicit prop comes after state in merge order, so it wins
            props: [elementProps],
          }
        );
      });

      // State would generate data-active="", but explicit prop overrides
      const { container } = render(<ComponentWithExplicitDataAttr active data-active="custom" />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('data-active')).toBe('custom');
    });
  });

  describe('edge cases', () => {
    it('handles empty props array', () => {
      const ComponentWithEmptyProps = forwardRef(function ComponentWithEmptyProps(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: [],
          }
        );
      });

      const { container } = render(<ComponentWithEmptyProps className="test" />);
      const element = container.firstElementChild;

      expect(element?.tagName).toBe('DIV');
      expect(element?.className).toContain('test');
    });

    it('handles undefined props', () => {
      const ComponentWithUndefinedProps = forwardRef(function ComponentWithUndefinedProps(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: undefined,
          }
        );
      });

      const { container } = render(<ComponentWithUndefinedProps className="test" />);
      const element = container.firstElementChild;

      expect(element?.tagName).toBe('DIV');
      expect(element?.className).toContain('test');
    });

    it('handles single props object (not array)', () => {
      const ComponentWithSingleProps = forwardRef(function ComponentWithSingleProps(
        props: TestComponentProps,
        ref: ForwardedRef<HTMLDivElement>
      ) {
        const { className, style, render: renderProp, active = false, ...elementProps } = props;
        const state: TestState = { active };

        return renderElement(
          'div',
          { className, style, render: renderProp },
          {
            state,
            ref,
            props: { 'data-single': 'single', ...elementProps },
          }
        );
      });

      const { container } = render(<ComponentWithSingleProps data-testid="test" />);
      const element = container.firstElementChild;

      expect(element?.getAttribute('data-single')).toBe('single');
      expect(element?.getAttribute('data-testid')).toBe('test');
    });
  });
});
