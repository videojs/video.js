import '@app/styles.css';
// SPF HLS Background Video — sandbox demo
// http://localhost:5173/spf-hls-background-video/
//
// Drives `HlsBackgroundVideoAdapterCore` directly, one layer below the
// `<hls-background-video>` element. The diagnostic strip surfaces three signals
// reviewers should verify:
//   - loadActivated is true from frame 0 (no preload-gate or play-event needed)
//   - the picker pins the largest rendition the manifest offers
//   - audio-side actors are absent from the engine context (subtraction proof)
//
// The adapter has no cap of its own, so the rendition list is read-only: it shows
// the available tracks and highlights the one the picker chose. Narrowing the set
// is the manifest's job — pick a source whose URL caps it. Reload tears the adapter
// down and builds a new one, which is the only way to re-run resolution against a
// URL that is already playing.
import { SOURCES } from '@app/shared/sources';
import { effect, snapshot } from '@videojs/spf';
import { HlsBackgroundVideoAdapterCore } from '@videojs/spf/hls-background-video';
import type { EngineState } from '@videojs/spf/hls/background-video';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const video = document.getElementById('bg-video') as HTMLVideoElement;
const sourceSelect = document.getElementById('source-select') as HTMLSelectElement;
const renditionButtons = document.getElementById('rendition-buttons') as HTMLDivElement;
const loadBtn = document.getElementById('load-btn') as HTMLButtonElement;

const diagLoad = document.getElementById('diag-load') as HTMLSpanElement;
const diagRendition = document.getElementById('diag-rendition') as HTMLSpanElement;
const diagContext = document.getElementById('diag-context') as HTMLSpanElement;

// ── Source picker ─────────────────────────────────────────────────────────────
// The SPF MSE pipeline appends fMP4/CMAF segments directly (no MPEG-TS
// transmuxing), so only fMP4 HLS sources play — exclude `.ts` and live. A source
// with no plain `url` needs a structured source this demo has no way to hand
// over (DRM, for one), so it is out too.
const HLS_SOURCE_IDS = (Object.keys(SOURCES) as Array<keyof typeof SOURCES>).filter((id) => {
  const source = SOURCES[id];

  return source.type === 'hls' && source.subType === 'mp4' && !source.live && Boolean(source.url);
});
const DEFAULT_ID = (HLS_SOURCE_IDS[0] ?? 'hls-1') as keyof typeof SOURCES;

for (const id of HLS_SOURCE_IDS) {
  const option = document.createElement('option');

  option.value = id;
  option.textContent = SOURCES[id].label;

  if (id === DEFAULT_ID) option.selected = true;

  sourceSelect.appendChild(option);
}

// ── Renditions ────────────────────────────────────────────────────────────────
type MaybePresentation = EngineState['presentation'];

function videoTracksOf(presentation: MaybePresentation) {
  return presentation?.selectionSets?.find((s) => s.type === 'video')?.switchingSets[0]?.tracks ?? [];
}

type VideoTrack = ReturnType<typeof videoTracksOf>[number];

// Sandbox-local stable rendition id. The engine regenerates track ids on every
// parse, so a captured engine id is dead after a rebuild — this survives.
function stableTrackId(track: VideoTrack): string {
  const w = 'width' in track && typeof track.width === 'number' ? track.width : 0;
  const h = 'height' in track && typeof track.height === 'number' ? track.height : 0;

  return `${w}x${h}@${track.bandwidth}`;
}

function trackDimensions(track: VideoTrack): { w: number; h: number } {
  const w = 'width' in track && typeof track.width === 'number' ? track.width : 0;
  const h = 'height' in track && typeof track.height === 'number' ? track.height : 0;

  return { w, h };
}

// ── Adapter lifecycle ─────────────────────────────────────────────────────────
let currentSourceId: keyof typeof SOURCES = DEFAULT_ID;
let adapter!: HlsBackgroundVideoAdapterCore;
let stopDiag: () => void = () => {};

function rebuildAdapter(): void {
  // Pause before teardown so the in-flight play() doesn't reject with
  // AbortError when the next engine swaps the MediaSource on this element.
  video.pause();
  adapter?.destroy();

  adapter = new HlsBackgroundVideoAdapterCore();
  // src before attach: the engine starts resolving the presentation before
  // play() (called inside attach) runs, so no teardown races the play promise.
  adapter.src = SOURCES[currentSourceId].url ?? '';
  adapter.attach(video);

  (window as any).adapter = adapter;
  stopDiag();
  stopDiag = attachDiagnostic();
}

// `state` / `context` read `adapter` lazily — the `let` binding always
// resolves to the current instance after a rebuild.
(window as any).state = () => snapshot(adapter.engine.state);
(window as any).context = () => snapshot(adapter.engine.context);

// The diagnostic effect re-fires on every state change (currentTime ticks,
// segment loads), but the list only depends on the track set + the
// current selection. Skip DOM rebuild when neither changed.
let lastRenditionSignature = '';

rebuildAdapter();

sourceSelect.addEventListener('change', () => {
  currentSourceId = sourceSelect.value as keyof typeof SOURCES;
  rebuildAdapter();
});

loadBtn.addEventListener('click', () => {
  // A full rebuild rather than a src reassignment: the setter early-returns on the
  // URL already playing, so reassigning the same one would do nothing.
  rebuildAdapter();
});

// ── Diagnostic strip + rendition picker ──────────────────────────────────────
function formatBandwidth(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;

  return `${Math.round(bps / 1000)} Kbps`;
}

function attachDiagnostic(): () => void {
  return effect(() => {
    const state = snapshot(adapter.engine.state);
    const context = snapshot(adapter.engine.context);

    diagLoad.textContent = state.loadActivated ? 'true' : 'false';
    diagLoad.className = `val ${state.loadActivated ? 'ok' : ''}`;

    const tracks = videoTracksOf(state.presentation);
    const selected = tracks.find((t) => t.id === state.selectedVideoTrackId);

    if (selected) {
      const { w, h } = trackDimensions(selected);
      const res = w && h ? `${w}x${h} ` : '';

      diagRendition.textContent = `${res}${formatBandwidth(selected.bandwidth)}`;
      diagRendition.className = 'val ok';
    } else {
      diagRendition.textContent = '—';
      diagRendition.className = 'val';
    }

    // List the context keys present at runtime — the absence of any audio-side
    // actor key is the visible subtraction proof.
    const keys = Object.keys(context).filter((k) => (context as Record<string, unknown>)[k] !== undefined);

    diagContext.textContent = keys.length ? keys.join(', ') : '—';

    renderRenditionList(tracks, state.selectedVideoTrackId);
  });
}

function renditionSignature(tracks: VideoTrack[], selectedId: string | undefined): string {
  return `${selectedId ?? '—'}#${tracks.map(stableTrackId).join(',')}`;
}

function renderRenditionList(tracks: VideoTrack[], selectedId: string | undefined): void {
  const signature = renditionSignature(tracks, selectedId);
  if (signature === lastRenditionSignature) return;

  lastRenditionSignature = signature;

  renditionButtons.innerHTML = '';

  if (tracks.length === 0) return;

  // Sort by area desc so the list reads top-down high-to-low.
  const sorted = [...tracks].sort((a, b) => {
    const da = trackDimensions(a);
    const db = trackDimensions(b);
    const areaA = da.w * da.h;
    const areaB = db.w * db.h;
    if (areaB !== areaA) return areaB - areaA;

    return b.bandwidth - a.bandwidth;
  });

  for (const track of sorted) {
    const { w, h } = trackDimensions(track);
    const row = document.createElement('div');

    row.className = 'rendition';
    const tier = h ? `${h}p` : '—';
    const dims = w && h ? ` · ${w}x${h}` : '';

    row.textContent = `${tier} - ${formatBandwidth(track.bandwidth)}${dims}`;
    row.title = stableTrackId(track);

    if (track.id === selectedId) row.classList.add('selected');

    renditionButtons.appendChild(row);
  }
}
