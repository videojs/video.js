/** JavaScript the page has loaded so far. */
export interface ScriptBytes {
  /** Gzipped size, measured in the page so caching and the host's compression don't change it. */
  gzip: number;
  /** Size as served, before compression. */
  raw: number;
  files: number;
}

// Excludes media requests: HLS segments end in `.ts` too, but they're fetched, not imported.
const SCRIPT_PATH = /\.(?:[cm]?js|jsx|tsx?)$/;

function isScript(entry: PerformanceResourceTiming): boolean {
  if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') return false;

  return entry.initiatorType === 'script' || SCRIPT_PATH.test(new URL(entry.name).pathname);
}

// Resource Timing can't size a file the browser revalidated (a 304 reports 0 body bytes), so each script is fetched
// again, from the cache, and gzipped here.
async function measure(url: string): Promise<{ gzip: number; raw: number } | null> {
  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) return null;

    const body = await response.arrayBuffer();
    const gzipped = await new Response(
      new Blob([body]).stream().pipeThrough(new CompressionStream('gzip'))
    ).arrayBuffer();

    return { gzip: gzipped.byteLength, raw: body.byteLength };
  } catch {
    // Cross-origin scripts without CORS can't be read.
    return null;
  }
}

/**
 * Calls `onChange` with the JavaScript loaded so far, and again each time more loads. Scripts inside embed iframes
 * aren't seen, and cross-origin scripts served without CORS aren't counted.
 */
export function observeScriptBytes(onChange: (bytes: ScriptBytes) => void): () => void {
  const bytes: ScriptBytes = { gzip: 0, raw: 0, files: 0 };
  const seen = new Set<string>();
  let active = true;

  // A dev server serves every module as its own file, more than the default 250-entry buffer holds.
  performance.setResourceTimingBufferSize(5000);

  const observer = new PerformanceObserver((list) => {
    // SAFETY: the observer only observes `resource` entries.
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      if (!isScript(entry) || seen.has(entry.name)) continue;

      seen.add(entry.name);
      void measure(entry.name).then((size) => {
        if (!active || !size) return;

        bytes.gzip += size.gzip;
        bytes.raw += size.raw;
        bytes.files++;
        onChange({ ...bytes });
      });
    }
  });

  observer.observe({ type: 'resource', buffered: true });
  onChange({ ...bytes });

  return () => {
    active = false;
    observer.disconnect();
  };
}

export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

/** A one-line summary, with what loaded since `since` when given. */
export function describeScriptBytes(bytes: ScriptBytes, since?: ScriptBytes): string {
  const total = `${formatKilobytes(bytes.gzip)} gzip (${formatKilobytes(bytes.raw)} minified), ${bytes.files} files`;

  if (!since) return total;

  return `${total} (+${formatKilobytes(bytes.gzip - since.gzip)} gzip since the last source change)`;
}
