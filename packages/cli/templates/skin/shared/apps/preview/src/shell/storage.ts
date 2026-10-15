import { storageKey } from './config';

/** Storage can be blocked or full; every read falls back and every write is best effort. */
export function readStored<Value>(key: string, fallback: Value): Value {
  try {
    const value = localStorage.getItem(`${storageKey}:${key}`);

    return value === null ? fallback : (JSON.parse(value) as Value);
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(`${storageKey}:${key}`, JSON.stringify(value));
  } catch {
    // The value still applies for this visit.
  }
}
