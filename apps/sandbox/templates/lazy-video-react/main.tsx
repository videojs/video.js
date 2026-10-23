import '@app/styles.css';
// <LazyVideo> resolves `src` to a media component and loads only that component's code.
// http://localhost:5173/lazy-video-react/
//
// Switch sources and watch the JavaScript total: an MP4 loads no engine, and each other source loads one chunk.
// Light mode (`?light`) shows a poster and a play button, and loads nothing until play is pressed.
import '@videojs/react/video/skin.css';
import {
  LAZY_DEMO_CLASSES as c,
  getUrlLazySource,
  getUrlLight,
  LAZY_VIDEO_SOURCE_GROUPS,
  LAZY_VIDEO_SOURCES,
  setUrlLazyState,
} from '@app/shared/lazy-sources';
import { describeLightStart, LIGHT_START_TIMEOUT, PLAY_ICON_PATH } from '@app/shared/light-mode';
import {
  formatKilobytes,
  groupScriptBytes,
  observeScriptBytes,
  type ScriptBytes,
  summarizeScriptBytes,
} from '@app/shared/script-bytes';
import type { Media } from '@videojs/media';
import { LazyVideo } from '@videojs/react/media/lazy-video';
import { usePlayer, VideoPlayer, VideoSkin } from '@videojs/react/video';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// A native `<video>` plays itself; anything else is the adapter driving the rendered element.
function describeMedia(media: Media): string {
  return media instanceof HTMLElement ? `<${media.localName}>` : media.constructor.name;
}

function LightFacade({ poster, onPlay }: { poster: string | undefined; onPlay: () => void }) {
  return (
    <button type="button" className={c.facade} aria-label="Play video" onClick={onPlay}>
      {poster && <img className={c.facadeImage} src={poster} alt="" />}
      <span className={c.facadePlay}>
        <svg className={c.facadeIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path d={PLAY_ICON_PATH} />
        </svg>
      </span>
    </button>
  );
}

// Inside the player, so it can read whether playback started.
function StartedReporter({ onStarted }: { onStarted: () => void }) {
  const started = usePlayer((state) => state.started);

  useEffect(() => {
    if (started) onStarted();
  }, [started, onStarted]);

  return null;
}

const SHOWN_PACKAGES = 6;

function ScriptBreakdown({ bytes }: { bytes: ScriptBytes }) {
  const groups = groupScriptBytes(bytes);
  const total = groups.reduce((sum, { gzip }) => sum + gzip, 0);

  return (
    <section className={c.card} aria-label="JavaScript by package">
      <div className={c.breakdownHeader}>
        <h2 className={c.statLabel}>JavaScript by package</h2>
        <p className={c.statDetail}>
          {groups.length ? 'gzip, each script split by its packages' : 'Per-package sizes need a production build.'}
        </p>
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
  const { label, total, detail, sinceChange } = summarizeScriptBytes(scriptBytes, sourceChangedAt);

  useEffect(() => observeScriptBytes(setScriptBytes), []);

  const onMedia = useCallback((media: Media | null) => setResolved(media && describeMedia(media)), []);
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
        <VideoPlayer poster={poster}>
          <VideoSkin className="sandbox-video-frame">
            {/* After the click in light mode, `preload="auto"`: hls.js doesn't let `autoplay` override `preload="none"`. */}
            <LazyVideo
              src={src}
              mediaRef={onMedia}
              autoPlay={light}
              preload={light ? 'auto' : undefined}
              playsInline
              crossOrigin=""
            />
          </VideoSkin>
          {light && <StartedReporter onStarted={onStarted} />}
        </VideoPlayer>
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
      <ScriptBreakdown bytes={scriptBytes} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
