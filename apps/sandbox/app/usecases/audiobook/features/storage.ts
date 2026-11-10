import { isObject } from '@videojs/utils/predicate';

/** What JSON can carry, which is all a storage promises to give back. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** A JSON object rather than an array, string, or number: the shape a record is read back as. */
export function isJsonObject(value: JsonValue | null): value is { [key: string]: JsonValue } {
  return isObject(value) && !Array.isArray(value);
}

/**
 * Where a feature keeps what should outlive the page: a position, a note, a count. Small, JSON-shaped, keyed by string.
 * The features take one of these so tests can hand them memory instead of `localStorage`.
 */
export interface JsonStorage {
  read(key: string): JsonValue | null;
  write(key: string, value: JsonValue): void;
  remove(key: string): void;
}

/**
 * `localStorage` behind try/catch. Private windows, blocked site data, and server rendering all make the accessor or
 * its methods throw, and a player feature has nothing useful to do about that beyond carrying on without memory.
 */
export const localJsonStorage: JsonStorage = {
  read(key) {
    try {
      const raw = globalThis.localStorage?.getItem(key);

      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  write(key, value) {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // Nothing to do: the page simply forgets.
    }
  },
  remove(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Nothing to do.
    }
  },
};

/** A storage that lives as long as the object does. For tests and for pages that must not persist. */
export function createMemoryStorage(): JsonStorage & { readonly size: number } {
  const map = new Map<string, string>();

  return {
    get size() {
      return map.size;
    },
    read: (key) => {
      const raw = map.get(key);

      return raw ? JSON.parse(raw) : null;
    },
    write: (key, value) => void map.set(key, JSON.stringify(value)),
    remove: (key) => void map.delete(key),
  };
}
