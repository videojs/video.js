'use client';

import { getStateDataAttrs, type StateAttrMap } from '@videojs/core/dom';
import { isFunction, isObject } from '@videojs/utils/predicate';
import { resolveClassName } from '@videojs/utils/style';
import type { CSSProperties, FunctionComponent, ReactElement, ReactNode, Ref } from 'react';
import { cloneElement, createElement, forwardRef, isValidElement, memo, version } from 'react';

import { mergeProps } from './merge-props';
import type { HTMLProps, RenderProp } from './types';
import { composeRefs } from './use-composed-refs';

type IntrinsicTagName = keyof React.JSX.IntrinsicElements;

export interface UseRenderComponentProps<State> {
  className?: string | ((state: State) => string | undefined) | undefined;
  style?: CSSProperties | ((state: State) => CSSProperties | undefined) | undefined;
  render?: RenderProp<State> | undefined;
}

export interface UseRenderParameters<State, RenderedElementType extends Element> {
  state: State;
  ref?: Ref<RenderedElementType> | Ref<RenderedElementType>[] | undefined;
  props?: object | object[] | undefined;
  stateAttrMap?: StateAttrMap<State> | undefined;
}

function resolveStyle<State>(
  style: CSSProperties | ((state: State) => CSSProperties | undefined) | undefined,
  state: State
): CSSProperties | undefined {
  return isFunction(style) ? style(state) : style;
}

function getElementRef(element: ReactElement): Ref<unknown> | undefined {
  // React 19+ uses element.props.ref, older versions use element.ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elementAny = element as any;

  return elementAny.ref ?? elementAny.props?.ref;
}

/**
 * React 19 passes `ref` to function components as a prop. React 18 and Preact compat only deliver it through
 * `forwardRef`, so a plain function used as a render target needs wrapping there.
 */
const REF_AS_PROP = Number.parseInt(version, 10) >= 19;
const REACT_MEMO_TYPE = Symbol.for('react.memo');

/** What a React element's `type` can be: an intrinsic tag name or a component. */
type ComponentOrTag = ReactElement['type'];
type UnknownProps = Record<string, unknown>;

/** The runtime shape of a `memo()` result. */
interface MemoComponent {
  readonly type: ComponentOrTag;
  readonly compare?: ((prev: Readonly<UnknownProps>, next: Readonly<UnknownProps>) => boolean) | undefined;
}

/** Original component, or memo wrapper, to the ref-forwarding component created for it. */
const refForwardingCache = new WeakMap<object, ComponentOrTag>();

function isPlainFunctionComponent(type: unknown): type is FunctionComponent<UnknownProps> {
  if (!isFunction(type) || '$$typeof' in type) return false;

  const prototype: unknown = type.prototype;

  return !(isObject(prototype) && 'isReactComponent' in prototype);
}

function isMemoComponent(type: unknown): type is object & MemoComponent {
  return isObject(type) && '$$typeof' in type && type.$$typeof === REACT_MEMO_TYPE;
}

/** Wrap a plain function component in `forwardRef` so it receives `ref` inside its props, as it would on React 19. */
function withForwardedRef(component: FunctionComponent<UnknownProps>): ComponentOrTag {
  const cached = refForwardingCache.get(component);
  if (cached) return cached;

  const ForwardedComponent = forwardRef<unknown, UnknownProps>((props, ref) => {
    // SAFETY: a render target is invoked synchronously during render, so it cannot be an async component.
    return component({ ...props, ref }) as ReactNode;
  });

  if (__DEV__) ForwardedComponent.displayName = component.displayName ?? component.name;

  refForwardingCache.set(component, ForwardedComponent);

  return ForwardedComponent;
}

/**
 * Resolve the type to create a render element with so the host's composed ref reaches it. Intrinsic tags, classes, and
 * `forwardRef` components already accept refs. Plain function components, bare or wrapped in `memo`, only do on
 * renderers with ref-as-prop and are wrapped otherwise.
 */
function ensureRefForwarding(type: ComponentOrTag): ComponentOrTag {
  if (REF_AS_PROP) return type;

  if (isPlainFunctionComponent(type)) return withForwardedRef(type);

  if (!isMemoComponent(type) || !isPlainFunctionComponent(type.type)) return type;

  const cached = refForwardingCache.get(type);
  if (cached) return cached;

  // SAFETY: the wrapper is a forwardRef component, which `memo` accepts wherever a function component is expected.
  const forwarded = memo(withForwardedRef(type.type) as FunctionComponent<UnknownProps>, type.compare);

  refForwardingCache.set(type, forwarded);

  return forwarded;
}

function mergeRefs<T>(...refs: (Ref<T> | Ref<T>[] | undefined)[]): Ref<T> | undefined {
  const flatRefs = refs.flat().filter((ref): ref is Ref<T> => ref !== null && ref !== undefined);
  if (flatRefs.length === 0) return undefined;

  if (flatRefs.length === 1) return flatRefs[0];

  return composeRefs(...flatRefs);
}

/**
 * Render a UI component element.
 *
 * Handles: - Default tag rendering - Render prop (element or function) - Props merging (event handlers chained,
 * className concatenated, style merged) - Ref composition - className/style as functions of state
 *
 * @example
 *   ```tsx
 *   return renderElement('button', componentProps, {
 *     state,
 *     ref: [forwardedRef, buttonRef],
 *     props: [{ type: 'button' }, elementProps, getButtonProps],
 *   });
 *   ```;
 *
 * @public
 */
export function renderElement<
  State extends object,
  RenderedElementType extends Element,
  TagName extends IntrinsicTagName,
>(
  element: TagName,
  componentProps: UseRenderComponentProps<State>,
  params: UseRenderParameters<State, RenderedElementType>
): ReactElement | null {
  const { className: classNameProp, style: styleProp, render } = componentProps;
  const { state, ref, props, stateAttrMap } = params;

  // Resolve className and style if they're functions
  const className = resolveClassName(classNameProp, state);
  const style = resolveStyle(styleProp, state);

  // Generate data attributes only when a component explicitly opts in with a
  // mapping. State is still passed to render/className/style callbacks.
  const stateDataAttrs = stateAttrMap ? getStateDataAttrs(state, stateAttrMap) : {};

  // Merge: state data attrs first, then props (so props can override)
  const propsArray = Array.isArray(props) ? props : props ? [props] : [];
  const mergedProps = mergeProps(stateDataAttrs, ...(propsArray as Record<string, unknown>[]));

  if (className !== undefined) {
    // Add resolved className and style
    mergedProps.className = mergedProps.className ? `${mergedProps.className} ${className}` : className;
  }

  if (style !== undefined) {
    mergedProps.style = mergedProps.style ? { ...(mergedProps.style as CSSProperties), ...style } : style;
  }

  if (isFunction(render)) {
    // Render function: call with props and state
    const mergedRef = mergeRefs(ref, mergedProps.ref);

    return render({ ...mergedProps, ref: mergedRef } as HTMLProps, state);
  }

  if (isValidElement(render)) {
    const elementRef = getElementRef(render);

    const mergedRef = mergeRefs(ref, mergedProps.ref, elementRef);

    const elementProps = mergeProps(mergedProps, render.props as Record<string, unknown>);

    elementProps.ref = mergedRef;

    const type = ensureRefForwarding(render.type);
    if (type === render.type) return cloneElement(render, elementProps);

    if (render.key != null) elementProps.key = render.key;

    return createElement(type, elementProps);
  }

  // Default tag
  const mergedRef = mergeRefs(ref, mergedProps.ref);

  mergedProps.ref = mergedRef;

  return createElement(element, mergedProps);
}

export namespace renderElement {
  export type ComponentProps<State> = UseRenderComponentProps<State>;
  export type Parameters<State, RenderedElementType extends Element> = UseRenderParameters<State, RenderedElementType>;
}
