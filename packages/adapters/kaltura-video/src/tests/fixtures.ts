// Trimmed from what Kaltura answers for partner 243342's public demo entries.

export const WIDGET_SESSION = {
  partnerId: 243342,
  ks: 'd2lkZ2V0LWtz',
  userId: 0,
  objectType: 'KalturaStartWidgetSessionResponse',
};

export const ENTRY_LIST = {
  totalCount: 1,
  objects: [
    {
      id: '0_uka1msg4',
      name: 'Folgers Coffee',
      type: 1,
      moderationStatus: 5,
      objectType: 'KalturaMediaEntry',
    },
  ],
  objectType: 'KalturaBaseEntryListResponse',
};

const MANIFEST = 'https://cdnapisec.kaltura.com/p/243342/sp/243342/playManifest/entryId/0_uka1msg4';

export const HLS_STREAM = `${MANIFEST}/flavorIds/1_vqhfu6uy,1_80sohj7p/deliveryProfileId/13942/protocol/https/format/applehttp/a.m3u8`;
export const OTHER_HLS_STREAM = `${MANIFEST}/flavorIds/1_vqhfu6uy,1_80sohj7p/deliveryProfileId/5372/protocol/https/format/applehttp/a.m3u8`;

export const PLAYBACK_CONTEXT = {
  sources: [
    {
      format: 'url',
      url: `${MANIFEST}/flavorIds/0_m0tvl0s4/deliveryProfileId/92/protocol/https/format/url/name/a.flv`,
      deliveryProfileId: 92,
      protocols: 'http,https',
      drm: [],
      objectType: 'KalturaPlaybackSource',
    },
    {
      format: 'mpegdash',
      url: `${MANIFEST}/flavorIds/1_vqhfu6uy/deliveryProfileId/4662/protocol/https/format/mpegdash/manifest.mpd`,
      deliveryProfileId: 4662,
      protocols: 'http,https',
      drm: [],
      objectType: 'KalturaPlaybackSource',
    },
    {
      format: 'applehttp',
      url: HLS_STREAM,
      deliveryProfileId: 13942,
      protocols: 'http,https',
      drm: [],
      objectType: 'KalturaPlaybackSource',
    },
    {
      format: 'applehttp',
      url: OTHER_HLS_STREAM,
      deliveryProfileId: 5372,
      protocols: 'http,https',
      drm: [],
      objectType: 'KalturaPlaybackSource',
    },
  ],
  playbackCaptions: [],
  flavorAssets: [],
  actions: [],
  messages: [],
  objectType: 'KalturaPlaybackContext',
};

/** What `liveStream.isLive` answers for an entry that is not a live stream. */
export const NOT_A_LIVE_ENTRY = apiException('INVALID_ENTRY_ID', 'Invalid entry id ["0_uka1msg4"]');

export const PUBLIC_ENTRY = [WIDGET_SESSION, ENTRY_LIST, PLAYBACK_CONTEXT, NOT_A_LIVE_ENTRY];

export function apiException(code: string, message: string) {
  return { code, message, objectType: 'KalturaAPIException', args: {} };
}
