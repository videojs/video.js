'use client';

import { TooltipGroupCore, type TooltipGroupProps } from '@videojs/core';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { TooltipGroupContextProvider } from './group-context';

export interface TooltipProviderProps extends TooltipGroupProps {
  children?: ReactNode;
}

export function TooltipProvider({ delay, closeDelay, timeout, children }: TooltipProviderProps): ReactNode {
  const [group] = useState(() => new TooltipGroupCore({ delay, closeDelay, timeout }));

  group.setProps({ delay, closeDelay, timeout });

  return <TooltipGroupContextProvider value={{ group }}>{children}</TooltipGroupContextProvider>;
}

export namespace TooltipProvider {
  export type Props = TooltipProviderProps;
}
