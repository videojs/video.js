import type { MediaContainer } from '@videojs/core/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { GoogleAnalyticsExtension } from '../extension';

// SAFETY: MediaContainer is HTMLElement; null is valid PlayerTarget container.
const mockContainer: MediaContainer | null = null;

interface TestDataLayerEvent {
  event?: string;
  video_current_time?: number;
  video_duration?: number;
  video_percent?: number;
  video_provider?: string;
  video_stream_type?: string;
  video_title?: string;
  video_url?: string;
  visible?: boolean;
}

function getDataLayer(): TestDataLayerEvent[] {
  // SAFETY: window.dataLayer is populated as an array by the extension under test.
  return (window.dataLayer ?? []) as TestDataLayerEvent[];
}

describe('GoogleAnalyticsExtension', () => {
  let video: HTMLVideoElement;

  beforeEach(() => {
    video = document.createElement('video');
    video.src = 'https://example.com/video.mp4';
    video.title = 'Test Video';
    Object.defineProperty(video, 'duration', { value: 100, writable: true });
    Object.defineProperty(video, 'currentTime', { value: 0, writable: true });
    Object.defineProperty(video, 'muted', { value: false, writable: true });
    Object.defineProperty(video, 'volume', { value: 1, writable: true });

    window.dataLayer = [];
    delete window.gtag;
  });

  afterEach(() => {
    window.dataLayer = [];
    delete window.gtag;
  });

  it('tracks play and video_start on first play', () => {
    const extension = new GoogleAnalyticsExtension();

    extension.connect({ initTime: 1000 });
    extension.attach({ media: video, container: mockContainer });

    video.dispatchEvent(new Event('play'));

    const events = getDataLayer().map((e) => e.event);

    expect(events).toContain('play');
    expect(events).toContain('video_start');
    expect(getDataLayer()[0]?.video_stream_type).toBe('vod');
  });

  it('tracks pause and resume on subsequent plays', () => {
    const extension = new GoogleAnalyticsExtension();

    extension.attach({ media: video, container: mockContainer });

    video.dispatchEvent(new Event('play')); // initial play
    video.dispatchEvent(new Event('pause')); // pause
    video.dispatchEvent(new Event('play')); // resume

    const events = getDataLayer().map((e) => e.event);

    expect(events).toContain('play');
    expect(events).toContain('pause');
    expect(events).toContain('resume');
  });

  it('tracks seek on seeked event', () => {
    const extension = new GoogleAnalyticsExtension();

    extension.attach({ media: video, container: mockContainer });

    Object.defineProperty(video, 'currentTime', { value: 45 });
    video.dispatchEvent(new Event('seeked'));

    const seekEvent = getDataLayer().find((e) => e.event === 'seek');

    expect(seekEvent).toBeDefined();
    expect(seekEvent?.video_current_time).toBe(45);
  });

  it('tracks mute and unmute events on volumechange', () => {
    const extension = new GoogleAnalyticsExtension();

    extension.attach({ media: video, container: mockContainer });

    // Mute the video
    Object.defineProperty(video, 'muted', { value: true });
    video.dispatchEvent(new Event('volumechange'));

    // Unmute the video
    Object.defineProperty(video, 'muted', { value: false });
    video.dispatchEvent(new Event('volumechange'));

    const events = getDataLayer().map((e) => e.event);

    expect(events).toContain('mute');
    expect(events).toContain('unmute');
  });

  it('tracks end and video_complete on ended', () => {
    const extension = new GoogleAnalyticsExtension();

    extension.attach({ media: video, container: mockContainer });

    video.dispatchEvent(new Event('play'));
    Object.defineProperty(video, 'currentTime', { value: 100 });
    video.dispatchEvent(new Event('ended'));

    const events = getDataLayer().map((e) => e.event);

    expect(events).toContain('end');
    expect(events).toContain('video_complete');
  });

  it('tracks fullscreenEnter and fullscreenExit', () => {
    const container: MediaContainer = document.createElement('div');
    const extension = new GoogleAnalyticsExtension();

    extension.attach({ media: video, container });

    // Enter fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      value: container,
      configurable: true,
      writable: true,
    });
    document.dispatchEvent(new Event('fullscreenchange'));

    // Exit fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      configurable: true,
      writable: true,
    });
    document.dispatchEvent(new Event('fullscreenchange'));

    const events = getDataLayer().map((e) => e.event);

    expect(events).toContain('fullscreenEnter');
    expect(events).toContain('fullscreenExit');
  });

  it('tracks video_progress milestones at 10, 25, 50, and 75 percent', () => {
    const extension = new GoogleAnalyticsExtension();

    extension.attach({ media: video, container: mockContainer });

    video.dispatchEvent(new Event('play'));

    // Advance to 10%
    Object.defineProperty(video, 'currentTime', { value: 10 });
    video.dispatchEvent(new Event('timeupdate'));

    // Advance to 50%
    Object.defineProperty(video, 'currentTime', { value: 50 });
    video.dispatchEvent(new Event('timeupdate'));

    const progressEvents = getDataLayer().filter((e) => e.event === 'video_progress');
    const percents = progressEvents.map((e) => e.video_percent);

    expect(percents).toEqual([10, 25, 50]);
  });

  it('reports default video_stream_type as vod', () => {
    const extension = new GoogleAnalyticsExtension();

    extension.attach({ media: video, container: mockContainer });
    video.dispatchEvent(new Event('play'));

    const playEvent = getDataLayer().find((e) => e.event === 'play');

    expect(playEvent?.video_stream_type).toBe('vod');
  });

  it('reports custom video_stream_type when configured', () => {
    const extension = new GoogleAnalyticsExtension({ streamType: 'live' });

    extension.attach({ media: video, container: mockContainer });
    video.dispatchEvent(new Event('play'));

    const playEvent = getDataLayer().find((e) => e.event === 'play');

    expect(playEvent?.video_stream_type).toBe('live');
  });

  it('updates video_stream_type when property changes', () => {
    const extension = new GoogleAnalyticsExtension({ streamType: 'vod' });

    extension.attach({ media: video, container: mockContainer });
    extension.streamType = 'live';
    video.dispatchEvent(new Event('play'));

    const playEvent = getDataLayer().find((e) => e.event === 'play');

    expect(playEvent?.video_stream_type).toBe('live');
  });

  it('calls onEvent callback for interaction events', () => {
    const onEvent = vi.fn();
    const extension = new GoogleAnalyticsExtension({ onEvent, streamType: 'live' });

    extension.attach({ media: video, container: mockContainer });

    video.dispatchEvent(new Event('play'));

    expect(onEvent).toHaveBeenCalledWith('play', expect.objectContaining({ video_stream_type: 'live' }));
    expect(onEvent).toHaveBeenCalledWith('video_start', expect.objectContaining({ video_stream_type: 'live' }));
  });
});
