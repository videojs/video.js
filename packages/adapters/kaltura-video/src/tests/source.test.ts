import { describe, expect, it } from 'vite-plus/test';

import { KALTURA_SERVICE_URL, readKalturaSourceFields, toKalturaEntryRequest } from '../source';

const MANIFEST =
  'https://cdnapisec.kaltura.com/p/243342/sp/24334200/playManifest/entryId/0_uka1msg4/format/applehttp/protocol/https/a.m3u8';

describe('readKalturaSourceFields', () => {
  it('reads the identity a Kaltura URL carries, but not the URL itself', () => {
    expect(readKalturaSourceFields(`${MANIFEST}?ks=YXBwLWtz`)).toEqual({
      partnerId: 243342,
      entryId: '0_uka1msg4',
      ks: 'YXBwLWtz',
    });
  });

  it('reads nothing from any other URL', () => {
    expect(readKalturaSourceFields('https://example.com/video.m3u8')).toEqual({});
  });
});

describe('toKalturaEntryRequest', () => {
  it('names no entry without a partner and an entry', () => {
    expect(toKalturaEntryRequest(null)).toBeNull();
    expect(toKalturaEntryRequest({ src: 'https://example.com/video.m3u8' })).toBeNull();
    expect(toKalturaEntryRequest({ entryId: '0_uka1msg4' })).toBeNull();
  });

  it("defaults to Kaltura's SaaS deployment and trims its API path", () => {
    expect(toKalturaEntryRequest({ partnerId: 1, entryId: '0_abc' })?.serviceUrl).toBe(KALTURA_SERVICE_URL);
    expect(
      toKalturaEntryRequest({ partnerId: 1, entryId: '0_abc', serviceUrl: 'https://kaltura.example.edu/api_v3/' })
        ?.serviceUrl
    ).toBe('https://kaltura.example.edu');
  });

  it('lets fields on the source win over what src implies', () => {
    expect(
      toKalturaEntryRequest({ src: `${MANIFEST}?ks=c3JjLWtz`, ks: 'ZmllbGQta3M', serviceUrl: 'https://other.test' })
    ).toMatchObject({ partnerId: 243342, entryId: '0_uka1msg4', ks: 'ZmllbGQta3M', serviceUrl: 'https://other.test' });
  });

  it('plays a playManifest URL as written only while it names the same entry', () => {
    expect(toKalturaEntryRequest({ src: MANIFEST })?.manifestUrl).toBe(MANIFEST);
    expect(toKalturaEntryRequest({ src: MANIFEST, entryId: '1_sf5ovm7u' })?.manifestUrl).toBeUndefined();
  });
});
