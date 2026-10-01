import { isNumber, isObject, isString } from '../predicate';

/** @internal */
export interface EventLike {
  type: string;
  timeStamp: number;
  isTrusted?: boolean;
}

/**
 * Check if a value looks like an Event (has type and timeStamp).
 *
 * Works with DOM Events, React SyntheticEvents, and RN events.
 *
 * @internal
 */
export function isEventLike(value: unknown): value is EventLike {
  return (
    isObject(value) && 'type' in value && isString(value.type) && 'timeStamp' in value && isNumber(value.timeStamp)
  );
}
