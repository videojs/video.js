import '@app/styles.css';
// <lazy-video> resolves `src` to a media element and loads only that element's code.
// http://localhost:5173/lazy-video-html/
//
// Switch sources and watch the JavaScript total: an MP4 loads no engine, and each other source loads one chunk.
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/video/skin.css';
import '@videojs/html/media/lazy-video';
import { LAZY_VIDEO_SOURCES } from '@app/shared/lazy-sources';
import { describeScriptBytes, observeScriptBytes, type ScriptBytes } from '@app/shared/script-bytes';

const html = String.raw;
const root = document.getElementById('root')!;

root.innerHTML = html`
  <video-player>
    <video-skin class="sandbox-video-frame">
      <lazy-video src="${LAZY_VIDEO_SOURCES[0].src}" playsinline crossorigin></lazy-video>
    </video-skin>
  </video-player>
  <div class="flex flex-wrap gap-2" role="group" aria-label="Source">
    ${LAZY_VIDEO_SOURCES.map(
      ({ label, src }) =>
        html`<button type="button" class="rounded border px-3 py-1" data-src="${src}">${label}</button>`
    ).join('')}
  </div>
  <p class="text-sm">Resolved media: <code id="resolved"></code></p>
  <p class="text-sm">JavaScript loaded: <output id="script-bytes"></output></p>
`;

const lazyVideo = root.querySelector('lazy-video')!;
const resolved = root.querySelector('#resolved')!;
const scriptBytesOutput = root.querySelector('#script-bytes')!;

let scriptBytes: ScriptBytes = { transferred: 0, decoded: 0, files: 0 };
let sourceChangedAt: ScriptBytes | undefined;

function renderScriptBytes() {
  scriptBytesOutput.textContent = describeScriptBytes(scriptBytes, sourceChangedAt);
}

observeScriptBytes((bytes) => {
  scriptBytes = bytes;
  renderScriptBytes();
});

root.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('button') : null;
  if (!button?.dataset.src) return;

  sourceChangedAt = scriptBytes;
  renderScriptBytes();
  lazyVideo.src = button.dataset.src;
});

new MutationObserver(() => {
  resolved.textContent = lazyVideo.firstElementChild?.localName ?? '(none)';
}).observe(lazyVideo, { childList: true });
