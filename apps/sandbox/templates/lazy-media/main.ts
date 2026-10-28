import '@app/styles.css';
// `LazyVideo` and `LazyAudio` resolve `src` to a media component and load only that component's code.
// http://localhost:5173/lazy-media/
//
// Framework (`?framework=react`) renders them with React instead of the HTML custom elements, and kind
// (`?kind=audio`) renders `LazyAudio` instead of `LazyVideo`. The page itself uses neither framework, and changing
// either reloads it, so the JavaScript total only counts what that combination ships.
//
// Switch sources and watch the JavaScript total: a file loads no engine, and each other source loads one chunk.
// Light mode (`?light`) shows a poster and a play button, and loads no Video.js code until play is pressed.
// Autoplay (`?autoplay`) sets `autoplay` on the media, which light mode always does once play is pressed.
// Muted (`?muted`) starts the media muted, which browsers require before most autoplay.
// Preload (`?preload=metadata` or `auto`) sets `preload` on the lazy media. Without it the media plays
// `preload="none"`: files and streams fetch nothing, and embeds build no frame, until play.
import {
  LAZY_DEMO_CLASSES as c,
  EMBED_PAYLOADS_MEASURED_AT,
  findLazySource,
  getEmbedPayload,
  getUrlAutoplay,
  getUrlFramework,
  getUrlKind,
  getUrlLazySource,
  getUrlLight,
  getUrlMuted,
  getUrlPreload,
  LAZY_FRAMEWORKS,
  LAZY_KINDS,
  LAZY_PRELOADS,
  LAZY_SOURCE_GROUPS,
  type LazyFramework,
  type LazyKind,
  type LazyPlayer,
  type MountLazyPlayer,
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

// One module per framework and kind, each a chunk of its own: loaded at once outside light mode, and on play in light
// mode.
const PLAYER_LOADERS = {
  'html-video': () => import('./players/html-video'),
  'html-audio': () => import('./players/html-audio'),
  'react-video': () => import('./players/react-video'),
  'react-audio': () => import('./players/react-audio'),
} satisfies Record<`${LazyFramework}-${LazyKind}`, () => Promise<{ mount: MountLazyPlayer }>>;

const FRAMEWORK_LABELS = { html: 'HTML', react: 'React' } satisfies Record<LazyFramework, string>;
const KIND_LABELS = { video: 'Video', audio: 'Audio' } satisfies Record<LazyKind, string>;
const COMPONENT_NAMES = {
  html: { video: '<lazy-video>', audio: '<lazy-audio>' },
  react: { video: '<LazyVideo>', audio: '<LazyAudio>' },
} satisfies Record<LazyFramework, Record<LazyKind, string>>;

const html = String.raw;
const root = document.getElementById('root')!;
const framework = getUrlFramework();
const kind = getUrlKind();
const loadPlayer = PLAYER_LOADERS[`${framework}-${kind}`];
const initialSrc = getUrlLazySource(kind).src;

function escapeText(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function segmented<Value extends string>(
  name: string,
  values: readonly Value[],
  labels: Record<Value, string>,
  current: Value
) {
  return html`
    <div class="${c.segmented}" role="group" aria-label="${name}">
      ${values
        .map(
          (value) =>
            html`<button
              type="button"
              class="${c.segment}"
              data-${name.toLowerCase()}="${value}"
              aria-pressed="${value === current}"
            >
              ${labels[value]}
            </button>`
        )
        .join('')}
    </div>
  `;
}

root.innerHTML = html`
  <header class="${c.header}">
    <h1 class="${c.title}">Lazy media</h1>
    <p class="${c.lede}">
      <code>${escapeText(COMPONENT_NAMES[framework][kind])}</code> picks the media component for its
      <code>src</code> and loads only that component's code.
    </p>
    <div class="mt-2 flex flex-wrap gap-2">
      ${segmented('Framework', LAZY_FRAMEWORKS, FRAMEWORK_LABELS, framework)}
      ${segmented('Kind', LAZY_KINDS, KIND_LABELS, kind)}
    </div>
  </header>
  <div id="stage"></div>
  <section class="${c.card}" aria-label="Source">
    <div class="${c.light}">
      <label class="${c.lightToggle}"><input type="checkbox" id="light" /> Light mode</label>
      <label class="${c.lightToggle}"><input type="checkbox" id="autoplay" /> Autoplay</label>
      <label class="${c.lightToggle}"><input type="checkbox" id="muted" /> Muted</label>
      <label class="${c.lightToggle}">
        Preload
        <select class="${c.select}" id="preload">
          ${LAZY_PRELOADS.map(
            (value) => html`<option value="${value}">${value === 'none' ? 'none (default)' : value}</option>`
          ).join('')}
        </select>
      </label>
      <p class="${c.lightStatus}" id="light-status"></p>
    </div>
    <div class="${c.groups}">
      ${LAZY_SOURCE_GROUPS[kind]
        .map(
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
        )
        .join('')}
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
const autoplayToggle = root.querySelector<HTMLInputElement>('#autoplay')!;
const mutedToggle = root.querySelector<HTMLInputElement>('#muted')!;
const preloadSelect = root.querySelector<HTMLSelectElement>('#preload')!;
const lightStatus = root.querySelector('#light-status')!;
const buttons = root.querySelectorAll<HTMLButtonElement>('button[data-src]');
const srcOutput = root.querySelector<HTMLElement>('#src')!;
const resolvedOutput = root.querySelector('#resolved')!;
const scriptLabel = root.querySelector('#script-label')!;
const scriptTotal = root.querySelector('#script-total')!;
const scriptBreakdown = root.querySelector('#script-breakdown')!;
const scriptDetail = root.querySelector('#script-detail')!;
const scriptSince = root.querySelector('#script-since')!;

let scriptBytes: ScriptBytes = { gzip: 0, raw: 0, files: 0, packages: {} };
let sourceChangedAt: ScriptBytes | undefined;
let src = initialSrc;
let player: LazyPlayer | null = null;
let resolved: string | null = null;
let embedFetching = false;

const SHOWN_PACKAGES = 6;

// An embed's own download only counts once it starts: not while light mode shows the poster, and not while
// `preload="none"` holds its frame back until play.
function currentEmbed(): EmbedPayload | undefined {
  return resolved && embedFetching ? getEmbedPayload(kind, src) : undefined;
}

function waitingEmbed(): EmbedPayload | undefined {
  return resolved && !embedFetching ? getEmbedPayload(kind, src) : undefined;
}

function renderScriptBreakdown() {
  const embed = currentEmbed();
  const waiting = waitingEmbed();
  const groups = groupScriptBytes(scriptBytes, embed);
  const total = groups.reduce((sum, { gzip }) => sum + gzip, 0);
  const caption = embed
    ? `gzip, each script split by its packages · embed measured ${EMBED_PAYLOADS_MEASURED_AT}, as transferred`
    : waiting
      ? `gzip, each script split by its packages · the ${waiting.label} embed loads nothing until play`
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
  const { label, total, detail, sinceChange } = summarizeScriptBytes(
    scriptBytes,
    sourceChangedAt,
    currentEmbed(),
    waitingEmbed()
  );

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
let autoplay = getUrlAutoplay();
let muted = getUrlMuted();
let preload = getUrlPreload();
let clickedAt: number | undefined;
let startedAt: number | undefined;
let timedOut = false;
let timeout: ReturnType<typeof setTimeout> | undefined;

lightToggle.checked = light;
mutedToggle.checked = muted;
preloadSelect.value = preload;

// Light mode autoplays once play is pressed, so the checkbox has no say there.
function renderAutoplayToggle() {
  autoplayToggle.checked = autoplay || light;
  autoplayToggle.disabled = light;
}

renderAutoplayToggle();

function renderLightStatus() {
  lightStatus.textContent = light ? describeLightStart(clickedAt, startedAt, timedOut) : '';
}

function posterOf(source: string): string | undefined {
  return findLazySource(kind, source)?.poster;
}

function posterImage(poster: string | undefined): string {
  return poster ? html`<img class="${c.facadeImage}" src="${poster}" alt="" />` : '';
}

const playIcon = html`<svg class="${c.facadeIcon}" viewBox="0 0 24 24" aria-hidden="true">
  <path d="${PLAY_ICON_PATH}" />
</svg>`;

function facade(poster: string | undefined): string {
  if (kind === 'audio') {
    return html`
      <button type="button" class="${c.audioFacade}" aria-label="Play audio" data-light-play>
        <span class="${c.audioFacadePlay}">${playIcon}</span>
        Play
      </button>
    `;
  }

  return html`
    <button type="button" class="${c.facade}" aria-label="Play video" data-light-play>
      ${posterImage(poster)}
      <span class="${c.facadePlay}">${playIcon}</span>
    </button>
  `;
}

function placeholder(poster: string | undefined): string {
  return kind === 'audio'
    ? html`<div class="${c.audioPlaceholder}"></div>`
    : html`<div class="${c.placeholder}">${posterImage(poster)}</div>`;
}

// Counts renders, so a player that finishes loading after a newer render doesn't mount.
let generation = 0;

function setResolved(description: string | null) {
  resolved = description;
  resolvedOutput.textContent = description ?? '(none)';
  renderScriptBytes();
}

function renderStage() {
  const poster = posterOf(src);
  const current = ++generation;

  player?.destroy();
  player = null;
  embedFetching = false;
  setResolved(null);

  if (light && clickedAt === undefined) {
    stage.innerHTML = facade(poster);
    renderLightStatus();
    return;
  }

  // The poster stays up while the player loads.
  stage.innerHTML = placeholder(poster);
  renderLightStatus();

  void loadPlayer().then(({ mount }) => {
    if (current !== generation) return;

    player = mount(stage, {
      src,
      poster,
      autoplay: light || autoplay,
      muted,
      preload,
      onResolved: setResolved,
      onEmbedFetching(fetching) {
        embedFetching = fetching;
        renderScriptBytes();
      },
      onStarted() {
        // In light mode, report how long after the click playback started, if it did.
        if (!light || startedAt !== undefined) return;

        startedAt = performance.now();
        renderLightStatus();
      },
    });
  });
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
  renderAutoplayToggle();

  resetLight();
  renderStage();
});

// `autoplay`, `muted`, and `preload` are read once, as the media loads, so the player mounts again with the new setting.
autoplayToggle.addEventListener('change', () => {
  autoplay = autoplayToggle.checked;
  setUrlLazyState({ autoplay });

  resetLight();
  renderStage();
});

mutedToggle.addEventListener('change', () => {
  muted = mutedToggle.checked;
  setUrlLazyState({ muted });

  resetLight();
  renderStage();
});

preloadSelect.addEventListener('change', () => {
  preload = LAZY_PRELOADS.find((value) => value === preloadSelect.value) ?? 'none';
  setUrlLazyState({ preload });

  resetLight();
  renderStage();
});

root.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const choice = target?.closest<HTMLButtonElement>('button[data-framework], button[data-kind]');

  // Code a framework or kind loaded can't be unloaded, so the page reloads to count only the new combination's.
  if (choice) {
    if (choice.getAttribute('aria-pressed') === 'true') return;

    setUrlLazyState({
      framework: LAZY_FRAMEWORKS.find((value) => value === choice.dataset.framework),
      kind: LAZY_KINDS.find((value) => value === choice.dataset.kind),
    });
    location.reload();
    return;
  }

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

  // Outside light mode the same lazy media swaps its media in place, as an app changing `src` does.
  if (player && !light) {
    player.setSource(next, posterOf(next));
    return;
  }

  resetLight();
  renderStage();
});

renderStage();
