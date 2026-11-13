import { describe, expect, it } from 'vite-plus/test';

import { aacCodec } from '../codecs/aac';
import type { TransmuxCodec } from '../codecs/codec';
import { createTransmuxer } from '../transmux';
import { aacSegment } from './synthetic-ts';

/**
 * A second track framed from the same AAC stream under its own family and track id, which a test can empty for a
 * segment. It stands in for the track a muxed segment can lack, such as audio with no complete ADTS frame.
 */
function switchableCodec() {
  let present = true;
  const codec: TransmuxCodec = {
    streamType: aacCodec.streamType,
    family: 'test',
    frame(packets, options) {
      const framed = present ? aacCodec.frame(packets, options) : undefined;

      return framed && { ...framed, track: { ...framed.track, id: 3 } };
    },
  };

  return {
    codec,
    setPresent: (value: boolean) => {
      present = value;
    },
  };
}

describe('createTransmuxer', () => {
  it('builds an init segment for the first segment and not for one that matches it', () => {
    const transmux = createTransmuxer([aacCodec]);

    const first = transmux(aacSegment());
    const second = transmux(aacSegment(), { deliveredInitKey: first.initKey });

    expect(first.init).toBeDefined();
    expect(second.init).toBeUndefined();
    expect(second.initKey).toBe(first.initKey);
  });

  it('builds an init segment when the sample entries change', () => {
    const transmux = createTransmuxer([aacCodec]);

    const first = transmux(aacSegment({ samplingIndex: 3 }));
    const switched = transmux(aacSegment({ samplingIndex: 4 }), { deliveredInitKey: first.initKey });

    expect(switched.init).toBeDefined();
    expect(switched.initKey).not.toBe(first.initKey);
  });

  it('keeps every track in the init when a segment is missing one track', () => {
    const { codec, setPresent } = switchableCodec();
    const transmux = createTransmuxer([aacCodec, codec]);

    const both = transmux(aacSegment());

    setPresent(false);
    const missing = transmux(aacSegment(), { deliveredInitKey: both.initKey });

    setPresent(true);
    const restored = transmux(aacSegment(), { deliveredInitKey: missing.initKey });

    expect(Object.keys(missing.tracks)).toEqual(['mp4a']);
    expect(missing.init).toBeUndefined();
    expect(missing.initKey).toBe(both.initKey);
    expect(restored.init).toBeUndefined();
  });
});
