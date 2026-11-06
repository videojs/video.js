import type { RelaySubscriberView } from '@videojs/relay-video';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { RelayVideo } from '../relay-video/adapter';

const namespace = ['live', 'room'];

function createSubscriber() {
  return {
    want: vi.fn<RelaySubscriberView['want']>(),
    unwant: vi.fn<RelaySubscriberView['unwant']>(),
    catchUp: vi.fn<RelaySubscriberView['catchUp']>(),
    status: 'live' as const,
    closed: new Promise<{ error?: unknown }>(() => {}),
  };
}

let count = 0;

function createElement(): RelayVideo {
  const tag = `test-relay-video-${++count}`;

  customElements.define(tag, class extends RelayVideo {});

  const element = document.createElement(tag) as RelayVideo;

  document.body.append(element);
  return element;
}

describe('RelayVideo', () => {
  beforeEach(() => {
    vi.stubGlobal('VideoDecoder', class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('renders a canvas and reports no stream until it has a source', () => {
    const element = createElement();

    expect(element.shadowRoot?.querySelector('canvas')).not.toBeNull();
    expect(element.streamType).toBe('unknown');
    expect([element.videoWidth, element.videoHeight]).toEqual([0, 0]);
  });

  it('wants the catalog of the source it is given, as a live stream', () => {
    const element = createElement();
    const subscriber = createSubscriber();

    element.source = { subscriber, namespace };

    expect(subscriber.want).toHaveBeenCalledWith(
      expect.stringMatching(/catalog$/),
      { namespace, track: 'catalog' },
      expect.any(Object)
    );
    expect(element.streamType).toBe('live');
  });

  it('releases its wants when removed from the document', async () => {
    const element = createElement();
    const subscriber = createSubscriber();

    element.source = { subscriber, namespace };

    const [key] = subscriber.want.mock.calls[0]!;

    element.remove();
    await Promise.resolve();

    expect(subscriber.unwant).toHaveBeenCalledWith(key);
  });
});
