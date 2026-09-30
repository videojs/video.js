'use client';

import type { PopupGroup } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

const PopupGroupContext = createContext<PopupGroup | undefined>(undefined);

export function PopupGroupProvider({ value, children }: { value: PopupGroup; children: ReactNode }): ReactNode {
  return <PopupGroupContext.Provider value={value}>{children}</PopupGroupContext.Provider>;
}

export function useOptionalPopupGroup(): PopupGroup | undefined {
  return useContext(PopupGroupContext);
}
