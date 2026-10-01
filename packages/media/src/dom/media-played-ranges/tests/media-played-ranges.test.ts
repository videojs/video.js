import { describe, expect, it } from 'vite-plus/test';

import { MediaPlayedRangesMixin } from '..';

class FakeMedia extends MediaPlayedRangesMixin(EventTarget) {
  currentTime = 0;
  paused = true;

  simulatePlay(time: number): void {
    this.paused = false;
    this.currentTime = time;
    this.dispatchEvent(new Event('play'));
  }

  tick(time: number): void {
    this.currentTime = time;
  }

  simulatePause(time: number): void {
    this.currentTime = time;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  seek(target: number): void {
    this.dispatchEvent(new Event('seeking'));
    this.currentTime = target;
    this.dispatchEvent(new Event('seeked'));
  }

  end(time: number): void {
    this.currentTime = time;
    this.paused = true;
    this.dispatchEvent(new Event('ended'));
  }
}

describe('MediaPlayedRangesMixin', () => {
  it('starts with a single empty range', () => {
    const media = new FakeMedia();

    expect(media.played.length).toBe(1);
    expect(media.played.start(0)).toBe(0);
    expect(media.played.end(0)).toBe(0);
  });

  it('tracks a contiguous play segment', () => {
    const media = new FakeMedia();

    media.simulatePlay(0);
    media.tick(5);
    media.simulatePause(5);

    const played = media.played;

    expect(played.length).toBe(1);
    expect(played.start(0)).toBe(0);
    expect(played.end(0)).toBe(5);
  });

  it('merges adjacent ranges within the epsilon tolerance', () => {
    const media = new FakeMedia();

    media.simulatePlay(0);
    media.simulatePause(5);
    media.simulatePlay(5.2);
    media.simulatePause(8);

    const played = media.played;

    expect(played.length).toBe(1);
    expect(played.end(0)).toBe(8);
  });

  it('keeps non-adjacent ranges separate', () => {
    const media = new FakeMedia();

    media.simulatePlay(0);
    media.simulatePause(2);
    media.seek(20);
    media.simulatePlay(20);
    media.simulatePause(25);

    const played = media.played;

    expect(played.length).toBe(2);
    expect(played.start(0)).toBe(0);
    expect(played.end(0)).toBe(2);
    expect(played.start(1)).toBe(20);
    expect(played.end(1)).toBe(25);
  });

  it('retains playback before an unpaused seek without a played read', () => {
    const media = new FakeMedia();

    try {
      media.simulatePlay(0);
      media.tick(5);
      media.dispatchEvent(new Event('timeupdate'));

      // Seeking reports the target time, not the last played position.
      media.tick(20);
      media.dispatchEvent(new Event('seeking'));
      media.dispatchEvent(new Event('timeupdate'));
      media.dispatchEvent(new Event('seeked'));
      media.simulatePause(25);

      const played = media.played;

      expect(Array.from({ length: played.length }, (_, i) => [played.start(i), played.end(i)])).toEqual([
        [0, 5],
        [20, 25],
      ]);
    } finally {
      media.destroy();
    }
  });

  it('commits a range on ended', () => {
    const media = new FakeMedia();

    media.simulatePlay(0);
    media.tick(10);
    media.end(10);
    expect(media.played.end(0)).toBe(10);
  });

  it('stops tracking after destroy', () => {
    const media = new FakeMedia();

    media.destroy();
    media.simulatePlay(0);
    media.tick(5);
    media.simulatePause(5);
    // Listeners were removed on destroy, so no range was recorded.
    expect(media.played.length).toBe(1);
    expect(media.played.end(0)).toBe(0);
  });
});
