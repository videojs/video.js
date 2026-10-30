/**
 * A media that satisfies the pause, seek, and source capabilities with a clock the test moves by hand. Fires the same
 * events in the same order a `<audio>` would for each operation.
 */
export class FakeAudio extends EventTarget {
  currentTime = 0;
  duration = Number.NaN;
  seeking = false;
  paused = true;
  ended = false;
  readyState = 0;
  networkState = 0;
  playbackRate = 1;
  src = '';
  currentSrc = '';

  load(): void {
    this.readyState = 0;
    this.dispatchEvent(new Event('emptied'));
    this.dispatchEvent(new Event('loadstart'));
  }

  loadMetadata(duration: number): void {
    this.duration = duration;
    this.readyState = 1;
    this.dispatchEvent(new Event('durationchange'));
    this.dispatchEvent(new Event('loadedmetadata'));
  }

  play(): Promise<void> {
    this.paused = false;
    this.ended = false;
    this.dispatchEvent(new Event('play'));
    this.dispatchEvent(new Event('playing'));

    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  /** Advance the clock as if `delta` seconds played, one `timeupdate` per call. */
  tick(delta: number): void {
    this.currentTime += delta;
    this.dispatchEvent(new Event('timeupdate'));
  }

  seekTo(time: number): void {
    this.currentTime = time;
    this.seeking = true;
    this.dispatchEvent(new Event('seeking'));
    this.dispatchEvent(new Event('timeupdate'));
    this.seeking = false;
    this.dispatchEvent(new Event('seeked'));
  }

  end(): void {
    this.paused = true;
    this.ended = true;
    this.dispatchEvent(new Event('ended'));
  }
}
