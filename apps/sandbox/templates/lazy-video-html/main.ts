import '@app/styles.css';
// <lazy-video> resolves `src` to a media element and loads only that element's code.
// http://localhost:5173/lazy-video-html/
//
// Switch sources and watch the JavaScript total: an MP4 loads no engine, and each other source loads one chunk.
// Light mode (`?light`) shows a poster and a play button, and loads no Video.js code until play is pressed.
import {
  LAZY_DEMO_CLASSES as c,
  EMBED_PAYLOADS_MEASURED_AT,
  getEmbedPayload,
  getUrlLazySource,
  getUrlLight,
  LAZY_VIDEO_SOURCE_GROUPS,
  LAZY_VIDEO_SOURCES,
  setUrlLazyState,
} from '@app/shared/lazy-sources';
import { describeLightStart, LIGHT_START_TIMEOUT, PLAY_ICON_PATH } from '@app/shared/light-mode';
import {
  type EmbedPayload,
  formatKilobytes,
  groupScriptBytes,
  observeScriptBytes,
  type ScriptBytes,
  summarizeScriptBytes,
} from '@app/shared/script-bytes';
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
      <dt class="${c.statLabel}" id="script-label">JavaScript loaded</dt>
      <dd class="${c.statValue}" id="script-total"></dd>
      <dd class="${c.statDetail}" id="script-detail"></dd>
    </div>
    <div class="${c.card} ${c.stat}">
      <dt class="${c.statLabel}">Since last source change</dt>
      <dd class="${c.statValue}" id="script-since">—</dd>
      <dd class="${c.statDetail}">gzip</dd>
    </div>
  </dl>
  <section class="${c.card}" aria-label="JavaScript by package" id="script-breakdown"></section>
`;

const stage = root.querySelector<HTMLElement>('#stage')!;
const lightToggle = root.querySelector<HTMLInputElement>('#light')!;
const lightStatus = root.querySelector('#light-status')!;
const buttons = root.querySelectorAll<HTMLButtonElement>('button[data-src]');
const srcOutput = root.querySelector<HTMLElement>('#src')!;
const resolved = root.querySelector('#resolved')!;
const scriptLabel = root.querySelector('#script-label')!;
const scriptTotal = root.querySelector('#script-total')!;
const scriptBreakdown = root.querySelector('#script-breakdown')!;
const scriptDetail = root.querySelector('#script-detail')!;
const scriptSince = root.querySelector('#script-since')!;

let scriptBytes: ScriptBytes = { gzip: 0, raw: 0, files: 0, packages: {} };
let sourceChangedAt: ScriptBytes | undefined;
let src = initialSrc;
let lazyVideo: HTMLElement | null = null;

const SHOWN_PACKAGES = 6;

// An embed's own download only counts once it renders, not while light mode shows the poster.
function currentEmbed(): EmbedPayload | undefined {
  return lazyVideo?.firstElementChild ? getEmbedPayload(src) : undefined;
}

function renderScriptBreakdown() {
  const embed = currentEmbed();
  const groups = groupScriptBytes(scriptBytes, embed);
  const total = groups.reduce((sum, { gzip }) => sum + gzip, 0);
  const caption = embed
    ? `gzip, each script split by its packages · embed measured ${EMBED_PAYLOADS_MEASURED_AT}, as transferred`
    : 'gzip, each script split by its packages';

  scriptBreakdown.innerHTML = html`
    <div class="${c.breakdownHeader}">
      <h2 class="${c.statLabel}">JavaScript by package</h2>
      <p class="${c.statDetail}">${groups.length ? caption : 'Per-package sizes need a production build.'}</p>
    </div>
    ${
      groups.length
        ? html`
            <div class="${c.breakdownBar}" aria-hidden="true">
              ${groups
                .map(
                  ({ id, gzip }) =>
                    html`<span class="${c.groupColor[id]}" style="width: ${(gzip / total) * 100}%"></span>`
                )
                .join('')}
            </div>
            <div class="${c.breakdownGroups}">
              ${groups
                .map(
                  ({ id, label, gzip, packages }) => html`
                    <div>
                      <p class="${c.breakdownGroup}">
                        <span class="${c.breakdownSwatch} ${c.groupColor[id]}" aria-hidden="true"></span>
                        ${label}
                        <span class="${c.breakdownSize}">${formatKilobytes(gzip)}</span>
                      </p>
                      <ul class="${c.breakdownPackages}">
                        ${packages
                          .slice(0, SHOWN_PACKAGES)
                          .map(
                            ({ name, gzip: size }) =>
                              html`<li class="${c.breakdownPackage}">
                                <span>${name}</span><span>${formatKilobytes(size)}</span>
                              </li>`
                          )
                          .join('')}
                        ${packages.length > SHOWN_PACKAGES ? html`<li>+${packages.length - SHOWN_PACKAGES} more</li>` : ''}
                      </ul>
                    </div>
                  `
                )
                .join('')}
            </div>
          `
        : ''
    }
  `;
}

function renderScriptBytes() {
  const { label, total, detail, sinceChange } = summarizeScriptBytes(scriptBytes, sourceChangedAt, currentEmbed());

  scriptLabel.textContent = label;
  scriptTotal.textContent = total;
  scriptDetail.textContent = detail;
  scriptSince.textContent = sinceChange ?? '—';
  renderScriptBreakdown();
}

observeScriptBytes((bytes) => {
  scriptBytes = bytes;
  renderScriptBytes();
});

let light = getUrlLight();
let clickedAt: number | undefined;
let startedAt: number | undefined;
let timedOut = false;
let timeout: ReturnType<typeof setTimeout> | undefined;
let cleanup = () => {};

lightToggle.checked = light;

function renderLightStatus() {
  lightStatus.textContent = light ? describeLightStart(clickedAt, startedAt, timedOut) : '';
}

// The player, skin, and `<lazy-video>` are one chunk: loaded at once outside light mode, and on play in light mode.
const loadPlayer = () => import('./player');
// Counts renders, so a player that finishes loading after a newer render doesn't mount.
let generation = 0;

function renderStage() {
  const poster = LAZY_VIDEO_SOURCES.find((source) => source.src === src)?.poster;
  const current = ++generation;

  cleanup();
  cleanup = () => {};
  resolved.textContent = '(none)';
  lazyVideo = null;
  renderScriptBytes();

  if (light && clickedAt === undefined) {
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

  // The poster stays up while the player loads.
  stage.innerHTML = html`
    <div class="${c.placeholder}">${poster ? html`<img class="${c.facadeImage}" src="${poster}" alt="" />` : ''}</div>
  `;
  renderLightStatus();

  void loadPlayer().then(() => {
    if (current === generation) mountPlayer(poster);
  });
}

function mountPlayer(poster: string | undefined) {
  stage.innerHTML = html`
    <video-player${poster ? ` poster="${poster}"` : ''}>
      <video-skin class="sandbox-video-frame">
        <lazy-video src="${src}" playsinline crossorigin${light ? ' autoplay' : ''}></lazy-video>
      </video-skin>
    </video-player>
  `;

  const media = stage.querySelector('lazy-video')!;
  const { store } = stage.querySelector<VideoPlayerElement>('video-player')!;
  const observer = new MutationObserver(() => {
    const child = media.firstElementChild;

    resolved.textContent = child ? `<${child.localName}>` : '(none)';
    renderScriptBytes();
  });

  observer.observe(media, { childList: true });
  lazyVideo = media;
  renderScriptBytes();

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

// Start fetching the player when play looks likely, so less of it loads after the click.
for (const type of ['pointerover', 'focusin']) {
  root.addEventListener(type, (event) => {
    if (event.target instanceof Element && event.target.closest('[data-light-play]')) void loadPlayer();
  });
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
