import '@app/styles.css';
// <LazyVideo> resolves `src` to a media component and loads only that component's code.
// http://localhost:5173/lazy-video-react/
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
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// The player, skin, and `LazyVideo` are one chunk: loaded at once outside light mode, and on play in light mode.
const loadPlayer = () => import('./player');
const LazyPlayer = lazy(loadPlayer);

function LightFacade({ poster, onPlay }: { poster: string | undefined; onPlay: () => void }) {
  return (
    <button
      type="button"
      className={c.facade}
      aria-label="Play video"
      // Start fetching the player when play looks likely, so less of it loads after the click.
      onPointerEnter={loadPlayer}
      onFocus={loadPlayer}
      onClick={onPlay}
    >
      {poster && <img className={c.facadeImage} src={poster} alt="" />}
      <span className={c.facadePlay}>
        <svg className={c.facadeIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d={PLAY_ICON_PATH} />
        </svg>
      </span>
    </button>
  );
}

const SHOWN_PACKAGES = 6;

function ScriptBreakdown({ bytes, embed }: { bytes: ScriptBytes; embed: EmbedPayload | undefined }) {
  const groups = groupScriptBytes(bytes, embed);
  const total = groups.reduce((sum, { gzip }) => sum + gzip, 0);
  const caption = embed
    ? `gzip, each script split by its packages · embed measured ${EMBED_PAYLOADS_MEASURED_AT}, as transferred`
    : 'gzip, each script split by its packages';

  return (
    <section className={c.card} aria-label="JavaScript by package">
      <div className={c.breakdownHeader}>
        <h2 className={c.statLabel}>JavaScript by package</h2>
        <p className={c.statDetail}>{groups.length ? caption : 'Per-package sizes need a production build.'}</p>
      </div>
      {groups.length > 0 && (
        <>
          <div className={c.breakdownBar} aria-hidden="true">
            {groups.map(({ id, gzip }) => (
              <span key={id} className={c.groupColor[id]} style={{ width: `${(gzip / total) * 100}%` }} />
            ))}
          </div>
          <div className={c.breakdownGroups}>
            {groups.map(({ id, label, gzip, packages }) => (
              <div key={id}>
                <p className={c.breakdownGroup}>
                  <span className={`${c.breakdownSwatch} ${c.groupColor[id]}`} aria-hidden="true" />
                  {label}
                  <span className={c.breakdownSize}>{formatKilobytes(gzip)}</span>
                </p>
                <ul className={c.breakdownPackages}>
                  {packages.slice(0, SHOWN_PACKAGES).map(({ name, gzip: size }) => (
                    <li key={name} className={c.breakdownPackage}>
                      <span>{name}</span>
                      <span>{formatKilobytes(size)}</span>
                    </li>
                  ))}
                  {packages.length > SHOWN_PACKAGES && <li>+{packages.length - SHOWN_PACKAGES} more</li>}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function App() {
  const [src, setSrc] = useState(() => getUrlLazySource().src);
  const [light, setLight] = useState(getUrlLight);
  const [clickedAt, setClickedAt] = useState<number>();
  const [startedAt, setStartedAt] = useState<number>();
  const [timedOut, setTimedOut] = useState(false);
  const poster = LAZY_VIDEO_SOURCES.find((source) => source.src === src)?.poster;
  const showFacade = light && clickedAt === undefined;
  const [resolved, setResolved] = useState<string | null>(null);
  const [scriptBytes, setScriptBytes] = useState<ScriptBytes>({ gzip: 0, raw: 0, files: 0, packages: {} });
  const [sourceChangedAt, setSourceChangedAt] = useState<ScriptBytes>();
  // An embed's own download only counts once it renders, not while light mode shows the poster.
  const embed = resolved ? getEmbedPayload(src) : undefined;
  const { label, total, detail, sinceChange } = summarizeScriptBytes(scriptBytes, sourceChangedAt, embed);

  useEffect(() => observeScriptBytes(setScriptBytes), []);

  const onStarted = useCallback(() => setStartedAt((at) => at ?? performance.now()), []);

  useEffect(() => {
    if (clickedAt === undefined) return;

    const timeout = setTimeout(() => setTimedOut(true), LIGHT_START_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [clickedAt]);

  function startLight(at: number | undefined) {
    setClickedAt(at);
    setStartedAt(undefined);
    setTimedOut(false);
    setResolved(null);
  }

  return (
    <>
      <header className={c.header}>
        <h1 className={c.title}>Lazy video</h1>
        <p className={c.lede}>
          <code>{'<LazyVideo>'}</code> picks the media component for its <code>src</code> and loads only that
          component's code.
        </p>
      </header>
      {showFacade ? (
        <LightFacade poster={poster} onPlay={() => startLight(performance.now())} />
      ) : (
        // The poster stays up while the player loads.
        <Suspense
          fallback={
            <div className={c.placeholder}>{poster && <img className={c.facadeImage} src={poster} alt="" />}</div>
          }
        >
          <LazyPlayer src={src} poster={poster} light={light} onResolved={setResolved} onStarted={onStarted} />
        </Suspense>
      )}
      <section className={c.card} aria-label="Source">
        <div className={c.light}>
          <label className={c.lightToggle}>
            <input
              type="checkbox"
              checked={light}
              onChange={(event) => {
                setLight(event.target.checked);
                setUrlLazyState({ light: event.target.checked });
                startLight(undefined);
              }}
            />
            Light mode
          </label>
          {light && <p className={c.lightStatus}>{describeLightStart(clickedAt, startedAt, timedOut)}</p>}
        </div>
        <div className={c.groups}>
          {LAZY_VIDEO_SOURCE_GROUPS.map(({ label, sources }) => (
            <div key={label} role="group" aria-label={label}>
              <p className={c.groupLabel} aria-hidden="true">
                {label}
              </p>
              <div className={c.buttons}>
                {sources.map(({ label: optionLabel, src: option }) => (
                  <button
                    key={option}
                    type="button"
                    className={c.button}
                    aria-pressed={option === src}
                    onClick={() => {
                      setSourceChangedAt(scriptBytes);
                      setSrc(option);
                      setUrlLazyState({ src: option });

                      if (light) startLight(undefined);
                    }}
                  >
                    {optionLabel}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className={c.src} title={src}>
          {src}
        </p>
      </section>
      <dl className={c.stats}>
        <div className={`${c.card} ${c.stat}`}>
          <dt className={c.statLabel}>Resolved media</dt>
          <dd className={c.statCode}>{resolved ?? '(none)'}</dd>
        </div>
        <div className={`${c.card} ${c.stat}`}>
          <dt className={c.statLabel}>{label}</dt>
          <dd className={c.statValue}>{total}</dd>
          <dd className={c.statDetail}>{detail}</dd>
        </div>
        <div className={`${c.card} ${c.stat}`}>
          <dt className={c.statLabel}>Since last source change</dt>
          <dd className={c.statValue}>{sinceChange ?? '—'}</dd>
          <dd className={c.statDetail}>gzip</dd>
        </div>
      </dl>
      <ScriptBreakdown bytes={scriptBytes} embed={embed} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
