import {
  COMPARE_AXES,
  COMPARE_LAYOUTS,
  compareAvailable,
  type CompareLayout,
  type CompareMode,
  comparePanels,
  resolveSkinSource,
  type SkinSelection,
  summarizeSelection,
} from '@app/compare';
import { SidebarProvider } from '@app/components/ui/sidebar';
import {
  COLOR_SCHEMES,
  type ColorScheme,
  DEFAULT_PRELOAD,
  PLATFORMS,
  PRELOAD_VALUES,
  SKINS,
  type PreloadValue,
  SKIN_SOURCES,
  STYLINGS,
  TEXT_DIRECTIONS,
  type TextDirection,
} from '@app/constants';
import { COMPARE_LABELS } from '@app/labels';
import { hasTailwindSkin, isMediaId, landingSource, MEDIA, type MediaId, mediaSources } from '@app/media';
import { CAPTIONS_MODES, type CaptionsMode } from '@app/shared/captions';
import { DEFAULT_SANDBOX_LOCALE, SANDBOX_LOCALE_TAGS, type SandboxLocaleTag } from '@app/shared/i18n/locale-meta';
import { ASPECT_RATIOS, type AspectRatio, defaultPlayerWidth, PLAYER_WIDTH } from '@app/shared/player-frame';
import { skinSourceAvailable, skinStylings, tailwindSkinAvailable } from '@app/shared/skin-sources';
import { DEFAULT_SOURCE, SOURCES, type SourceId } from '@app/shared/sources';
import type { Platform, SkinSource, Styling } from '@app/types';
import { type CSSProperties, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { Navbar, SkinControls } from './navbar';
import { OptionsPanel } from './options-panel';
import { type FrameParams, Preview } from './preview';
import { describeError, MAX_ERRORS, type RelayedError, usePreferences } from './report';

/** `preset` named this parameter before the skins' player presets took the word, so older links still resolve. */
function readMedia(params: URLSearchParams): MediaId {
  const value = params.get('media') ?? params.get('preset');

  return isMediaId(value) ? value : 'video';
}

function readOption<T extends string, const Fallback>(
  values: readonly T[],
  value: string | null,
  fallback: Fallback
): T | Fallback {
  // SAFETY: the lookup narrows the query value to the option it matched.
  return value !== null && (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** An explicit skin source the platform can load. Absent means the default for the styling. */
function readSkins(value: string | null, platform: Platform): SkinSource | undefined {
  const source = readOption(SKIN_SOURCES, value, undefined);

  return source !== undefined && skinSourceAvailable(source, platform) ? source : undefined;
}

/** An explicit width, clamped to the control's range. Absent means the media's own default. */
function readWidth(value: string | null): number | undefined {
  const width = Number.parseInt(value ?? '', 10);

  return Number.isFinite(width) ? Math.min(PLAYER_WIDTH.max, Math.max(PLAYER_WIDTH.min, width)) : undefined;
}

function readParams() {
  const params = new URLSearchParams(location.search);
  const media = readMedia(params);
  const platform = readOption(PLATFORMS, params.get('platform'), 'html');

  return {
    platform,
    styling: readOption(STYLINGS, params.get('styling'), 'css'),
    skins: readSkins(params.get('skins'), platform),
    media,
    skin: readOption(SKINS, params.get('skin'), 'default'),
    // An explicit `?source=` wins over where the media lands on entry, so a shared link reaches the source it names.
    source: (params.get('source') ?? MEDIA[media].entrySource ?? DEFAULT_SOURCE) as SourceId,
    autoplay: params.get('autoplay') === '1',
    muted: params.get('muted') === '1',
    loop: params.get('loop') === '1',
    preload: readOption(PRELOAD_VALUES, params.get('preload'), DEFAULT_PRELOAD),
    captions: readOption(CAPTIONS_MODES, params.get('captions'), 'none'),
    accentColor: params.get('accent')?.trim() ?? '',
    locale: readOption(SANDBOX_LOCALE_TAGS, params.get('locale'), DEFAULT_SANDBOX_LOCALE),
    width: readWidth(params.get('width')),
    ratio: readOption(ASPECT_RATIOS, params.get('ratio'), '16:9'),
    scheme: readOption(COLOR_SCHEMES, params.get('scheme'), 'auto'),
    direction: readOption(TEXT_DIRECTIONS, params.get('dir'), 'auto'),
    compare: readOption(COMPARE_AXES, params.get('compare'), 'off'),
    layout: readOption(COMPARE_LAYOUTS, params.get('layout'), 'auto'),
    mirror: params.get('mirror') === '1',
  };
}

/** Whether the options panel is open outlives the page: it is chrome, not part of the selection the URL carries. */
const OPTIONS_STORAGE_KEY = 'sandbox:options';

function readOptionsOpen(): boolean {
  try {
    return localStorage.getItem(OPTIONS_STORAGE_KEY) === 'open';
  } catch {
    return false;
  }
}

function storeOptionsOpen(open: boolean): void {
  try {
    localStorage.setItem(OPTIONS_STORAGE_KEY, open ? 'open' : 'closed');
  } catch {
    // Storage can be unavailable; the panel then opens closed next time.
  }
}

/** The preferences a frame applies to its document rather than renders from, repeated to it once it has loaded. */
function postPreferences(target: Window, params: FrameParams): void {
  target.postMessage({ type: 'accent-change', accent: params.accentColor }, '*');
  target.postMessage({ type: 'width-change', width: params.width }, '*');
  target.postMessage({ type: 'ratio-change', ratio: params.ratio }, '*');
  target.postMessage({ type: 'scheme-change', scheme: params.scheme }, '*');
  target.postMessage({ type: 'dir-change', dir: params.direction }, '*');
  target.postMessage({ type: 'mirror-change', mirror: params.mirror }, '*');
}

export function App() {
  const initial = useMemo(readParams, []);
  const [platform, setPlatform] = useState<Platform>(initial.platform);
  const [styling, setStyling] = useState(initial.styling);
  const [media, setMedia] = useState<MediaId>(initial.media);
  const [skins, setSkins] = useState(initial.skins);
  const [skin, setSkin] = useState(initial.skin);
  const [source, setSource] = useState(initial.source);
  const [autoplay, setAutoplay] = useState(initial.autoplay);
  const [muted, setMuted] = useState(initial.muted);
  const [loop, setLoop] = useState(initial.loop);
  const [preload, setPreload] = useState<PreloadValue>(initial.preload);
  const [captions, setCaptions] = useState<CaptionsMode>(initial.captions);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [locale, setLocale] = useState<SandboxLocaleTag>(initial.locale);
  const [width, setWidth] = useState(initial.width);
  const [ratio, setRatio] = useState<AspectRatio>(initial.ratio);
  const [scheme, setScheme] = useState<ColorScheme>(initial.scheme);
  const [direction, setDirection] = useState<TextDirection>(initial.direction);
  const [compare, setCompare] = useState<CompareMode>(initial.compare);
  const [layout, setLayout] = useState<CompareLayout>(initial.layout);
  const [mirror, setMirror] = useState(initial.mirror);
  const [errors, setErrors] = useState<readonly RelayedError[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(readOptionsOpen);
  const [toolbarHeight, setToolbarHeight] = useState(48);
  const optionsId = useId();
  const preferences = usePreferences();

  const descriptor = MEDIA[media];
  const availableSources = mediaSources(media, platform);
  const tailwindAvailable = hasTailwindSkin(media, platform) && tailwindSkinAvailable(platform);
  // Until the control is touched, the preview opens at the width its skin would have taken on its own.
  const playerWidth = width ?? defaultPlayerWidth(descriptor.player);
  const resizable = descriptor.player !== 'background';

  // The frames: one for the selection, or two differing on the compared axis. The first panel is what the navbar
  // reports as the resolved skin source.
  const selection: SkinSelection = useMemo(
    () => ({ platform, styling, skins, skin, media }),
    [platform, styling, skins, skin, media]
  );
  const panels = useMemo(() => comparePanels(selection, compare), [selection, compare]);
  const skinSource = panels[0]?.skins ?? 'package';
  // The stylings the selection itself can show. A styling comparison puts CSS in the first panel, so constraining by
  // that panel's source would send a Tailwind selection back to CSS.
  const skinStylingsAvailable = skinStylings(platform, resolveSkinSource(platform, styling, skins));
  const compareOptions = useMemo(
    () => [
      { value: 'off' as const, label: COMPARE_LABELS.off, disabled: false },
      ...COMPARE_AXES.map((axis) => ({
        value: axis,
        label: COMPARE_LABELS[axis],
        disabled: !compareAvailable(axis, selection),
      })),
    ],
    [selection]
  );

  const frames = useRef(new Map<string, HTMLIFrameElement>());
  const previousPreviewState = useRef({
    skin,
    source,
    autoplay,
    muted,
    loop,
    preload,
    captions,
    accentColor,
    playerWidth,
    ratio,
    scheme,
    direction,
    mirroring: false,
  });

  // Mirroring only means something between two panels.
  const mirroring = mirror && compare !== 'off';
  const frameParams: FrameParams = {
    media,
    source,
    autoplay,
    muted,
    loop,
    preload,
    captions,
    locale,
    accentColor,
    width: playerWidth,
    ratio,
    scheme,
    direction,
    mirror: mirroring,
  };

  // Keep the URL in sync with all state.
  useEffect(() => {
    const params = new URLSearchParams({
      platform,
      styling,
      media,
      skin,
      source,
      autoplay: autoplay ? '1' : '0',
      muted: muted ? '1' : '0',
      loop: loop ? '1' : '0',
      preload,
      locale,
      scheme,
      dir: direction,
    });

    if (captions !== 'none') params.set('captions', captions);

    if (accentColor) params.set('accent', accentColor);

    if (width !== undefined) params.set('width', String(width));

    if (ratio !== '16:9') params.set('ratio', ratio);

    if (skins !== undefined) params.set('skins', skins);

    if (compare !== 'off') {
      params.set('compare', compare);

      if (layout !== 'auto') params.set('layout', layout);

      if (mirror) params.set('mirror', '1');
    }

    history.replaceState(null, '', `/?${params}`);
  }, [
    platform,
    styling,
    skins,
    media,
    skin,
    source,
    autoplay,
    muted,
    loop,
    preload,
    captions,
    accentColor,
    locale,
    width,
    ratio,
    scheme,
    direction,
    compare,
    layout,
    mirror,
  ]);

  // The shell follows the scheme too, so its chrome and the preview agree; see `styles.css` for the `dark:` variant.
  useEffect(() => {
    if (scheme === 'auto') delete document.documentElement.dataset.colorScheme;
    else document.documentElement.dataset.colorScheme = scheme;
  }, [scheme]);

  // Initial state is already present in the iframe URL. Stream only subsequent changes so HTML previews do not race
  // several identical async renders during startup. Locale changes are URL-owned by Preview because CDN must reload.
  useEffect(() => {
    const previous = previousPreviewState.current;
    const targets = [...frames.current.values()]
      .map((frame) => frame.contentWindow)
      .filter((window) => window !== null);
    const post = (message: Record<string, unknown>) => {
      for (const target of targets) target.postMessage(message, '*');
    };

    if (previous.skin !== skin) post({ type: 'skin-change', skin });

    if (previous.source !== source) post({ type: 'source-change', source });

    if (previous.autoplay !== autoplay) post({ type: 'autoplay-change', autoplay });

    if (previous.muted !== muted) post({ type: 'muted-change', muted });

    if (previous.loop !== loop) post({ type: 'loop-change', loop });

    if (previous.preload !== preload) post({ type: 'preload-change', preload });

    if (previous.captions !== captions) post({ type: 'captions-change', captions });

    if (previous.accentColor !== accentColor) post({ type: 'accent-change', accent: accentColor });

    if (previous.playerWidth !== playerWidth) post({ type: 'width-change', width: playerWidth });

    if (previous.ratio !== ratio) post({ type: 'ratio-change', ratio });

    if (previous.scheme !== scheme) post({ type: 'scheme-change', scheme });

    if (previous.direction !== direction) post({ type: 'dir-change', dir: direction });

    if (previous.mirroring !== mirroring) post({ type: 'mirror-change', mirror: mirroring });

    previousPreviewState.current = {
      skin,
      source,
      autoplay,
      muted,
      loop,
      preload,
      captions,
      accentColor,
      playerWidth,
      ratio,
      scheme,
      direction,
      mirroring,
    };
  }, [
    skin,
    source,
    autoplay,
    muted,
    loop,
    preload,
    captions,
    accentColor,
    playerWidth,
    ratio,
    scheme,
    direction,
    mirroring,
  ]);

  // Keep the last few errors the frames relay, tagged with the panel they came from, for the report.
  useEffect(() => {
    const collect = (event: MessageEvent) => {
      if (event.data?.type !== 'sandbox-error') return;

      const panel = [...frames.current.entries()].find(([, frame]) => frame.contentWindow === event.source)?.[0];
      const entry: RelayedError = {
        panel: panel ?? 'frame',
        time: new Date().toISOString().slice(11, 19),
        message: describeError(event.data.message),
      };

      setErrors((current) => [...current, entry].slice(-MAX_ERRORS));
    };

    window.addEventListener('message', collect);

    return () => {
      window.removeEventListener('message', collect);
    };
  }, []);

  // Relay one panel's playback state to the others; the frames apply only what differs, so nothing echoes.
  useEffect(() => {
    if (!mirroring) return;

    const relay = (event: MessageEvent) => {
      if (event.data?.type !== 'sandbox-mirror') return;

      for (const frame of frames.current.values()) {
        const target = frame.contentWindow;

        if (target && target !== event.source)
          target.postMessage({ type: 'mirror-apply', state: event.data.state }, '*');
      }
    };

    window.addEventListener('message', relay);

    return () => {
      window.removeEventListener('message', relay);
    };
  }, [mirroring]);

  // Constrain the source to what the media offers on this platform.
  useEffect(() => {
    if (!availableSources.includes(source)) setSource(descriptor.fallbackSource ?? DEFAULT_SOURCE);
  }, [availableSources, descriptor.fallbackSource, source]);

  useEffect(() => {
    if (!tailwindAvailable && styling === 'tailwind') setStyling('css');
  }, [tailwindAvailable, styling]);

  // After a platform switch, a source that cannot load here or that lacks the styling falls back to what it can do.
  useEffect(() => {
    if (skins !== undefined && !skinSourceAvailable(skins, platform)) setSkins(undefined);
    else if (!skinStylingsAvailable.includes(styling)) setStyling(skinStylingsAvailable[0] ?? 'css');
  }, [skins, platform, skinStylingsAvailable, styling]);

  // A comparison the selection can no longer make, such as skins for a background media, switches off.
  useEffect(() => {
    if (compare !== 'off' && !compareAvailable(compare, selection)) setCompare('off');
  }, [compare, selection]);

  // Land on the media's own source in the same update that switches media — `readParams` covers the first-mount half.
  // Switching remounts the preview frame with the URL of that render, so a source fixed up by an effect afterwards would
  // be posted to a page that is still loading and lost.
  const handleMediaChange = useCallback(
    (value: MediaId) => {
      setMedia(value);
      setSource((current) => landingSource(value, platform, current));
    },
    [platform]
  );

  const handleSourceChange = useCallback((value: string) => setSource(value as SourceId), []);

  const handleOptionsChange = useCallback((open: boolean) => {
    storeOptionsOpen(open);
    setOptionsOpen(open);
  }, []);

  // Picking a styling an explicit source does not publish hands the choice back to that styling's default source.
  const handleStylingChange = useCallback(
    (value: Styling) => {
      setStyling(value);

      if (skins !== undefined && !skinStylings(platform, skins).includes(value)) setSkins(undefined);
    },
    [platform, skins]
  );

  // Picking a source that lacks the current styling switches to one it publishes.
  const handleSkinsChange = useCallback(
    (value: SkinSource) => {
      setSkins(value);

      if (!skinStylings(platform, value).includes(styling)) setStyling('css');
    },
    [platform, styling]
  );

  const handleFrame = useCallback((id: string, frame: HTMLIFrameElement | null) => {
    if (frame) frames.current.set(id, frame);
    else frames.current.delete(id);
  }, []);

  // The URL carried these too, but a change made while the page was still loading has no other way in.
  const handleFrameLoad = (id: string) => {
    const frame = frames.current.get(id);
    const target = frame?.contentWindow;
    const panel = panels.find((panel) => panel.id === id);
    if (!frame || !target || !panel) return;

    const frameQuery = new URL(frame.src).searchParams;

    if (frameQuery.get('skin') !== panel.skin) {
      target.postMessage({ type: 'skin-change', skin: panel.skin }, '*');
    }

    if (frameQuery.get('source') !== source) target.postMessage({ type: 'source-change', source }, '*');

    postPreferences(target, frameParams);
  };

  const summary = summarizeSelection({
    platform,
    media,
    skin,
    styling,
    skins: skinSource,
    width: playerWidth,
    source,
  });

  return (
    <SidebarProvider
      open={optionsOpen}
      onOpenChange={handleOptionsChange}
      className="bg-background text-foreground h-screen min-h-0 flex-col overflow-hidden"
      style={{ '--sidebar-width': '19rem' } as CSSProperties}
    >
      <Navbar
        platform={platform}
        onPlatformChange={setPlatform}
        media={media}
        onMediaChange={handleMediaChange}
        source={source}
        onSourceChange={handleSourceChange}
        availableSources={availableSources}
        platforms={PLATFORMS}
        sources={SOURCES}
        optionsId={optionsId}
      />
      <div className="flex min-h-0 flex-1">
        <Preview
          onToolbarResize={setToolbarHeight}
          panels={panels}
          layout={layout}
          onLayoutChange={setLayout}
          onMirrorChange={setMirror}
          controls={
            <SkinControls
              platform={platform}
              media={media}
              styling={styling}
              onStylingChange={handleStylingChange}
              skin={skin}
              onSkinChange={setSkin}
              skins={skinSource}
              onSkinsChange={handleSkinsChange}
              compare={compare}
              onCompareChange={setCompare}
              compareOptions={compareOptions}
              stylings={STYLINGS}
            />
          }
          summary={summary}
          report={{ build: { branch: __SANDBOX_BRANCH__, commit: __SANDBOX_COMMIT__ }, preferences, errors }}
          params={frameParams}
          onFrame={handleFrame}
          onFrameLoad={handleFrameLoad}
        />
        <OptionsPanel
          headerHeight={toolbarHeight}
          id={optionsId}
          width={playerWidth}
          onWidthChange={setWidth}
          widthDisabled={!resizable}
          ratio={ratio}
          onRatioChange={setRatio}
          ratioDisabled={descriptor.player !== 'video'}
          scheme={scheme}
          onSchemeChange={setScheme}
          direction={direction}
          onDirectionChange={setDirection}
          locale={locale}
          onLocaleChange={setLocale}
          accentColor={accentColor}
          onAccentColorChange={setAccentColor}
          autoplay={autoplay}
          onAutoplayChange={setAutoplay}
          muted={muted}
          onMutedChange={setMuted}
          loop={loop}
          onLoopChange={setLoop}
          preload={preload}
          onPreloadChange={setPreload}
          captions={captions}
          onCaptionsChange={setCaptions}
          preferences={preferences}
        />
      </div>
    </SidebarProvider>
  );
}
