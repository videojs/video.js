/** JavaScript the page has downloaded so far, from Resource Timing. */
export interface ScriptBytes {
  /** Bytes over the network, compressed. A cached file counts as 0. */
  transferred: number;
  /** Bytes after decompression. */
  decoded: number;
  files: number;
}

// Excludes media requests: HLS segments end in `.ts` too, but they're fetched, not imported.
const SCRIPT_PATH = /\.(?:[cm]?js|jsx|tsx?)$/;

function isScript(entry: PerformanceResourceTiming): boolean {
  if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') return false;

  return entry.initiatorType === 'script' || SCRIPT_PATH.test(new URL(entry.name).pathname);
}

/**
 * Calls `onChange` with the JavaScript downloaded so far, and again each time more loads. Cross-origin scripts served
 * without `Timing-Allow-Origin` count as 0 bytes, and scripts inside embed iframes aren't seen at all.
 */
export function observeScriptBytes(onChange: (bytes: ScriptBytes) => void): () => void {
  const bytes: ScriptBytes = { transferred: 0, decoded: 0, files: 0 };

  // A dev server serves every module as its own file, more than the default 250-entry buffer holds.
  performance.setResourceTimingBufferSize(5000);

  const observer = new PerformanceObserver((list) => {
    // SAFETY: the observer only observes `resource` entries.
    const scripts = (list.getEntries() as PerformanceResourceTiming[]).filter(isScript);
    if (!scripts.length) return;

    for (const entry of scripts) {
      bytes.transferred += entry.transferSize;
      bytes.decoded += entry.decodedBodySize;
      bytes.files++;
    }

    onChange({ ...bytes });
  });

  observer.observe({ type: 'resource', buffered: true });
  onChange({ ...bytes });

  return () => observer.disconnect();
}

export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

/** A one-line summary, with what loaded since `since` when given. */
export function describeScriptBytes(bytes: ScriptBytes, since?: ScriptBytes): string {
  const total = `${formatKilobytes(bytes.transferred)} transferred, ${formatKilobytes(bytes.decoded)} decoded, ${bytes.files} files`;

  if (!since) return total;

  return `${total} (+${formatKilobytes(bytes.transferred - since.transferred)} since the last source change)`;
}
