'use client';

import type { StateAttrMap } from '@videojs/core';
import type { ForwardRefExoticComponent } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '@/utils/types';

import type { renderElement as renderElementFn } from '../utils/use-render';
import { renderElement } from '../utils/use-render';

interface ContextPartConfig<Props extends object, State extends object> {
  displayName: string;
  tag: keyof React.JSX.IntrinsicElements;
  useContext: () => { state: State; stateAttrMap: StateAttrMap<State> };
  staticProps?: Partial<Props>;
  /** Derive props from state on each render (e.g. `id` from a state field). */
  getProps?: (state: State) => Record<string, unknown>;
}

export function createContextPart<Props extends UIComponentProps<any, any>, State extends object>(
  config: ContextPartConfig<Props, State>
): ForwardRefExoticComponent<Props> {
  const { displayName, tag, useContext, staticProps, getProps } = config;

  const Component = forwardRef<HTMLElement, Props>(function ContextPart(componentProps, forwardedRef) {
    const { render, className, style, ...elementProps } = componentProps;
    const context = useContext();
    const dynamicProps = getProps?.(context.state);

    return renderElement(tag, { render, className, style } as renderElementFn.ComponentProps<State>, {
      state: context.state,
      stateAttrMap: context.stateAttrMap,
      ref: forwardedRef,
      props: [staticProps, dynamicProps, elementProps].filter(Boolean),
    });
  });

  Component.displayName = displayName;

  return Component as ForwardRefExoticComponent<Props>;
}
