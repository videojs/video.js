/**
 * The `<video>` binding a background video uses: somewhere to keep the attached element, the four properties the Media
 * fixes on it, and the element itself as `target`, with its `loadstart` forwarded.
 *
 * That is the whole surface anything here reaches. The engine drives playback, the element exposes `src` and nothing
 * else, and the background player subscribes to no store features, so nothing asks a background video for
 * `currentTime`, `play()`, picture-in-picture, fullscreen, or media components. `target` and `loadstart` are what
 * extensions like Mux Data need: the native element to monitor, and the hint that the source changed. Holding the host
 * to what is reachable is what keeps this entry free of `@videojs/media`, and small enough to suit a component whose
 * whole pitch is its size.
 *
 * An `EventTarget`, because a Media is one: the store and the element layers take anything they attach as an event
 * source, and inheriting the three methods satisfies that for free rather than by stubbing them.
 *
 * ⚠️ It still implements too little to carry the rest of the media surface, which bounds what may consume it: a store
 * feature reading a property outside this set gets `undefined` rather than an error. A Media needing more of that
 * surface belongs on a host that provides it.
 */
export class BackgroundVideoHost extends EventTarget {
  #target: HTMLVideoElement | null = null;

  /**
   * The attached `<video>`. Public, unlike `HTMLMediaAdapter`'s, because nothing else here exposes the element:
   * `getMediaElement` reads it to find what Mux Data monitors.
   */
  get target(): HTMLVideoElement | null {
    return this.#target;
  }

  attach(target: HTMLVideoElement): void {
    if (!target || this.#target === target) return;

    this.#target?.removeEventListener('loadstart', this.#forwardLoadStart);
    this.#target = target;
    target.addEventListener('loadstart', this.#forwardLoadStart);
  }

  detach(): void {
    this.#target?.removeEventListener('loadstart', this.#forwardLoadStart);
    this.#target = null;
  }

  #forwardLoadStart = (): void => {
    this.dispatchEvent(new Event('loadstart'));
  };

  // Read back off the element rather than stored, so they describe what is
  // playing instead of what was asked for — see the adapter's note on why the
  // Media declares none of these itself.
  get loop(): boolean {
    return this.#target?.loop ?? false;
  }

  set loop(value: boolean) {
    if (this.#target) this.#target.loop = value;
  }

  get muted(): boolean {
    return this.#target?.muted ?? false;
  }

  set muted(value: boolean) {
    if (this.#target) this.#target.muted = value;
  }

  get autoplay(): boolean {
    return this.#target?.autoplay ?? false;
  }

  set autoplay(value: boolean) {
    if (this.#target) this.#target.autoplay = value;
  }

  get preload(): HTMLVideoElement['preload'] {
    return this.#target?.preload ?? 'metadata';
  }

  set preload(value: HTMLVideoElement['preload']) {
    if (this.#target) this.#target.preload = value;
  }
}
