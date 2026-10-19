// SPF DRM smoke — the shared Mux DRM source through the standard HLS engine.
// http://localhost:5173/spf-drm/
//
// Supported query params:
//   drm=widevine|playready|fairplay   Configure only that key system, forcing
//                                     its negotiation on browsers with several
//                                     CDMs (Edge on Windows has Widevine AND
//                                     PlayReady; unfiltered, Widevine wins).
//   source=<SOURCES key>              Any entry, DRM or clear; defaults to
//                                     `hls-drm`. `hls-drm-ezdrm` is the second
//                                     FairPlay provider the AirPlay smoke
//                                     wants, and a clear entry like `hls-3` is
//                                     the control for telling WebKit's own
//                                     AirPlay behavior apart from DRM's.
import { restrictDrmSystems, SOURCES } from '@app/shared/sources';
import type { DrmSystemsConfig } from '@videojs/spf/hls';
import { createHlsVideoEngine } from '@videojs/spf/hls';

const video = document.getElementById('video') as HTMLVideoElement;
const statusPre = document.getElementById('status') as HTMLPreElement;
const heading = document.getElementById('heading') as HTMLHeadingElement;
const subheading = document.getElementById('subheading') as HTMLParagraphElement;

const params = new URLSearchParams(location.search);

// The generic license-server flavor of the shared Mux DRM asset by default.
const sourceKey = params.get('source') ?? 'hls-drm';
const entry = SOURCES[sourceKey as keyof typeof SOURCES];

// A DRM entry carries a structured `source`; a clear one carries only `url`.
// Both are wanted here — a clear source is the control that separates WebKit's
// own AirPlay handoff from anything DRM does.
const source = (restrictDrmSystems(
  entry?.source as { src: string; drm?: DrmSystemsConfig } | undefined,
  params.get('drm')
) ?? (entry?.url ? { src: entry.url } : undefined)) as { src: string; drm?: DrmSystemsConfig } | undefined;

if (!source) {
  const known = Object.keys(SOURCES).join(', ');

  document.body.innerHTML = `<h1>Unknown source</h1><p><code>${sourceKey}</code> names no entry with a URL.</p><p>Known keys: ${known}</p>`;
  throw new Error(`[spf-drm] no source for "${sourceKey}"`);
}

// Say which source and which key systems are actually loaded — the page serves
// every DRM entry, so a fixed title just misreports whatever `?source=` picked.
const drmFilter = params.get('drm');

heading.textContent = `SPF DRM — ${entry?.label ?? sourceKey}`;
subheading.textContent = [
  `source=${sourceKey}`,
  `configured: ${Object.keys(source.drm ?? {}).join(', ') || 'none (clear source)'}`,
  drmFilter ? `drm=${drmFilter}` : null,
]
  .filter(Boolean)
  .join('  ·  ');

const engine = createHlsVideoEngine({ drm: source.drm });

// preload before mediaElement: syncPreload reads the element's attribute when
// it first appears in context.
video.preload = 'auto';
engine.context.mediaElement.set(video);
engine.state.presentation.set({ url: source.src });

// Raw key-request tap, deliberately unfiltered — `setupAirPlayFairPlay` serves
// only `encrypted` events whose `initDataType` is `skd`, so a receiver whose
// request arrives any other way would be dropped with nothing to show for it.
// This says what actually fired. `webkitneedkey` is the one the legacy
// `WebKitMediaKeys` path serves after the handover, so seeing it alongside a
// `skd` `encrypted` is the normal shape on a sender whose EME refuses the
// session.
for (const type of ['encrypted', 'webkitneedkey'] as const) {
  video.addEventListener(type, (event) => {
    const { initDataType, initData } = event as MediaEncryptedEvent;

    console.log(`[spf-drm] ${type}`, {
      initDataType: initDataType ?? '(none — legacy API)',
      initDataBytes: initData?.byteLength,
      wireless: (video as { webkitCurrentPlaybackTargetIsWireless?: boolean }).webkitCurrentPlaybackTargetIsWireless,
    });
  });
}

video.addEventListener('error', () => console.log('[spf-drm] element error', video.error?.code, video.error?.message));

// Live status readout for the smoke probes (rendering, not just readyState).
//
// `mseKeys` vs `elementKeys` is the AirPlay handoff's invariant, readable at a
// glance. `mseKeys` is what `setupMediaKeys` published; `elementKeys` is
// whatever is actually attached. Outside a session they agree. During one the
// pair should read `false` / `true` — `setupMediaKeys` has yielded and
// `setupAirPlayFairPlay` is serving the receiver. `false` / `false` with a
// stalled `currentTime` means the receiver asked for nothing, or asked and was
// refused; check `errors`.

/** The DRM/AirPlay facts. Split out because these change on edges, not per frame. */
const drmSnapshot = () => ({
  // WebKit's raw flag, then the session fact `setupAirPlay` derives from it.
  wireless: (video as { webkitCurrentPlaybackTargetIsWireless?: boolean }).webkitCurrentPlaybackTargetIsWireless,
  loadingSuspended: engine.state.loadingSuspended?.get(),
  segmentLoadingBlocked: engine.state.segmentLoadingBlocked.get(),
  negotiatedKeySystem: engine.state.negotiatedKeySystem.get(),
  mseKeys: Boolean(engine.context.mediaKeys.get()),
  elementKeys: Boolean(video.mediaKeys),
  // Resource selection takes the `<source>` children in order, and the engine
  // *prepends* the MediaSource blob while `setupAirPlay` *appends* the
  // native-HLS fallback. So any `load()` while a dead blob is still first
  // selects it — which is what `WebKitBlobResource error 1` is. Listing them
  // says whether that was possible at each transition.
  sources: [...video.querySelectorAll('source')].map((el) =>
    el.src.startsWith('blob:') ? 'blob(mse)' : el.src.endsWith('.m3u8') ? 'hls(fallback)' : el.src.slice(0, 24)
  ),
  errors: engine.state.errors.get()?.map((error) => error.code),
});

// An AirPlay pass is run at the device, not at the keyboard, and the live pane
// below repaints out from under a selection. So every *change* to the DRM facts
// is also logged — the console keeps a copyable transition log, and the
// interesting moments here are all edges.
let lastDrm = '';

setInterval(() => {
  const quality = video.getVideoPlaybackQuality?.();
  const drm = drmSnapshot();
  const serialized = JSON.stringify(drm);

  if (serialized !== lastDrm) {
    lastDrm = serialized;
    // Source list and errors go in the *message*, not the object: Safari's
    // console collapses object tails behind a `…`, and these are exactly the
    // fields worth reading when something has gone wrong.
    console.log(
      `[spf-drm] t=${video.currentTime.toFixed(2)} sources=[${drm.sources.join(' ')}] errors=[${(drm.errors ?? []).join(' ')}]`,
      drm
    );
  }

  statusPre.textContent = JSON.stringify(
    {
      readyState: video.readyState,
      currentTime: video.currentTime.toFixed(2),
      videoSize: `${video.videoWidth}x${video.videoHeight}`,
      framesDecoded: quality?.totalVideoFrames,
      framesDropped: quality?.droppedVideoFrames,
      ...drm,
    },
    null,
    2
  );
}, 500);

// One-time capability probe, harness-only and separate from the engine's own
// negotiation. The readout says which key system was negotiated but not at which
// robustness tier, and on Android that tier is the whole question: L1 accepts
// `HW_SECURE_ALL`, which is the rung the ladder leads with and the one no
// desktop CDM in the matrix reaches. Logged once at load.
void (async () => {
  const tiers = ['HW_SECURE_ALL', 'HW_SECURE_DECODE', 'HW_SECURE_CRYPTO', 'SW_SECURE_DECODE', 'SW_SECURE_CRYPTO', ''];
  const systems = ['com.widevine.alpha', 'com.microsoft.playready', 'com.apple.fps'];
  const accepted: Record<string, string[]> = {};

  for (const keySystem of systems) {
    for (const robustness of tiers) {
      try {
        await navigator.requestMediaKeySystemAccess(keySystem, [
          {
            initDataTypes: keySystem === 'com.apple.fps' ? ['skd', 'sinf', 'cenc'] : ['cenc'],
            videoCapabilities: [
              {
                contentType:
                  keySystem === 'com.apple.fps' ? 'application/vnd.apple.mpegurl' : 'video/mp4; codecs="avc1.4d401f"',
                robustness,
              },
            ],
          },
        ]);
        (accepted[keySystem] ??= []).push(robustness || '(unstamped)');
      } catch {
        // Refused — not a failure, just not a tier this CDM holds.
      }
    }
  }

  console.log('[spf-drm] CDM robustness tiers accepted:', accepted);
})();

Object.assign(window as object, { engine, video });
