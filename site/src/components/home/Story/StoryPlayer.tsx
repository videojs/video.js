import { BackgroundVideoSkin } from '@videojs/react/background';
import { CheckIcon, ChevronIcon } from '@videojs/react/icons';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { CompatVideoSkin, NeutralVideoSkin, ScaffoldVideoSkin, VideoSkin } from '@videojs/react/video';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { createSharedMediaPlayer } from '@/components/skins/sharedMediaPlayer';
import { VJS10_DEMO_VIDEO } from '@/consts';

import '@videojs/react/video/skin.css';
import '@videojs/react/video/neutral-skin.css';
import '@videojs/react/video/compat-skin.css';
import '@videojs/react/video/scaffold-skin.css';
import '@videojs/react/background/skin.css';

const looks = [
  { name: 'Default', kind: 'Skin', note: 'Distinctive, with a little personality', Skin: VideoSkin },
  { name: 'Neutral', kind: 'Skin', note: 'Quiet enough to fit any design', Skin: NeutralVideoSkin },
  { name: 'Compat', kind: 'Skin', note: 'Built for the widest browser support', Skin: CompatVideoSkin },
  { name: 'Background', kind: 'Preset', note: 'Ambient video with no controls', Skin: BackgroundVideoSkin },
  { name: 'Scaffold', kind: 'Skin', note: 'An unstyled start for your own design', Skin: ScaffoldVideoSkin },
];

/** How long each look rests before the next one scrolls in, until the reader takes over. */
const DWELL_MS = 5000;
/** How long controls stay up after a swipe settles. */
const SETTLE_MS = 700;
/** How far the player must have shrunk into its column before the breakdown takes over from the swipeable looks. */
const EXPLODE_AT = 0.02;
/** How long the breakdown skin takes to fade in over the looks, matching `story-fade-in`. */
const RESET_MS = 300;

/** Layers lifted apart while the player tilts, from the back of the stack to the front. */
const layers = ['Media', 'Poster', 'Backdrop', 'Controls', 'Popups'];

type Phase = 'tilt' | 'spread' | 'menus';

interface LabelSpec {
  /** Selector inside the player for the element the label points at. */
  target: string;
  phase: Phase;
  /** Where the label sits relative to its target. */
  side: 'left' | 'right' | 'top' | 'bottom';
  name?: string;
  tag: string;
  /** Shown instead of `tag` once the reader reaches the last step. */
  ownTag?: string;
}

const labels: LabelSpec[] = [
  { target: '[data-layer="0"]', phase: 'tilt', side: 'left', name: 'Media', tag: '<HlsJsVideo>' },
  { target: '[data-layer="1"]', phase: 'tilt', side: 'left', name: 'Poster', tag: '<Poster.Root>' },
  { target: '[data-layer="2"]', phase: 'tilt', side: 'left', name: 'Backdrop', tag: '<Controls.Backdrop>' },
  { target: '[data-layer="3"]', phase: 'tilt', side: 'left', name: 'Controls', tag: '<Controls.Root>' },
  { target: '[data-layer="4"]', phase: 'tilt', side: 'left', name: 'Popups', tag: '<Menu.Popup>' },
  {
    target: '.story-skin .video-controls-content .media-play-button',
    phase: 'spread',
    side: 'bottom',
    tag: '<PlayButton>',
    ownTag: '<MyPlayButton>',
  },
  {
    target: '.story-skin .video-controls-content .media-mute-button',
    phase: 'spread',
    side: 'top',
    tag: '<MuteButton>',
  },
  {
    target: '.story-skin .video-controls-content .media-time-value',
    phase: 'spread',
    side: 'bottom',
    tag: '<Time.Value>',
  },
  {
    target: '.story-skin .video-controls-content .media-time-slider',
    phase: 'spread',
    side: 'top',
    tag: '<TimeSlider.Root>',
  },
  {
    target: '.story-skin .video-controls-content .media-settings-menu-trigger',
    phase: 'spread',
    side: 'top',
    tag: '<Menu.Trigger>',
  },
  {
    target: '.story-skin .video-controls-content .media-fullscreen-button',
    phase: 'spread',
    side: 'bottom',
    tag: '<FullscreenButton>',
  },
  { target: '.story-menu', phase: 'menus', side: 'top', tag: '<Menu.Popup>' },
  { target: '.story-menu [data-highlighted]', phase: 'menus', side: 'left', tag: '<Menu.RadioItem>' },
  { target: '.story-volume', phase: 'menus', side: 'top', tag: '<VolumePopover.Popup>' },
  { target: '.story-volume .media-slider-thumb', phase: 'menus', side: 'right', tag: '<VolumeSlider.Thumb>' },
];

const rates = [0.5, 1, 1.5, 2];

const { Player, SharedMedia } = createSharedMediaPlayer({
  stage: '.story-frame',
  isHidden: (container) => container.closest('[inert]') !== null,
});

/**
 * Popups render in the browser's top layer, which 3D transforms cannot reach, so the breakdown draws still copies of
 * the Default skin's speed menu and volume popover from the skin's own classes.
 */
function PopupCopies() {
  return (
    <div className="story-popups" aria-hidden="true">
      <div className="media-popup media-popup-surface media-volume-popover story-volume" data-open="">
        <div
          className="media-slider media-volume-slider"
          data-orientation="vertical"
          // SAFETY: React's CSSProperties omits CSS custom properties; the skin reads the fill as a percentage.
          style={{ '--media-slider-fill': '70%', '--media-slider-pointer': '70%' } as CSSProperties}
        >
          <div className="media-slider-track" data-orientation="vertical">
            <div className="media-slider-fill" data-orientation="vertical" />
          </div>
          <div className="media-slider-thumb media-volume-slider-thumb" data-orientation="vertical" />
        </div>
      </div>

      <div className="media-popup media-popup-surface media-menu-popup story-menu" data-open="">
        <div className="media-menu-content" data-open="" data-submenu="">
          <div className="media-menu-back-item">
            <ChevronIcon className="media-menu-back-chevron" />
            <span>Speed</span>
          </div>
          <div className="media-menu-separator" />
          <div className="media-menu-radio-group">
            {rates.map((rate) => (
              <div
                key={rate}
                className="media-menu-radio-item"
                role="menuitemradio"
                aria-checked={rate === 1}
                data-highlighted={rate === 1 ? '' : undefined}
              >
                <span>{rate}×</span>
                <span className="media-menu-item-indicator">
                  <CheckIcon className="media-menu-radio-item-icon" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Read a 0–1 phase value the story section's scroll script writes. */
function phase(section: HTMLElement | null, name: string) {
  return Number(section?.style.getPropertyValue(`--${name}`) || 0);
}

/**
 * One player for the whole story. At the top of the page the looks sit on full-width pages in a horizontal scroll-snap
 * container over one shared video: each page clips its look to the part of the stage it covers while the look moves
 * against the scroll to stay in place, so a trackpad or touch swipe wipes between looks. Once the section shrinks the
 * player into its column, an unclipped Default skin on the same video takes over to come apart in 3D.
 */
export default function StoryPlayer({ poster }: { poster: string }) {
  const [media, setMedia] = useState<HTMLVideoElement | null>(null);
  const [current, setCurrent] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [held, setHeld] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shrinking, setShrinking] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wasShrinking = useRef(false);

  // Once the player starts to shrink, the Default skin fades in over whichever look was showing and comes apart.
  const exploded = shrinking;

  function show(index: number) {
    const element = scroller.current;
    if (!element) return;

    element.scrollTo({ left: index * element.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  function choose(index: number) {
    setInteracted(true);
    show(index);
  }

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);

    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!media) return;

    const update = () => setPlaying(!media.paused);

    media.addEventListener('play', update);
    media.addEventListener('pause', update);
    return () => {
      media.removeEventListener('play', update);
      media.removeEventListener('pause', update);
    };
  }, [media]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;

    // Browsers without scroll-driven animations get the counter-scroll from script instead.
    const follow = !CSS.supports('animation-timeline: scroll()');
    let settle: ReturnType<typeof setTimeout> | undefined;

    const onScroll = () => {
      if (follow) element.style.setProperty('--story-scroll', `${element.scrollLeft}px`);

      setCurrent(Math.round(element.scrollLeft / element.clientWidth));
      setScrolling(true);
      clearTimeout(settle);
      settle = setTimeout(() => setScrolling(false), SETTLE_MS);
    };

    // Only a reader's own swipe stops the rotation, not the scrolls it makes itself.
    const onSwipe = (event: WheelEvent | TouchEvent) => {
      if (!('deltaX' in event) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) setInteracted(true);
    };

    element.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('wheel', onSwipe, { passive: true });
    element.addEventListener('touchstart', onSwipe, { passive: true });

    return () => {
      clearTimeout(settle);
      element.removeEventListener('scroll', onScroll);
      element.removeEventListener('wheel', onSwipe);
      element.removeEventListener('touchstart', onSwipe);
    };
  }, []);

  // Rotate through the looks until the reader swipes, pausing while they watch, point at, or scroll past the hero.
  useEffect(() => {
    if (interacted || held || playing || !onScreen || reducedMotion || scrolling || shrinking) return;

    const timer = setTimeout(() => show((current + 1) % looks.length), DWELL_MS);

    return () => clearTimeout(timer);
  });

  // Behind the breakdown, reset the looks to Default; resizing the player would misalign the scroll snapping anyway.
  useEffect(() => {
    if (shrinking && !wasShrinking.current) {
      const timer = setTimeout(() => scroller.current?.scrollTo({ left: 0, behavior: 'instant' }), RESET_MS);

      wasShrinking.current = true;
      return () => clearTimeout(timer);
    }

    wasShrinking.current = shrinking;
  });

  // Follow the section's scroll phases: hand over to the breakdown, and keep the flat labels on the parts they name.
  useEffect(() => {
    const element = root.current;
    const section = element?.closest<HTMLElement>('[data-story]') ?? null;

    if (!element) return;

    let frame = 0;
    let visible = false;

    const place = () => {
      frame = visible ? requestAnimationFrame(place) : 0;

      setShrinking(phase(section, 'shrink') > EXPLODE_AT);

      const origin = element.getBoundingClientRect();
      const amounts = {
        tilt: phase(section, 'tilt'),
        spread: phase(section, 'spread') * (1 - phase(section, 'menus')),
        menus: phase(section, 'menus'),
      };

      labels.forEach((spec, index) => {
        const label = labelRefs.current[index];
        if (!label) return;

        const amount = amounts[spec.phase];
        const rect = element.querySelector(spec.target)?.getBoundingClientRect();

        if (!rect || rect.width === 0 || amount <= 0.01) {
          label.style.opacity = '0';
          return;
        }

        const middleX = rect.left + rect.width / 2;
        const middleY = rect.top + rect.height / 2;
        const anchors = {
          left: [rect.left, middleY],
          right: [rect.right, middleY],
          top: [middleX, rect.top],
          bottom: [middleX, rect.bottom],
        } as const;
        const [x, y] = anchors[spec.side];

        label.style.opacity = String(amount);
        label.style.transform = `translate(${x - origin.left}px, ${y - origin.top}px)`;
      });
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      setOnScreen(visible);

      if (visible && !frame) frame = requestAnimationFrame(place);
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={root}
      className="story-player"
      data-exploded={exploded || undefined}
      data-scrolling={scrolling || undefined}
    >
      <div className="story-frame">
        <div className="story-media">
          <HlsJsVideo
            ref={setMedia}
            className="story-video"
            src={VJS10_DEMO_VIDEO.hls}
            poster={poster}
            playsInline
            crossOrigin="anonymous"
          >
            <track
              kind="metadata"
              label="thumbnails"
              src={`https://image.mux.com/${VJS10_DEMO_VIDEO.id}/storyboard.vtt`}
              default
            />
          </HlsJsVideo>
        </div>

        <div
          ref={scroller}
          className="story-scroller"
          inert={exploded}
          // SAFETY: React's CSSProperties omits CSS custom properties; --count is the number of pages.
          style={{ '--count': looks.length } as CSSProperties}
          onPointerEnter={(event) => event.pointerType === 'mouse' && setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocusCapture={() => setHeld(true)}
          onBlurCapture={() => setHeld(false)}
        >
          {looks.map(({ name, Skin }, index) => (
            <div
              key={name}
              className="story-page"
              inert={index !== current}
              aria-hidden={index !== current || undefined}
              // SAFETY: React's CSSProperties omits CSS custom properties; --index is this page's position.
              style={{ '--index': index } as CSSProperties}
            >
              <div className="story-layer">
                <Player>
                  <SharedMedia media={media} lockControls={scrolling} />
                  <Skin className="story-look" />
                </Player>
              </div>
              {/* Named at both edges, so each side of a seam carries its own look's name. */}
              <span className="story-page-label" data-edge="start" aria-hidden="true">
                {name}
              </span>
              <span className="story-page-label" data-edge="end" aria-hidden="true">
                {name}
              </span>
            </div>
          ))}
        </div>

        {exploded && (
          <Player>
            <SharedMedia media={media} lockControls />
            <VideoSkin className="story-skin">
              {layers.map((name, index) => (
                <span
                  key={name}
                  className="story-anchor"
                  data-layer={index}
                  // SAFETY: React's CSSProperties omits CSS custom properties; --layer is the layer's depth index.
                  style={{ '--layer': index } as CSSProperties}
                />
              ))}
              <PopupCopies />
            </VideoSkin>
          </Player>
        )}
      </div>

      <div className="story-footer" inert={shrinking}>
        <div className="story-caption" aria-live="polite">
          <span className="story-kind">{looks[current]!.kind}</span>
          <span className="story-name">{looks[current]!.name}</span>
          <span className="story-note">{looks[current]!.note}</span>
        </div>

        <div className="story-controls">
          <p className="story-hint" aria-hidden="true">
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 7h20M5 3 1 7l4 4M17 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Swipe to change skin
          </p>
          <div className="story-pager" role="group" aria-label="Player looks">
            {looks.map(({ name, kind }, index) => (
              <button
                key={name}
                type="button"
                className="story-dot"
                aria-label={`${name} ${kind.toLowerCase()}`}
                aria-pressed={current === index}
                data-ph-capture-attribute-cta={`hero-look-${name.toLowerCase()}`}
                onClick={() => choose(index)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="story-labels" aria-hidden="true">
        {labels.map((spec, index) => (
          <div
            key={spec.target}
            ref={(element) => {
              labelRefs.current[index] = element;
            }}
            className="story-label"
            data-side={spec.side}
          >
            <span className="story-label-line" />
            <span className="story-label-pill">
              {spec.name && <span className="story-label-name">{spec.name}</span>}
              <code data-own-tag={spec.ownTag ? 'base' : undefined}>{spec.tag}</code>
              {spec.ownTag && <code data-own-tag="own">{spec.ownTag}</code>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
