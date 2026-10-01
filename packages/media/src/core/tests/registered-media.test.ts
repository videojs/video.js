import { describe, expect, it } from 'vite-plus/test';

import { REGISTERED_MEDIA, getRegisteredMedia } from '../registered-media';

describe('getRegisteredMedia', () => {
  it('returns the media a facade answers for the registered media key', () => {
    const registered = { paused: true };
    const facade = { [REGISTERED_MEDIA]: registered };

    expect(getRegisteredMedia(facade)).toBe(registered);
  });

  it('returns anything else as is', () => {
    const media = { paused: true };

    expect(getRegisteredMedia(media)).toBe(media);
    expect(getRegisteredMedia(null)).toBeNull();
    expect(getRegisteredMedia(undefined)).toBeUndefined();
  });

  it('uses a registry symbol so separate package copies agree on the key', () => {
    expect(REGISTERED_MEDIA).toBe(Symbol.for('@videojs/media/registered'));
  });
});
