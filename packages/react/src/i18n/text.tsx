'use client';

import type { ComponentProps, ReactNode } from 'react';

import { useTranslator } from './context';

/** @internal */
export interface TextProps extends Omit<ComponentProps<'span'>, 'children'> {
  children?: ReactNode;
  token?: string | undefined;
}

/**
 * Renders translated compiler text through a native React span.
 *
 * @internal
 */
export function Text({ children, token, ...props }: TextProps) {
  const t = useTranslator();
  const fallback = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;

  return <span {...props}>{token ? t({ key: token, text: fallback ?? token }) : children}</span>;
}
