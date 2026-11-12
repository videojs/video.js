import type { Media } from '@videojs/media/dom';

import { BackgroundVideoBase } from './base';

// Don't extend CustomMediaMixin to save some bytes, background videos don't need the full Media API.
export class BackgroundVideo extends BackgroundVideoBase {
  constructor() {
    super();

    // `error` doesn't cross the shadow boundary, so re-fire it from the host,
    // matching `<hls-background-video>`.
    this.target?.addEventListener('error', () => this.dispatchEvent(new Event('error')));
  }

  // Register the inner <video> (not `this`) with the provider.
  getMediaTarget(): Media | null {
    return this.target;
  }

  /** URL of a video the browser can play directly. Assigning a new one restarts playback. */
  override get src(): string {
    return this.target?.src ?? '';
  }

  override set src(value: string) {
    const target = this.target;

    if (target) target.src = value;
  }

  /** The inner video's `MediaError`, or `null`. */
  get error(): MediaError | null {
    return this.target?.error ?? null;
  }
}
