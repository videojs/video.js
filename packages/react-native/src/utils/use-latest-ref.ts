import { useRef } from 'react';

export function useLatestRef<Value>(value: Value): Readonly<{ current: Value }> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export namespace useLatestRef {
  export type Result<Value> = Readonly<{ current: Value }>;
}
