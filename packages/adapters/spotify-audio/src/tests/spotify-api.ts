import type { Mock } from 'vite-plus/test';
import { vi } from 'vite-plus/test';

import type { SpotifyAdapter } from '../adapter';
import type { SpotifyPlaybackState, SpotifyPlaybackUpdateEvent } from '../iframe-api';

type ReadyListener = () => void;
type PlaybackUpdateListener = (event: SpotifyPlaybackUpdateEvent) => void;

/**
 * Stands in for a controller from the live iframe API, including the part that matters most to this host:
 * `createController` never drives the element it is handed. It builds an iframe of its own and swaps it in for the
 * target — but only through `parentElement`, so a target that is detached, or one parented by a shadow root rather than
 * an element, is left alone. Reproducing that exactly is the point: a mock that swapped on `parentNode` hid a bug where
 * this host followed the controller onto an iframe that was never in the document.
 */
export class MockController {
  static instances: MockController[] = [];
  target: HTMLElement;
  options: unknown;
  /** The iframe the controller built for itself. */
  iframeElement: HTMLIFrameElement;
  readyListeners = new Set<ReadyListener>();
  playbackListeners = new Set<PlaybackUpdateListener>();

  loadUri: Mock = vi.fn();
  play: Mock = vi.fn();
  resume: Mock = vi.fn();
  pause: Mock = vi.fn();
  togglePlay: Mock = vi.fn();
  seek: Mock = vi.fn();
  destroy: Mock = vi.fn(() => {
    this.iframeElement.parentNode?.removeChild(this.iframeElement);
  });

  constructor(target: HTMLElement, options: unknown) {
    this.target = target;
    this.options = options;
    this.iframeElement = document.createElement('iframe');
    this.iframeElement.setAttribute('frameborder', '0');
    this.iframeElement.setAttribute('allowfullscreen', '');
    this.iframeElement.setAttribute('loading', 'lazy');
    // `parentElement`, exactly as the live bundle spells it.
    target.parentElement?.replaceChild(this.iframeElement, target);
    MockController.instances.push(this);
  }

  addListener(type: 'ready' | 'playback_update', listener: ReadyListener | PlaybackUpdateListener): void {
    if (type === 'ready') this.readyListeners.add(listener as ReadyListener);
    else this.playbackListeners.add(listener as PlaybackUpdateListener);
  }

  ready(): void {
    this.readyListeners.forEach((listener) => listener());
  }

  /** Push a playback snapshot, filling in the fields a test doesn't care about. */
  update(data: Partial<SpotifyPlaybackState> = {}): void {
    const payload: SpotifyPlaybackState = {
      isPaused: true,
      isBuffering: false,
      position: 0,
      duration: 60_000,
      ...data,
    };

    this.playbackListeners.forEach((listener) => listener({ data: payload }));
  }
}

export const TRACK_URL = 'https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M';

export function installSpotifyApi(): void {
  MockController.instances.length = 0;
  vi.stubGlobal('SpotifyIframeApi', {
    createController: (target: HTMLIFrameElement, options: unknown, callback: (controller: MockController) => void) =>
      callback(new MockController(target, options)),
  });
}

/** An iframe as a framework renders it: in the document, where it can be swapped out. */
export function createIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  document.body.append(iframe);
  return iframe;
}

export async function waitForEngine(media: SpotifyAdapter): Promise<MockController> {
  await vi.waitFor(() => {
    if (!media.engine) throw new Error('controller not created yet');
  });
  return media.engine as unknown as MockController;
}

export async function attachAndLoad(media: SpotifyAdapter): Promise<{
  /** The iframe holding the embed. It is the one `attach()` was handed. */
  iframe: HTMLIFrameElement;
  controller: MockController;
}> {
  // There is no embed to attach to without a source, so tests that don't care
  // which entity is playing get one.
  if (!media.src) media.src = TRACK_URL;

  const iframe = createIframe();

  media.attach(iframe);
  const controller = await waitForEngine(media);

  controller.ready();
  return { iframe, controller };
}
