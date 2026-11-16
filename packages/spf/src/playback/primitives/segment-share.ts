/**
 * In-flight segment sharing between two loaders that fetch the same URL — the video loader and an audio loader
 * extracting the audio carried in the video's segments. The video side publishes each segment while its fetch is in
 * flight; the audio side takes the published bytes instead of requesting them again, waiting briefly for a publish that
 * is about to happen. Every published key is remembered so a late taker (an audio switch back to the carried rendition,
 * long after the video passed that position) fetches straight from the HTTP cache rather than waiting.
 *
 * One network request per segment is also what keeps the bandwidth estimate honest: only the publishing fetch samples,
 * and a cache-served response never reaches it.
 */
export interface SegmentShare {
  /** Publish a segment's bytes under its key while the fetch is in flight; a rejected fetch withdraws it. */
  publish(key: string, bytes: Promise<Uint8Array>): void;
  /**
   * The bytes published under the key: already in flight, or published within `waitMs`. `undefined` when the key was
   * published and taken before, when the publish failed, or when none arrives in time.
   */
  take(key: string, waitMs: number): Promise<Uint8Array | undefined>;
  /** Whether the key has ever been published. */
  published(key: string): boolean;
}

/** `keep` bounds the untaken entries held after their fetch completes (each is a whole segment). */
export function createSegmentShare({ keep = 4 }: { keep?: number } = {}): SegmentShare {
  const entries = new Map<string, Promise<Uint8Array>>();
  const history = new Set<string>();
  const waiters = new Map<string, Set<() => void>>();

  const remember = (key: string) => {
    history.add(key);

    if (history.size > 1000) history.delete(history.keys().next().value!);
  };

  const withdraw = (key: string, bytes: Promise<Uint8Array>) => {
    if (entries.get(key) === bytes) entries.delete(key);
  };

  /** Resolves `true` when the key is published within `waitMs`, `false` when the wait runs out. */
  const awaitPublish = (key: string, waitMs: number) =>
    new Promise<boolean>((resolve) => {
      const set = waiters.get(key) ?? new Set();
      const timer = setTimeout(() => {
        set.delete(settle);
        resolve(false);
      }, waitMs);
      const settle = () => {
        clearTimeout(timer);
        resolve(true);
      };

      set.add(settle);
      waiters.set(key, set);
    });

  return {
    publish(key, bytes) {
      entries.set(key, bytes);
      remember(key);
      bytes.catch(() => withdraw(key, bytes));

      if (entries.size > keep) entries.delete(entries.keys().next().value!);

      const pending = waiters.get(key);

      waiters.delete(key);
      pending?.forEach((settle) => settle());
    },

    async take(key, waitMs) {
      let entry = entries.get(key);

      if (!entry && !history.has(key) && (await awaitPublish(key, waitMs))) entry = entries.get(key);

      if (!entry) return undefined;

      try {
        return await entry;
      } catch {
        return undefined;
      } finally {
        withdraw(key, entry);
      }
    },

    published: (key) => history.has(key),
  };
}
