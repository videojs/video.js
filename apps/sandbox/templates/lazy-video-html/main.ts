import '@app/styles.css';
// <lazy-video> resolves `src` to a media element and loads only that element's code.
// http://localhost:5173/lazy-video-html/
//
// Switch sources and watch the JavaScript total: an MP4 loads no engine, and each other source loads one chunk.
// Light mode (`?light`) shows a poster and a play button, and loads nothing until play is pressed.
import '@videojs/html/video/player';
import '@videojs/html/video/skin';
import '@videojs/html/video/skin.css';
import '@videojs/html/media/lazy-video';
import {
  LAZY_DEMO_CLASSES as c,
  getUrlLazySource,
  getUrlLight,
  LAZY_VIDEO_SOURCE_GROUPS,
  LAZY_VIDEO_SOURCES,
  setUrlLazyState,
} from '@app/shared/lazy-sources';
import { describeLightStart, LIGHT_START_TIMEOUT, PLAY_ICON_PATH } from '@app/shared/light-mode';
import { observeScriptBytes, type ScriptBytes, summarizeScriptBytes } from '@app/shared/script-bytes';
import type { VideoPlayerElement } from '@videojs/html/video';

const html = String.raw;
const root = document.getElementById('root')!;
const initialSrc = getUrlLazySource().src;

root.innerHTML = html`
  <header class="${c.header}">
    <h1 class="${c.title}">Lazy video</h1>
    <p class="${c.lede}">
      <code>&lt;lazy-video&gt;</code> picks the media element for its <code>src</code> and loads only that element's
      code.
    </p>
  </header>
  <div id="stage"></div>
  <section class="${c.card}" aria-label="Source">
    <div class="${c.light}">
      <label class="${c.lightToggle}"><input type="checkbox" id="light" /> Light mode</label>
      <p class="${c.lightStatus}" id="light-status"></p>
    </div>
    <div class="${c.groups}">
      ${LAZY_VIDEO_SOURCE_GROUPS.map(
        ({ label, sources }) => html`
          <div role="group" aria-label="${label}">
            <p class="${c.groupLabel}" aria-hidden="true">${label}</p>
            <div class="${c.buttons}">
              ${sources
                .map(
                  ({ label, src }) =>
                    html`<button
                      type="button"
                      class="${c.button}"
                      data-src="${src}"
                      aria-pressed="${src === initialSrc}"
                    >
                      ${label}
                    </button>`
                )
                .join('')}
            </div>
          </div>
        `
      ).join('')}
    </div>
    <p class="${c.src}" id="src" title="${initialSrc}">${initialSrc}</p>
  </section>
  <dl class="${c.stats}">
    <div class="${c.card} ${c.stat}">
      <dt class="${c.statLabel}">Resolved media</dt>
      <dd class="${c.statCode}" id="resolved">(none)</dd>
    </div>
    <div class="${c.card} ${c.stat}">
      <dt class="${c.statLabel}">JavaScript loaded</dt>
      <dd class="${c.statValue}" id="script-total"></dd>
      <dd class="${c.statDetail}" id="script-detail"></dd>
    </div>
    <div class="${c.card} ${c.stat}">
      <dt class="${c.statLabel}">Since last source change</dt>
      <dd class="${c.statValue}" id="script-since">—</dd>
      <dd class="${c.statDetail}">gzip</dd>
    </div>
  </dl>
`;

const stage = root.querySelector<HTMLElement>('#stage')!;
const lightToggle = root.querySelector<HTMLInputElement>('#light')!;
const lightStatus = root.querySelector('#light-status')!;
const buttons = root.querySelectorAll<HTMLButtonElement>('button[data-src]');
const srcOutput = root.querySelector<HTMLElement>('#src')!;
const resolved = root.querySelector('#resolved')!;
const scriptTotal = root.querySelector('#script-total')!;
const scriptDetail = root.querySelector('#script-detail')!;
const scriptSince = root.querySelector('#script-since')!;

let scriptBytes: ScriptBytes = { gzip: 0, raw: 0, files: 0 };
let sourceChangedAt: ScriptBytes | undefined;

function renderScriptBytes() {
  const { total, detail, sinceChange } = summarizeScriptBytes(scriptBytes, sourceChangedAt);

  scriptTotal.textContent = total;
  scriptDetail.textContent = detail;
  scriptSince.textContent = sinceChange ?? '—';
}

observeScriptBytes((bytes) => {
  scriptBytes = bytes;
  renderScriptBytes();
});

let src = initialSrc;
let light = getUrlLight();
let clickedAt: number | undefined;
let startedAt: number | undefined;
let timedOut = false;
let timeout: ReturnType<typeof setTimeout> | undefined;
let lazyVideo: HTMLElement | null = null;
let cleanup = () => {};

lightToggle.checked = light;

function renderLightStatus() {
  lightStatus.textContent = light ? describeLightStart(clickedAt, startedAt, timedOut) : '';
}

function renderStage() {
  const poster = LAZY_VIDEO_SOURCES.find((source) => source.src === src)?.poster;

  cleanup();
  resolved.textContent = '(none)';

  if (light && clickedAt === undefined) {
    lazyVideo = null;
    stage.innerHTML = html`
      <button type="button" class="${c.facade}" aria-label="Play video" data-light-play>
        ${poster ? html`<img class="${c.facadeImage}" src="${poster}" alt="" />` : ''}
        <span class="${c.facadePlay}">
          <svg class="${c.facadeIcon}" viewBox="0 0 24 24" aria-hidden="true"><path d="${PLAY_ICON_PATH}" /></svg>
        </span>
      </button>
    `;
    renderLightStatus();
    return;
  }

  // After the click in light mode, `preload="auto"`: hls.js doesn't let `autoplay` override `preload="none"`.
  stage.innerHTML = html`
    <video-player${poster ? ` poster="${poster}"` : ''}>
      <video-skin class="sandbox-video-frame">
        <lazy-video src="${src}" playsinline crossorigin${light ? ' autoplay preload="auto"' : ''}></lazy-video>
      </video-skin>
    </video-player>
  `;

  const media = stage.querySelector('lazy-video')!;
  const { store } = stage.querySelector<VideoPlayerElement>('video-player')!;
  const observer = new MutationObserver(() => {
    const child = media.firstElementChild;

    resolved.textContent = child ? `<${child.localName}>` : '(none)';
  });

  observer.observe(media, { childList: true });
  lazyVideo = media;

  // In light mode, report how long after the click playback started, if it did.
  const unsubscribe = light
    ? store.subscribe(() => {
        if (!store.state.started || startedAt !== undefined) return;

        startedAt = performance.now();
        renderLightStatus();
      })
    : () => {};

  cleanup = () => {
    observer.disconnect();
    unsubscribe();
  };
  renderLightStatus();
}

function resetLight() {
  clearTimeout(timeout);
  clickedAt = undefined;
  startedAt = undefined;
  timedOut = false;
}

lightToggle.addEventListener('change', () => {
  light = lightToggle.checked;
  setUrlLazyState({ light });

  resetLight();
  renderStage();
});

root.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;

  if (target?.closest('[data-light-play]')) {
    clickedAt = performance.now();
    timeout = setTimeout(() => {
      timedOut = true;
      renderLightStatus();
    }, LIGHT_START_TIMEOUT);
    renderStage();
    return;
  }

  const button = target?.closest<HTMLButtonElement>('button[data-src]');
  const next = button?.dataset.src;
  if (!button || !next) return;

  for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));

  src = next;
  setUrlLazyState({ src: next });
  srcOutput.textContent = next;
  srcOutput.title = next;
  sourceChangedAt = scriptBytes;
  renderScriptBytes();

  // Outside light mode the same `<lazy-video>` swaps its media in place.
  if (lazyVideo && !light) {
    lazyVideo.setAttribute('src', next);
    return;
  }

  resetLight();
  renderStage();
});

renderStage();
