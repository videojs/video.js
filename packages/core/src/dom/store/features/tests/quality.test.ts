import type { VideoRenditionLike } from '@videojs/media';
import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { qualityFeature } from '../quality';

class TestRenditionList extends EventTarget {
  renditions: VideoRenditionLike[];

  constructor(renditions: VideoRenditionLike[]) {
    super();
    this.renditions = renditions;
  }

  [Symbol.iterator](): Iterator<VideoRenditionLike> {
    return this.renditions.values();
  }

  get length(): number {
    return this.renditions.length;
  }

  get selectedIndex(): number {
    return this.renditions.findIndex((rendition) => rendition.selected);
  }

  set selectedIndex(index: number) {
    for (const [renditionIndex, rendition] of this.renditions.entries()) {
      rendition.selected = renditionIndex === index;
    }
  }
}

class TestTrackList extends EventTarget {
  [Symbol.iterator](): Iterator<unknown> {
    return [][Symbol.iterator]();
  }
}

class TestMedia extends EventTarget {
  videoRenditions: TestRenditionList | undefined = undefined;
  videoTracks = new TestTrackList();
  videoWidth = 0;
  videoHeight = 0;

  constructor(renditions?: VideoRenditionLike[]) {
    super();

    if (renditions) this.videoRenditions = new TestRenditionList(renditions);
  }

  async play() {}
}

function createRendition(overrides: Partial<VideoRenditionLike>): VideoRenditionLike {
  return {
    id: undefined,
    width: undefined,
    height: undefined,
    bitrate: undefined,
    frameRate: undefined,
    codec: undefined,
    selected: false,
    ...overrides,
  };
}

function createMedia(renditions: VideoRenditionLike[]): PlayerTarget['media'] {
  return new TestMedia(renditions) as unknown as PlayerTarget['media'];
}

describe('qualityFeature', () => {
  it('syncs video renditions on attach', () => {
    const media = createMedia([
      createRendition({ id: '0', height: 1080, bitrate: 6_000_000 }),
      createRendition({ id: '1', height: 720, bitrate: 3_000_000 }),
    ]);
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    expect(store.state.videoRenditionList).toEqual([
      { id: '0', height: 1080, bitrate: 6_000_000, selected: false },
      { id: '1', height: 720, bitrate: 3_000_000, selected: false },
    ]);
    expect(store.state.activeVideoRendition).toBeNull();
  });

  it('syncs video renditions after loadstart', () => {
    const media = new TestMedia() as unknown as PlayerTarget['media'];
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    expect(store.state.videoRenditionList).toEqual([]);

    const list = new TestRenditionList([createRendition({ id: '0', height: 1080 })]);

    (media as unknown as TestMedia).videoRenditions = list;
    media.dispatchEvent(new Event('loadstart'));

    expect(store.state.videoRenditionList).toEqual([{ id: '0', height: 1080, selected: false }]);

    list.renditions.push(createRendition({ id: '1', height: 720 }));
    list.dispatchEvent(new Event('addrendition'));

    expect(store.state.videoRenditionList).toEqual([
      { id: '0', height: 1080, selected: false },
      { id: '1', height: 720, selected: false },
    ]);
  });

  it('assigns positional ids to renditions without a media id', () => {
    const media = createMedia([createRendition({ height: 1080 }), createRendition({ height: 720, active: true })]);
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    expect(store.state.videoRenditionList).toEqual([
      { id: '0', height: 1080, selected: false },
      { id: '1', height: 720, selected: false },
    ]);
    expect(store.state.activeVideoRendition).toEqual(store.state.videoRenditionList[1]);
  });

  it('selects automatic quality', () => {
    const media = createMedia([
      createRendition({ id: '0', height: 1080, selected: true }),
      createRendition({ id: '1', height: 720 }),
    ]);
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    store.state.selectVideoRendition('auto');

    expect((media as any).videoRenditions.selectedIndex).toBe(-1);
  });

  it('selects a rendition by value', () => {
    const media = createMedia([createRendition({ id: '0', height: 1080 }), createRendition({ id: '1', height: 720 })]);
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    store.state.selectVideoRendition('1');

    expect((media as any).videoRenditions.selectedIndex).toBe(1);
  });

  it('resyncs on rendition change', () => {
    const media = createMedia([createRendition({ id: '0', height: 1080 }), createRendition({ id: '1', height: 720 })]);
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    (media as any).videoRenditions.renditions[1].selected = true;
    (media as any).videoRenditions.dispatchEvent(new Event('change'));

    expect(store.state.videoRenditionList[1]?.selected).toBe(true);
  });

  it('syncs the active video rendition', () => {
    const media = createMedia([
      createRendition({ id: '0', height: 1080 }),
      createRendition({ id: '1', height: 720, active: true }),
    ]);
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    expect(store.state.activeVideoRendition).toEqual({ id: '1', height: 720, selected: false });

    (media as any).videoRenditions.renditions[1].active = false;
    (media as any).videoRenditions.renditions[0].active = true;
    (media as any).videoRenditions.dispatchEvent(new Event('activechange'));

    expect(store.state.activeVideoRendition).toEqual({ id: '0', height: 1080, selected: false });
  });

  it('falls back to video dimensions for the active rendition', () => {
    const media = createMedia([createRendition({ id: '0', height: 1080 }), createRendition({ id: '1', height: 720 })]);
    const testMedia = media as unknown as TestMedia;

    testMedia.videoWidth = 1280;
    testMedia.videoHeight = 720;
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    expect(store.state.activeVideoRendition).toEqual({ id: '1', height: 720, selected: false });

    testMedia.videoWidth = 1920;
    testMedia.videoHeight = 1080;
    media.dispatchEvent(new Event('resize'));

    expect(store.state.activeVideoRendition).toEqual({ id: '0', height: 1080, selected: false });
  });

  it('does not fall back when multiple renditions share the video dimensions', () => {
    const media = createMedia([
      createRendition({ id: '0', height: 1080, bitrate: 6_000_000 }),
      createRendition({ id: '1', height: 1080, bitrate: 3_000_000 }),
      createRendition({ id: '2', height: 720, bitrate: 1_500_000 }),
    ]);
    const testMedia = media as unknown as TestMedia;

    testMedia.videoWidth = 1920;
    testMedia.videoHeight = 1080;
    const store = createStore<PlayerTarget>()(qualityFeature);

    store.attach({ media, container: null });

    expect(store.state.activeVideoRendition).toBeNull();

    testMedia.videoWidth = 1280;
    testMedia.videoHeight = 720;
    media.dispatchEvent(new Event('resize'));

    expect(store.state.activeVideoRendition).toEqual({
      id: '2',
      height: 720,
      bitrate: 1_500_000,
      selected: false,
    });
  });
});
