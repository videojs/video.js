import type { PlayerTarget } from '@videojs/core/dom';
import type { Media } from '@videojs/media';
import { getMediaElement } from '@videojs/media/dom';
import { listen } from '@videojs/utils/dom';

/** @experimental */
export interface MediaWooferExtensionProps {
  /** Level, from 0 to 255, the lowest frequency bands must pass to count as bass. Lower values shake more often. */
  threshold: number;
  /** Milliseconds a phone vibrates on each hit of bass. `0` turns vibration off. */
  vibration: number;
}

interface WooferGraph {
  analyser: AnalyserNode;
  levels: Uint8Array<ArrayBuffer>;
}

/** With a 512-sample FFT at 44.1–48 kHz, the first eight bins cover roughly 0–750 Hz. */
const FFT_SIZE = 512;
const BASS_BINS = 8;

const SHAKE_KEYFRAMES: Keyframe[] = [
  { transform: 'translate(0, 0) rotate(0deg)' },
  { transform: 'translate(2px, -1px) rotate(-1deg)' },
  { transform: 'translate(-2px, 1px) rotate(1deg)' },
  { transform: 'translate(1px, 2px) rotate(0deg)' },
  { transform: 'translate(0, 0) rotate(0deg)' },
];

// `composite: 'add'` stacks the shake on whatever transform the page already gives the element.
const SHAKE_TIMING: KeyframeAnimationOptions = { duration: 100, iterations: Infinity, composite: 'add' };

let context: AudioContext | null = null;

// `createMediaElementSource()` claims an element for good: from then on its sound plays only through that graph. Every
// woofer that meets the element shares the one graph, and it is never torn down.
const graphs = new WeakMap<HTMLMediaElement, WooferGraph>();

/**
 * Whether Web Audio may read `element`. A cross-origin source loaded without CORS reaches the graph as silence, and
 * routing it there would mute playback, so it is left alone. `blob:` URLs carry their creator's origin.
 */
function canAnalyse(element: HTMLMediaElement): boolean {
  if (element.crossOrigin !== null) return true;

  const src = element.currentSrc || element.src;
  if (!src) return false;

  const url = new URL(src, location.href);

  return url.protocol === 'data:' || url.origin === location.origin;
}

/**
 * The analyser for `element`, wired up the first time it is asked for. Resolves `null` while the browser keeps audio
 * suspended (no user gesture yet): routing the element through a suspended context would silence it.
 */
async function connectGraph(element: HTMLMediaElement): Promise<WooferGraph | null> {
  context ??= new AudioContext();

  try {
    await context.resume();
  } catch {
    return null;
  }

  if (context.state !== 'running') return null;

  const existing = graphs.get(element);
  if (existing) return existing;

  let source: MediaElementAudioSourceNode;

  try {
    source = context.createMediaElementSource(element);
  } catch {
    // Another library already routed this element through its own graph.
    return null;
  }

  const analyser = context.createAnalyser();

  analyser.fftSize = FFT_SIZE;
  source.connect(analyser);
  analyser.connect(context.destination);

  const graph = { analyser, levels: new Uint8Array(analyser.frequencyBinCount) };

  graphs.set(element, graph);

  return graph;
}

function supportsWebAudio(): boolean {
  return typeof AudioContext !== 'undefined';
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function vibrate(duration: number): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(duration);
}

/**
 * Player extension that shakes the media element along with the bass, and vibrates phones that support the [Vibration
 * API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).
 *
 * The media's sound is read with the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
 * once it plays after a user gesture. Cross-origin media needs CORS (`crossorigin` on the element) to be read; without
 * it the extension leaves the media alone. The shake is skipped when the user prefers reduced motion.
 *
 * Its `PlayerExtension` members are internal: the player drives them, and the element and hook that register it check
 * that it conforms.
 *
 * @experimental
 */
export class MediaWooferExtension implements MediaWooferExtensionProps {
  static readonly defaultProps: MediaWooferExtensionProps = {
    threshold: 248,
    vibration: 100,
  };

  threshold = MediaWooferExtension.defaultProps.threshold;
  vibration = MediaWooferExtension.defaultProps.vibration;

  #media: Media | null = null;
  #stopListening: (() => void) | null = null;
  #element: HTMLMediaElement | null = null;
  #graph: WooferGraph | null = null;
  #frame = 0;
  #shake: Animation | null = null;
  #bass = false;

  constructor(props: Partial<MediaWooferExtensionProps> = {}) {
    Object.assign(this, props);
  }

  /** @internal Player lifecycle; the player calls it. */
  attach({ media }: PlayerTarget) {
    if (this.#media === media) return;

    this.detach();
    this.#media = media;

    if (!supportsWebAudio()) return;

    const stopPlay = listen(media, 'play', this.#start);
    const stopPause = listen(media, 'pause', this.#stop);

    this.#stopListening = () => {
      stopPlay();
      stopPause();
    };

    if (getMediaElement(media)?.paused === false) this.#start();
  }

  /** @internal Player lifecycle; the player calls it. */
  detach() {
    this.#stopListening?.();
    this.#stopListening = null;
    this.#stop();
    this.#media = null;
  }

  destroy() {
    this.detach();
  }

  #start = async () => {
    const media = this.#media;
    // Resolved on every play: an adapter can swap the element it fronts between sources.
    const element = getMediaElement(media);
    if (!element || !canAnalyse(element)) return;

    const graph = await connectGraph(element);
    // Paused or detached while audio was starting up.
    if (!graph || this.#media !== media || element.paused) return;

    this.#stop();
    this.#element = element;
    this.#graph = graph;
    this.#frame = requestAnimationFrame(this.#render);
  };

  #stop = () => {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#setBass(false);
    this.#element = null;
    this.#graph = null;
  };

  #render = () => {
    const element = this.#element;
    const graph = this.#graph;
    if (!element || !graph) return;

    if (element.paused) {
      this.#stop();
      return;
    }

    this.#frame = requestAnimationFrame(this.#render);

    graph.analyser.getByteFrequencyData(graph.levels);
    this.#setBass(graph.levels.subarray(0, BASS_BINS).some((level) => level > this.threshold));
  };

  #setBass(bass: boolean) {
    if (this.#bass === bass) return;

    this.#bass = bass;

    if (!bass) {
      this.#shake?.cancel();
      this.#shake = null;

      if (this.vibration > 0) vibrate(0);

      return;
    }

    if (!prefersReducedMotion() && typeof this.#element?.animate === 'function') {
      this.#shake = this.#element.animate(SHAKE_KEYFRAMES, SHAKE_TIMING);
    }

    if (this.vibration > 0) vibrate(this.vibration);
  }
}
