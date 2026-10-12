import { stat } from 'node:fs/promises';

export interface FileCache<Value> {
  /** The value for `key`, loaded again when a file it was built from has changed since it loaded. */
  get(key: string): Promise<Value>;
}

interface CachedValue<Value> {
  readonly value: Value;
  readonly versions: Map<string, number>;
}

/**
 * Cache values built from files. A value's `watchFiles` may grow after it loads, as a Tailwind design system's do while
 * it compiles; files it gains are stamped when first seen. A failed load is not cached, so fixing the file recovers.
 */
export function createFileCache<Value>(
  load: (key: string) => Promise<Value>,
  watchFiles: (value: Value) => Iterable<string>
): FileCache<Value> {
  const entries = new Map<string, Promise<CachedValue<Value>>>();

  const loadEntry = (key: string): Promise<CachedValue<Value>> => {
    const loading = load(key).then(async (value) => ({ value, versions: await fileVersions(watchFiles(value)) }));

    entries.set(key, loading);
    loading.catch(() => {
      if (entries.get(key) === loading) entries.delete(key);
    });

    return loading;
  };

  return {
    async get(key) {
      const cached = entries.get(key);
      if (!cached) return (await loadEntry(key)).value;

      const entry = await cached;
      if (await isCurrent(entry, watchFiles(entry.value))) return entry.value;

      return (await loadEntry(key)).value;
    },
  };
}

export async function fileVersions(files: Iterable<string>): Promise<Map<string, number>> {
  return new Map(await Promise.all([...files].map(async (file) => [file, (await stat(file)).mtimeMs] as const)));
}

async function isCurrent<Value>(entry: CachedValue<Value>, files: Iterable<string>): Promise<boolean> {
  try {
    for (const file of files) {
      const mtimeMs = (await stat(file)).mtimeMs;
      const version = entry.versions.get(file);

      if (version === undefined) entry.versions.set(file, mtimeMs);
      else if (version !== mtimeMs) return false;
    }

    return true;
  } catch {
    return false;
  }
}
