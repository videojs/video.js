/** JavaScript the page has loaded so far. */
export interface ScriptBytes {
  /** Gzipped size, measured in the page so caching and the host's compression don't change it. */
  gzip: number;
  /** Size as served, before compression. */
  raw: number;
  files: number;
  /**
   * Gzipped size per package, estimated by splitting each script by its packages' share of the rendered code. Empty
   * without the build's `chunk-packages.json`, such as on the dev server.
   */
  packages: Record<string, number>;
}

/** Rendered bytes per package for each built chunk, keyed by its path, written by the sandbox build. */
type ChunkPackages = Record<string, Record<string, number>>;

async function loadChunkPackages(): Promise<ChunkPackages | null> {
  try {
    const response = await fetch('/chunk-packages.json');

    // SAFETY: the sandbox build writes this file with the `ChunkPackages` shape.
    return response.ok ? ((await response.json()) as ChunkPackages) : null;
  } catch {
    return null;
  }
}

// Excludes media requests: HLS segments end in `.ts` too, but they're fetched, not imported.
const SCRIPT_PATH = /\.(?:[cm]?js|jsx|tsx?)$/;

// Only the page's own scripts: what an embed's service serves, in its iframe or as an SDK in the page, is measured
// separately (`embed-payloads.json`), since cross-origin frames keep their requests private.
function isScript(entry: PerformanceResourceTiming): boolean {
  if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') return false;

  const url = new URL(entry.name);

  return url.origin === location.origin && (entry.initiatorType === 'script' || SCRIPT_PATH.test(url.pathname));
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
  const bytes: ScriptBytes = { gzip: 0, raw: 0, files: 0, packages: {} };
  const seen = new Set<string>();
  const chunkPackages = loadChunkPackages();
  let active = true;

  function attribute(url: string, gzip: number, chunks: ChunkPackages) {
    const sizes = chunks[new URL(url).pathname.slice(1)] ?? { unknown: 1 };
    const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);

    for (const [name, size] of Object.entries(sizes)) {
      bytes.packages[name] = (bytes.packages[name] ?? 0) + (gzip * size) / total;
    }
  }

  // A dev server serves every module as its own file, more than the default 250-entry buffer holds.
  performance.setResourceTimingBufferSize(5000);

  const observer = new PerformanceObserver((list) => {
    // SAFETY: the observer only observes `resource` entries.
    for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
      if (!isScript(entry) || seen.has(entry.name)) continue;

      seen.add(entry.name);
      void Promise.all([measure(entry.name), chunkPackages]).then(([size, chunks]) => {
        if (!active || !size) return;

        bytes.gzip += size.gzip;
        bytes.raw += size.raw;
        bytes.files++;

        if (chunks) attribute(entry.name, size.gzip, chunks);

        onChange({ ...bytes, packages: { ...bytes.packages } });
      });
    }
  });

  observer.observe({ type: 'resource', buffered: true });
  onChange({ ...bytes, packages: {} });

  return () => {
    active = false;
    observer.disconnect();
  };
}

export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

export type ScriptGroupId = 'videojs' | 'dependencies' | 'react' | 'sandbox' | 'embed';

/** What an embed downloads from its service, measured outside the page. */
export interface EmbedPayload {
  label: string;
  /** Bytes as transferred, including headers. */
  scripts: number;
  total: number;
}

export interface ScriptGroup {
  id: ScriptGroupId;
  label: string;
  gzip: number;
  /** Largest first. */
  packages: { name: string; gzip: number }[];
}

const SCRIPT_GROUP_LABELS = {
  videojs: 'Video.js',
  dependencies: 'Engines and dependencies',
  react: 'React',
  sandbox: 'Sandbox',
  embed: 'Embed, from its service',
} satisfies Record<ScriptGroupId, string>;

const REACT_PACKAGES: ReadonlySet<string> = new Set([
  'react',
  'react-dom',
  'scheduler',
  'react-compiler-runtime',
  'use-sync-external-store',
]);

function groupOf(name: string): ScriptGroupId {
  if (name === '@videojs/sandbox' || name === 'virtual' || name === 'unknown' || name === 'vite') return 'sandbox';

  if (name.startsWith('@videojs/')) return 'videojs';

  return REACT_PACKAGES.has(name) ? 'react' : 'dependencies';
}

/**
 * The JavaScript loaded, grouped by where it comes from, plus the embed's measured payload when given. Empty without
 * per-package sizes.
 */
export function groupScriptBytes(bytes: ScriptBytes, embed?: EmbedPayload): ScriptGroup[] {
  const groups = new Map<ScriptGroupId, ScriptGroup>();

  for (const id of ['videojs', 'dependencies', 'react', 'sandbox'] as const) {
    groups.set(id, { id, label: SCRIPT_GROUP_LABELS[id], gzip: 0, packages: [] });
  }

  for (const [name, gzip] of Object.entries(bytes.packages)) {
    const group = groups.get(groupOf(name))!;

    group.gzip += gzip;
    group.packages.push({ name, gzip });
  }

  const sorted = [...groups.values()]
    .filter((group) => group.gzip > 0)
    .map((group) => ({ ...group, packages: group.packages.sort((a, b) => b.gzip - a.gzip) }));
  if (!sorted.length || !embed) return sorted;

  return [
    ...sorted,
    {
      id: 'embed',
      label: SCRIPT_GROUP_LABELS.embed,
      gzip: embed.total,
      packages: [
        { name: `${embed.label} scripts`, gzip: embed.scripts },
        { name: 'HTML, styles, images, and fonts', gzip: embed.total - embed.scripts },
      ],
    },
  ];
}

/** Video.js packages and the engines and dependencies they load: what a page using Video.js pays for. */
function videojsBytes(bytes: ScriptBytes): number {
  return groupScriptBytes(bytes)
    .filter(({ id }) => id === 'videojs' || id === 'dependencies')
    .reduce((sum, { gzip }) => sum + gzip, 0);
}

/**
 * The JavaScript loaded, formatted for display, with what loaded since `since` when given. With per-package sizes the
 * headline counts only Video.js and the engines and dependencies it loads; without them, everything. The dev server
 * serves each module unbundled and untransformed for production, so its totals say so rather than pass for shipped
 * sizes. `embed` is an embed downloading from its service; `waitingEmbed` is one that downloads nothing until play.
 */
export function summarizeScriptBytes(
  bytes: ScriptBytes,
  since?: ScriptBytes,
  embed?: EmbedPayload,
  waitingEmbed?: EmbedPayload
) {
  const grouped = Object.keys(bytes.packages).length > 0;
  const headline = grouped ? videojsBytes(bytes) : bytes.gzip;
  const sinceHeadline = since && (grouped ? videojsBytes(since) : since.gzip);
  const embedNote = embed
    ? `plus ${formatKilobytes(embed.total)} from the embed`
    : waitingEmbed && `the embed's ${formatKilobytes(waitingEmbed.total)} waits for play`;
  const parts = grouped
    ? ['with engines', `${formatKilobytes(bytes.gzip)} total on the page`]
    : import.meta.env.DEV
      ? [`${bytes.files} unbundled dev modules, not shipped sizes`]
      : [`${formatKilobytes(bytes.raw)} as served`, `${bytes.files} files`];

  return {
    label: grouped ? 'Video.js loaded' : import.meta.env.DEV ? 'JavaScript loaded (dev server)' : 'JavaScript loaded',
    total: formatKilobytes(headline),
    detail: ['gzip', ...parts, ...(embedNote ? [embedNote] : [])].join(' · '),
    sinceChange: sinceHeadline === undefined ? null : `+${formatKilobytes(headline - sinceHeadline)}`,
  };
}
