import { describe, expect, it } from 'vite-plus/test';

import { parseKalturaSource } from '../kaltura';

const ENTRY = { partnerId: 243342, entryId: '1_sf5ovm7u' };

describe('parseKalturaSource', () => {
  it('parses the kaltura/<partnerId>/<entryId> shorthand', () => {
    expect(parseKalturaSource('kaltura/243342/1_sf5ovm7u')).toEqual(ENTRY);
    expect(parseKalturaSource(' kaltura/243342/1_sf5ovm7u/ ')).toEqual(ENTRY);
  });

  it('parses a V2 embed, with or without iframeembed, keeping its player and session', () => {
    const embed =
      'https://cdnapisec.kaltura.com/p/243342/sp/24334200/embedIframeJs/uiconf_id/28685261/partner_id/243342?entry_id=1_sf5ovm7u';

    expect(parseKalturaSource(embed)).toEqual({ ...ENTRY, uiConfId: 28685261 });
    expect(parseKalturaSource(`${embed}&iframeembed=true&flashvars[ks]=djJ8MjQzMzQy`)).toEqual({
      ...ENTRY,
      uiConfId: 28685261,
      ks: 'djJ8MjQzMzQy',
    });
  });

  it('parses a V7 embed', () => {
    expect(
      parseKalturaSource(
        'https://cdnapisec.kaltura.com/p/4834032/embedPlaykitJs/uiconf_id/50952692?iframeembed=true&entry_id=1_fwzaeesq'
      )
    ).toEqual({ partnerId: 4834032, entryId: '1_fwzaeesq', uiConfId: 50952692 });
  });

  it('parses a V2 frame, a legacy kwidget embed, and a preview page', () => {
    expect(
      parseKalturaSource(
        'https://cdnapisec.kaltura.com/html5/html5lib/v2.56/mwEmbedFrame.php/p/243342/uiconf_id/28685261/entry_id/1_sf5ovm7u?wid=_243342&iframeembed=true'
      )
    ).toEqual({ ...ENTRY, uiConfId: 28685261 });
    expect(
      parseKalturaSource('https://www.kaltura.com/index.php/kwidget/wid/_243342/uiconf_id/28685261/entry_id/1_sf5ovm7u')
    ).toEqual({ ...ENTRY, uiConfId: 28685261 });
    expect(
      parseKalturaSource(
        'https://www.kaltura.com/index.php/extwidget/preview/partner_id/243342/uiconf_id/28685261/entry_id/1_sf5ovm7u/embed/dynamic'
      )
    ).toEqual({ ...ENTRY, uiConfId: 28685261 });
  });

  it('keeps an HLS playManifest URL to play as written, with the session it carries', () => {
    const manifest =
      'https://cdnapisec.kaltura.com/p/243342/sp/24334200/playManifest/entryId/1_sf5ovm7u/format/applehttp/protocol/https/ks/djJ8MjQzMzQy/a.m3u8';

    expect(parseKalturaSource(manifest)).toEqual({ ...ENTRY, ks: 'djJ8MjQzMzQy', manifestUrl: manifest });
  });

  it('keeps no other playManifest format to play, since only HLS plays as written', () => {
    expect(
      parseKalturaSource(
        'https://cdnapisec.kaltura.com/p/243342/sp/24334200/playManifest/entryId/1_sf5ovm7u/format/mpegdash/protocol/https/a.mpd?ks=djJ8MjQzMzQy'
      )
    ).toEqual({ ...ENTRY, ks: 'djJ8MjQzMzQy' });
    expect(
      parseKalturaSource('https://cdnapisec.kaltura.com/p/243342/playManifest/entryId/1_sf5ovm7u/format/url/a.mp4')
    ).toEqual(ENTRY);
  });

  it('keeps the origin of a deployment other than the SaaS hosts', () => {
    expect(
      parseKalturaSource('https://api.ca.kaltura.com/p/105/embedPlaykitJs/uiconf_id/7?entry_id=0_abcd1234')
    ).toEqual({ partnerId: 105, entryId: '0_abcd1234', uiConfId: 7, serviceUrl: 'https://api.ca.kaltura.com' });
    expect(
      parseKalturaSource(
        'http://video.example.edu/p/105/sp/10500/embedIframeJs/uiconf_id/7/partner_id/105?entry_id=0_abcd1234'
      )?.serviceUrl
    ).toBe('http://video.example.edu');
    expect(
      parseKalturaSource('http://cdnapi.kaltura.com/p/243342/embedPlaykitJs/uiconf_id/1?entry_id=1_sf5ovm7u')
    ).toEqual({
      ...ENTRY,
      uiConfId: 1,
    });
  });

  it.each([
    ['a bare entry id', '1_sf5ovm7u'],
    ['a shorthand without a partner', 'kaltura/1_sf5ovm7u'],
    ['a shorthand with a malformed partner', 'kaltura/acme/1_sf5ovm7u'],
    ['a shorthand with a malformed entry', 'kaltura/243342/sf5ovm7u'],
    ['an embed without an entry', 'https://cdnapisec.kaltura.com/p/4834032/embedPlaykitJs/uiconf_id/50952692'],
    ['a thumbnail', 'https://cdnapisec.kaltura.com/p/243342/thumbnail/entry_id/1_sf5ovm7u/width/640'],
    ['a page on the host', 'https://corp.kaltura.com/p/243342/entry_id/1_sf5ovm7u'],
    ['a non-http URL', 'ftp://cdnapisec.kaltura.com/p/243342/playManifest/entryId/1_sf5ovm7u'],
    ['an empty string', ''],
  ])('returns null for %s', (_, src) => {
    expect(parseKalturaSource(src)).toBe(null);
  });
});
