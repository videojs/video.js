'use client';

import { useReducer } from 'react';

export function useForceRender() {
  const [, forceRender] = useReducer((c: number) => c + 1, 0);

  return forceRender;
}

export namespace useForceRender {
  export type Result = () => void;
}
