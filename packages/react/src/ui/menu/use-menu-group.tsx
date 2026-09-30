'use client';

import { type ReactElement, useCallback, useMemo, useState } from 'react';

import { MenuGroupContextProvider } from './context';

interface MenuGroupProviderProps {
  children: (labelId: string | undefined) => ReactElement | null;
}

interface MenuGroupElementProps {
  'aria-label'?: unknown;
  'aria-labelledby'?: unknown;
}

function hasExplicitLabel(elementProps: MenuGroupElementProps): boolean {
  return elementProps['aria-label'] !== undefined || elementProps['aria-labelledby'] !== undefined;
}

export function getMenuGroupProps(
  labelId: string | undefined,
  elementProps: MenuGroupElementProps
): { role: 'group'; 'aria-labelledby'?: string | undefined } {
  return {
    role: 'group',
    'aria-labelledby': hasExplicitLabel(elementProps) ? undefined : labelId,
  };
}

export function MenuGroupProvider({ children }: MenuGroupProviderProps): ReactElement | null {
  const [labelId, setLabelId] = useState<string>();

  const registerLabel = useCallback((id: string) => {
    setLabelId(id);

    return () => {
      setLabelId((current) => (current === id ? undefined : current));
    };
  }, []);

  const value = useMemo(() => ({ registerLabel }), [registerLabel]);

  return <MenuGroupContextProvider value={value}>{children(labelId)}</MenuGroupContextProvider>;
}
