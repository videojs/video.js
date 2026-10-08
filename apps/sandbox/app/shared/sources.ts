import type { MuxSource } from '@videojs/mux-video';
import type { DrmSystemsConfig } from '@videojs/spf/hls';
import type { YouTubeEngineConfig, YouTubeSource } from '@videojs/youtube-video';

import { getMuxAssetId } from './mux';

export interface ChapterTrack {
  label: string;
  lang: string;
  src: string;
  isDefault: boolean;
}

export interface SandboxSource {
  label: string;
  /** Plain media URL. Absent when the source needs more than a URL can carry. */
  url?: string;
  /** `youtube` is a YouTube page URL for `<youtube-video>` rather than a media file or manifest. */
  type: 'hls' | 'mp4' | 'dash' | 'none' | 'youtube';
  subType?: 'ts' | 'mp4';
  live?: boolean;
  /** DRM protected, so only a preset that can license it should offer it. */
  drm?: boolean;
  /**
   * Ready-made poster image URL, for a source with no Mux playback ID to derive one from. Takes precedence over the
   * derived URL.
   */
  poster?: string;
  /**
   * Structured source, for what a plain `url` cannot express. Takes precedence.
   *
   * `drm` widens Mux's authoring input to SPF's per-system config as an alternative: a third-party provider names its
   * own license server and, like Axinom, may authenticate the request with `headers` that Mux's token-derived shape has
   * no field for.
   */
  source?: Omit<MuxSource, 'drm'> & { drm?: MuxSource['drm'] | DrmSystemsConfig };
  chapters?: readonly ChapterTrack[];
  /** YouTube player parameters, for a YouTube source whose embed needs more than its URL can carry. */
  youtube?: YouTubeEngineConfig;
}

// The two DRM sources below are the same Mux asset reached two ways, so the
// tokens are shared rather than repeated. DRM playback is always signed, and
// each URL carries its own audience-scoped token: `playback` for the manifest,
// `drm` for the license request, `thumbnail` / `storyboard` for the images.
//
// Read-only tokens for a throwaway demo asset, signed to expire in 2038 so the
// sandbox keeps working. They grant nothing beyond playing this one video.
const DRM_PLAYBACK_ID = 'FefhWnSMzDqz5z9yxssihdRx8dV6srhYJ8301uQBhRak';

const DRM_TOKENS = {
  playback:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJGZWZoV25TTXpEcXo1ejl5eHNzaWhkUng4ZFY2c3JoWUo4MzAxdVFCaFJhayIsImF1ZCI6InYiLCJleHAiOjIxNDc0ODM2NDd9.jXIpJZPB7diM5M6jMVRQ6dELY5YnONzC8jJClm7CT1nm-q25F5PiCvHcdLGqerjN1V_7T9cjhSX02p1i0UiABaKX2Wa4HCf6H6ZSKbY3MiCiRJHnfZzr_cVHCuBRXJlMzXesK_VzgP4kVrVi9-Sj8fGaeQmt4mB0sgtGGM7LpGV1IJdv_9aWnqQpQK7IeWi9ivNwa9Vw-PeppfOFdyQbqYJScIAY-_k6fzGaQucONyIolFGJZuBcan3nDRvCUpSFi0vPO87jf5Zbp6kn-HeARmUTYDPBLoeVSjttxYhoeDQYtNeqbuJ3Tj6S1_9TsE_SNSNZm3lxHoJCz5Wp_YcusQ',
  drm: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJGZWZoV25TTXpEcXo1ejl5eHNzaWhkUng4ZFY2c3JoWUo4MzAxdVFCaFJhayIsImF1ZCI6ImQiLCJleHAiOjIxNDc0ODM2NDd9.y7WKwBu0n87GaluPBJEMul4mxh-UlOFG_zClbEj3aZ23fXYmSfrpw-H2P3iFKtYt0DKiL-ta-J7EWiA74s77DTH2R70F86tvEFD0NQZ197qqClWtigOKkrpL1_o5RMXqjRf0lLAfwL6IFqm_Vhzf7mQTG99FRXKIU8S1q-zAEglWCYy1uZxQPivnSZxtK4IZZWmhHG6ot-VP_QkACc9cH8DIOpdYavjdXsPAxs3Ejx9ZUBQSqkjE7zyd11HhQvNzm9V_YxHJz5QgayOeWLEmwaKycFycHrR-INdVQwFAoK3EHF-tZngQpINuYoUHN5dPwzC8VJoFneLmdNAVuzbLkw',
  thumbnail:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJGZWZoV25TTXpEcXo1ejl5eHNzaWhkUng4ZFY2c3JoWUo4MzAxdVFCaFJhayIsImF1ZCI6InQiLCJleHAiOjIxNDc0ODM2NDd9.gzoiMPjqjRSS8F1PjrvaOX4a0J9m-L1Egx3DIQVWbTWr89T21cSMJI5mPKs89umv0f7tvZjHjIaUY6L1wmdGR3FwVBLj5nvWx1DPWayJvqZbIv-2DoSCbTdui5tsPvgxtAAfmX_GGvb1UB4apGY6njapHmzMT__oTHTKvAM8e4waJGswtv9cr6V3TE8ysSqdS3_Cbme5e69S3IULjLHl21JSrHK-ABY7IzNxLOoT8lbyh77P3NMw-jF2joRVQK6hZJnAMY99_k8K2hRmGEQRMw-NTtOeM1gWQar6-Ksb7ZOZidshCHHqI69iF_ricl-Csb_c4O3ai3BZLviM7ZXRVg',
  storyboard:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJGZWZoV25TTXpEcXo1ejl5eHNzaWhkUng4ZFY2c3JoWUo4MzAxdVFCaFJhayIsImF1ZCI6InMiLCJleHAiOjIxNDc0ODM2NDd9.Eh5a51KEYRbwWIvX7M3Z-9hMwmydt2XC9kq0m-oCmnSegnN0l-GOQoUvzFMOOCKJHbfVRTuLkEvoCjCgo1JEmTHKRDo7u_V5JDZbQf6xKjtJXlTEibNEi_wD3M_3DiuYYv3R5sNol97j-yGbJQ8_16HTv7muJhr7qI8S9sKr_zJgp_E0PyFBm6plaigWcDBMcXfcvK4I9IwTKBehlXw2sVy6eUarhmS_wtA6sNXJk8f2RG2fUnt6jq8HWQlpkrXTqJCDcQ69dwDzl_TOdDWWLN3dNBlmGyEjEZyHJD2podRdddV4Yu78_bq7ImCH05JpJqY_caX9seXS6uJh38HuIA',
} as const;

// Signed playback, the non-DRM half of Mux's protected playback. These are the
// `hls-3` and `hls-audio-only-cmaf` assets again, each given a second playback
// ID whose policy is `signed`: the public IDs above still play unsigned, these
// two answer 403 without a token. Every URL derived from one carries its own
// audience-scoped token, exactly as the DRM asset does.
//
// Read-only tokens for demo assets, signed to expire in 2038 so the sandbox
// keeps working. They grant nothing beyond playing these two.
const SIGNED_PLAYBACK_ID = 'fRL8fOesiMjQPieNYbp5fE3gxbLfx33iyeyaTTFkH54';
const SIGNED_AUDIO_PLAYBACK_ID = 'k01NS53023biEozpmRz2fhIlzqPOLRWnguwaWp2YvGDfw';

const SIGNED_TOKENS = {
  playback:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJmUkw4Zk9lc2lNalFQaWVOWWJwNWZFM2d4YkxmeDMzaXlleWFUVEZrSDU0IiwiYXVkIjoidiIsImV4cCI6MjE0NzQ4MzY0N30.r89KDYdFlGidWKNFm_9SrZwVH5EK465GtlkXxs5_1rAIQU88OS9JQ2jHZTulW8ug5ThGTDg8kuWYT3XWFOoPLZGeLXxhH_-6qySdbn60FahgF20ITy4M-wGYA7jjwn-58xHAsL7giqtjepXlRuxRIQLWqiEafQ6DGNdTzULRo86nCP-cXHztfWRdynv84Of89ou8t5fO5wO7IcQnCHn97NLlLheCgI78u65W1FCsSjuDLBuiG1K1T1M4U02bn-e1GLLRBYjkOFQ6OUdc013L6m1Ou15xFbXZgX3JX7boXzmHouzj2Yj9HfzJqIwY534pQdHKoABXA6eAa7WzD3USPA',
  thumbnail:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJmUkw4Zk9lc2lNalFQaWVOWWJwNWZFM2d4YkxmeDMzaXlleWFUVEZrSDU0IiwiYXVkIjoidCIsImV4cCI6MjE0NzQ4MzY0N30.kXBmJjQZ9avJdRtLeO-D8FE-Fe6jlQKv356hZV_cVTv3o9TKL-YsFmh2x2wdq6EGqChXuR_geLlCDuPauI5poDYcfM48BhRDiipD6uj15B3F8rqHiYsPniTpvR5huVah0yPTqJQiTajROiRhcZVgsEyXewjPWkNLNOOCsKUToI9iEMKhLc1UAyZ5bw0sqFJMxe5QVEvKHp2fN5TFdDNlLycsuQW9UlaiNoHShYy8LmXzxQIQ5c0Z8SX8FYPHgW-6eHaOe1mafBliadgLN5JjJi7BPCROrVeqQiFj_F2aNeOhvWgqVz7husPCXZSwQZxPujIpS-XpLby1gphTXHpTtQ',
  storyboard:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJmUkw4Zk9lc2lNalFQaWVOWWJwNWZFM2d4YkxmeDMzaXlleWFUVEZrSDU0IiwiYXVkIjoicyIsImV4cCI6MjE0NzQ4MzY0N30.VxmkFpbIEqgFcEVDKJW7TysnnQtT47be0kjLKm6ZN5sUjOVyeeNGBp4TbCX63aZtkSoyvE-Lea9qUvartJ80Mh7WdaWaL7kA3WainnjpeI5EBvp_A1bHtXm7n2463wUeVUbv-0n9UuXVaRpUeyVBb-Yu7SfzP8FDtNIMVvoyvRmN4J4faHSQVFC_6F8uUldSkHNo_492oaA9CWsXmu1wZRIYtFuFOippTZkwbAieB0LtIq3E3Jixs7XTEVPmLjHZI-WJHqswToOUDYhB8iL7hCHkCFymNH7p15NFoWGxcumJ-XR3qg7KJJkSml42VO7plFwdlZ5MsEZeYJaSyLxM2Q',
} as const;

// Audio-only content has neither a thumbnail nor a storyboard to sign for.
const SIGNED_AUDIO_TOKENS = {
  playback:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndGcXlSYlRjZDZSaEJkMDJ3Wnd6YTAwR0htNnFVOUlQZTFJS1kwMHgzMDE2dUhBIn0.eyJzdWIiOiJrMDFOUzUzMDIzYmlFb3pwbVJ6MmZoSWx6cVBPTFJXbmd1d2FXcDJZdkdEZnciLCJhdWQiOiJ2IiwiZXhwIjoyMTQ3NDgzNjQ3fQ.FAvBKpLUsRYRivnbmDuk40-_e9OmrwBHqPz73qWiJP-HDDjwO8I9JZjxgQv8MFLrtshaIYWOZFJMD4voldG4ZuTqiYbDRxblWysRPfAUF1nOv0yGxDM60xK1r_-DbdXdyZMmADEedxnkQr5-xrTrwpnbht_pFSqKdnBw10QvW6S68DznZgFX8kvDzHbBKmZX0PZqyhFoEwTgK4g5drGJQYB6vw_-9nUbBChPE27Wzcj9-6IAO7VH90RKw8BuSm1t0qBKIvwlzh6QaflWY8jeqHtUoYBcEDw-Wp1c--MxuoFiRUtpwz2TkAwIKs9SUbAN2BHZXwxh4Y3n1wc8Oo9MtA',
} as const;

/**
 * License servers for the DRM asset below, named outright rather than derived from a Mux token. `source.drm` is engine
 * neutral, so naming every system here licenses whichever path the browser takes — native HLS reads the FairPlay entry
 * and leaves the rest to hls.js.
 */
const DRM_SYSTEMS = {
  'com.apple.fps': {
    licenseUrl: `https://license.mux.com/license/fairplay/${DRM_PLAYBACK_ID}?token=${DRM_TOKENS.drm}`,
    serverCertificateUrl: `https://license.mux.com/appcert/fairplay/${DRM_PLAYBACK_ID}?token=${DRM_TOKENS.drm}`,
  },
  'com.widevine.alpha': {
    licenseUrl: `https://license.mux.com/license/widevine/${DRM_PLAYBACK_ID}?token=${DRM_TOKENS.drm}`,
  },
  'com.microsoft.playready': {
    licenseUrl: `https://license.mux.com/license/playready/${DRM_PLAYBACK_ID}?token=${DRM_TOKENS.drm}`,
  },
} as const;

/**
 * Axinom's entitlement message for the `hls-drm-axinom` asset, sent as the `X-AxDRM-Message` request header. Published
 * test-vector credential, scoped to that one asset's content key (`302f80dd-411e-4886-bca5-bb1f8018a024`) — tokens and
 * assets are paired, so it licenses nothing else.
 *
 * Sent as a per-system `headers` entry, which is the only way this provider authenticates — the license URL carries no
 * credential of its own.
 */
export const AXINOM_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJ2ZXJzaW9uIjogMSwKICAiY29tX2tleV9pZCI6ICI2OWU1NDA4OC1lOWUwLTQ1MzAtOGMxYS0xZWI2ZGNkMGQxNGUiLAogICJtZXNzYWdlIjogewogICAgInR5cGUiOiAiZW50aXRsZW1lbnRfbWVzc2FnZSIsCiAgICAidmVyc2lvbiI6IDIsCiAgICAibGljZW5zZSI6IHsKICAgICAgImFsbG93X3BlcnNpc3RlbmNlIjogdHJ1ZQogICAgfSwKICAgICJjb250ZW50X2tleXNfc291cmNlIjogewogICAgICAiaW5saW5lIjogWwogICAgICAgIHsKICAgICAgICAgICJpZCI6ICIzMDJmODBkZC00MTFlLTQ4ODYtYmNhNS1iYjFmODAxOGEwMjQiLAogICAgICAgICAgImVuY3J5cHRlZF9rZXkiOiAicm9LQWcwdDdKaTFpNDNmd3YremZ0UT09IiwKICAgICAgICAgICJ1c2FnZV9wb2xpY3kiOiAiUG9saWN5IEEiCiAgICAgICAgfQogICAgICBdCiAgICB9LAogICAgImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjogWwogICAgICB7CiAgICAgICAgIm5hbWUiOiAiUG9saWN5IEEiLAogICAgICAgICJwbGF5cmVhZHkiOiB7CiAgICAgICAgICAibWluX2RldmljZV9zZWN1cml0eV9sZXZlbCI6IDE1MCwKICAgICAgICAgICJwbGF5X2VuYWJsZXJzIjogWwogICAgICAgICAgICAiNzg2NjI3RDgtQzJBNi00NEJFLThGODgtMDhBRTI1NUIwMUE3IgogICAgICAgICAgXQogICAgICAgIH0KICAgICAgfQogICAgXQogIH0KfQ._NfhLVY7S6k8TJDWPeMPhUawhympnrk6WAZHOVjER6M';

/**
 * The multi-key sibling of {@link AXINOM_TOKEN}, for `hls-drm-axinom-multikey`: Axinom's MultiKey vector declares a
 * distinct content key per quality tier, and this published token carries all three (`b54ec914-…`, `c83c4ea8-…`,
 * `c868c702-…`). The asset that makes SPF's eager per-key session fan-out observable — three license POSTs at startup.
 */
export const AXINOM_MULTIKEY_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJ2ZXJzaW9uIjogMSwKICAiY29tX2tleV9pZCI6ICI2OWU1NDA4OC1lOWUwLTQ1MzAtOGMxYS0xZWI2ZGNkMGQxNGUiLAogICJtZXNzYWdlIjogewogICAgInR5cGUiOiAiZW50aXRsZW1lbnRfbWVzc2FnZSIsCiAgICAidmVyc2lvbiI6IDIsCiAgICAibGljZW5zZSI6IHsKICAgICAgImFsbG93X3BlcnNpc3RlbmNlIjogdHJ1ZQogICAgfSwKICAgICJjb250ZW50X2tleXNfc291cmNlIjogewogICAgICAiaW5saW5lIjogWwogICAgICAgIHsKICAgICAgICAgICJpZCI6ICJiNTRlYzkxNC0xOTJkLTRlYTEtYWMxOS1mNDI5ZWI0OTgyNjgiLAogICAgICAgICAgImVuY3J5cHRlZF9rZXkiOiAiR1ZERnJZUU9Bb1kzZmpxVVVtamswQT09IiwKICAgICAgICAgICJ1c2FnZV9wb2xpY3kiOiAiUG9saWN5IEEiCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAiaWQiOiAiYzgzYzRlYTgtMGYyYS00NTIzLTg1MWMtZmJlY2NkYzBmMjAyIiwKICAgICAgICAgICJlbmNyeXB0ZWRfa2V5IjogIlRKZGZsWmJLYmZXQXl5K1dta21UUEE9PSIsCiAgICAgICAgICAidXNhZ2VfcG9saWN5IjogIlBvbGljeSBBIgogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgImlkIjogImM4NjhjNzAyLWM3MWItNDA2NC1hZTJiLWMyNGY3Y2MxMDc5MiIsCiAgICAgICAgICAiZW5jcnlwdGVkX2tleSI6ICJ4QXJpUkpOcUFTdXp6RExDRzNXSjdnPT0iLAogICAgICAgICAgInVzYWdlX3BvbGljeSI6ICJQb2xpY3kgQSIKICAgICAgICB9CiAgICAgIF0KICAgIH0sCiAgICAiY29udGVudF9rZXlfdXNhZ2VfcG9saWNpZXMiOiBbCiAgICAgIHsKICAgICAgICAibmFtZSI6ICJQb2xpY3kgQSIsCiAgICAgICAgInBsYXlyZWFkeSI6IHsKICAgICAgICAgICJtaW5fZGV2aWNlX3NlY3VyaXR5X2xldmVsIjogMTUwLAogICAgICAgICAgInBsYXlfZW5hYmxlcnMiOiBbCiAgICAgICAgICAgICI3ODY2MjdEOC1DMkE2LTQ0QkUtOEY4OC0wOEFFMjU1QjAxQTciCiAgICAgICAgICBdCiAgICAgICAgfQogICAgICB9CiAgICBdCiAgfQp9.XC0YIbZpKGFc3IZROklP4LvISc6cZGpE9UL-XcpcqWg';

const SOURCE_MAP = {
  'hls-1': {
    label: 'HLS - Big Buck Bunny',
    url: 'https://stream.mux.com/VcmKA6aqzIzlg3MayLJDnbF55kX00mds028Z65QxvBYaA.m3u8',
    type: 'hls',
    subType: 'ts',
  },
  'hls-2': {
    label: 'HLS - Elephants Dream',
    url: 'https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8',
    type: 'hls',
    subType: 'ts',
  },
  'hls-3': {
    label: 'HLS - Dancing Dude',
    url: 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  'hls-4': {
    label: 'HLS - View From A Blue Moon Trailer',
    url: 'https://stream.mux.com/lyrKpPcGfqyzeI00jZAfW6MvP6GNPrkML.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  'hls-5': {
    label: 'HLS - Mad Max Fury Road Trailer',
    url: 'https://stream.mux.com/JX01bG8eB4uaoV3OpDuK602rBfvdSgrMObjwuUOBn4JrQ.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  'hls-6': {
    label: 'HLS - Tailwind (portrait)',
    url: 'https://stream.mux.com/vth873zxidmhBVVRWBKcPTxnSQ302QqUm.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  'hls-7': {
    label: 'HLS - Dahlback Golf RSI (chapters)',
    url: 'https://stream.mux.com/yH00b01Lj2z023hUQdEf6EpURPROSsvE1qWPnR8ShnbnI8.m3u8',
    type: 'hls',
    subType: 'mp4',
    chapters: [
      {
        label: 'English',
        lang: 'en',
        src: new URL('./chapters-en.vtt?no-inline', import.meta.url).href,
        isDefault: true,
      },
    ],
  },
  'hls-multi-audio': {
    label: 'HLS - Multi-language audio',
    url: 'https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  'hls-instant-clip': {
    // Clipped 60s→600s of the multi-audio asset, so A/V encode at native PTS ≈ 60s.
    // Exercises non-zero-PTS timestampOffset relocation: currentTime stays 0-based.
    label: 'HLS - Instant Clip (non-zero PTS)',
    url: 'https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8?asset_start_time=60&asset_end_time=600',
    type: 'hls',
    subType: 'mp4',
  },
  /**
   * Apple's official HLS example stream (bipbop advanced, fMP4): HEVC and AVC renditions of the same content in one
   * multivariant playlist, which makes it the shared mixed-codec source — the initial pick decides a codec family and
   * SPF's ABR must hold it for the source's lifetime (no `SourceBuffer.changeType()`). Deliberately messy beyond the
   * codecs: not CMAF-compliant, ~44ms A/V origin skew, a 10s timestamp origin, and VTT subtitles relying on
   * `X-TIMESTAMP-MAP`.
   */
  'hls-mixed-codec': {
    label: 'HLS - Apple bipbop (HEVC + AVC)',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  // The `hls-3` and `hls-1` assets again, named by playback ID instead of URL.
  // Nothing about the content differs — they exist so the Mux presets exercise
  // the structured `source` on an ordinary public asset, where every other
  // source-shaped entry here is protected. Only a Mux preset can play them,
  // since nothing else turns a playback ID into a stream URL.
  'mux-source-cmaf': {
    label: 'HLS - Dancing Dude (Mux source)',
    type: 'hls',
    subType: 'mp4',
    source: { playbackId: 'lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4' },
  },
  'mux-source-ts': {
    label: 'HLS - Big Buck Bunny (Mux source)',
    type: 'hls',
    subType: 'ts',
    source: { playbackId: 'VcmKA6aqzIzlg3MayLJDnbF55kX00mds028Z65QxvBYaA' },
  },
  // Signed playback needs no engine support beyond the token: SPF plays these,
  // unlike the DRM entries below, because Mux serves ordinary CMAF once the URL
  // is authorized.
  'mux-signed': {
    label: 'HLS - Signed playback (Mux token)',
    type: 'hls',
    subType: 'mp4',
    source: {
      playbackId: SIGNED_PLAYBACK_ID,
      playback: { token: SIGNED_TOKENS.playback },
      poster: { token: SIGNED_TOKENS.thumbnail },
      storyboard: { token: SIGNED_TOKENS.storyboard },
    },
  },
  'mux-signed-audio': {
    label: 'HLS - Signed audio only (Mux token)',
    type: 'hls',
    subType: 'mp4',
    source: {
      playbackId: SIGNED_AUDIO_PLAYBACK_ID,
      playback: { token: SIGNED_AUDIO_TOKENS.playback },
    },
  },
  'mux-drm': {
    // Mux-flavoured DRM: `drm.token` is all `MuxVideo` needs, because it derives
    // every license server URL from the playback ID. Only the Mux presets can
    // play it — nothing else knows how to read a Mux DRM token.
    label: 'HLS - DRM protected (Mux token)',
    type: 'hls',
    subType: 'mp4',
    drm: true,
    source: {
      playbackId: DRM_PLAYBACK_ID,
      playback: { token: DRM_TOKENS.playback },
      drm: { token: DRM_TOKENS.drm },
      poster: { token: DRM_TOKENS.thumbnail },
      storyboard: { token: DRM_TOKENS.storyboard },
    },
  },
  'hls-drm': {
    // The same asset, licensed the generic way: `source.drm` naming the license
    // servers outright. Works on any HLS element, whichever path it takes.
    label: 'HLS - DRM protected (license servers)',
    type: 'hls',
    subType: 'mp4',
    drm: true,
    poster: `https://image.mux.com/${DRM_PLAYBACK_ID}/thumbnail.webp?token=${DRM_TOKENS.thumbnail}`,
    source: {
      src: `https://stream.mux.com/${DRM_PLAYBACK_ID}.m3u8?token=${DRM_TOKENS.playback}`,
      drm: DRM_SYSTEMS,
    },
  },
  'hls-live': {
    label: 'HLS - Live Stream Big Buck Bunny',
    url: 'https://stream.mux.com/v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM.m3u8',
    type: 'hls',
    subType: 'mp4',
    live: true,
  },
  /**
   * A 4K ladder over HLS, and the default source for the SPF background presets.
   *
   * Deliberately _not_ the clip {@link BACKGROUND_VIDEO_SRC} plays: the rendition ladder has to straddle a real screen
   * for the screen-resolution cap to have anything to choose between. Its rungs run 640x360 → 3838x2160, so a display
   * under the top rung caps to 2558x1440 instead. (Those off-by-two widths are the source's near-square pixel aspect
   * ratio, not a typo, and they are the reason the cap compares pixel areas rather than matching `1920x1080`-style
   * tiers.) Video-only — the source carries no audio track.
   *
   * CMAF/fMP4, because SPF appends fMP4 segments directly and does no MPEG-TS transmuxing. Packaging follows the video
   * quality tier — `premium` yields CMAF, while `plus`/`basic` (legacy `encoding_tier: smart`) yield MPEG-TS — which is
   * also why a 4K ladder needs `max_resolution_tier: '2160p'` alongside `video_quality: 'premium'`.
   */
  'hls-4k': {
    label: 'HLS - Short 4K UHD 2160p',
    url: 'https://stream.mux.com/SfAaZ9InpM8FMfky7DkNBuTpxEDqU8Jchpa49urOWcs.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  'hls-audio-only-cmaf': {
    label: 'HLS - Audio only (CMAF/fmp4)',
    url: 'https://stream.mux.com/2NEjLyf6ETnskbfAtbM00Vdzb97B00OKUUQcRD6LZpBRw.m3u8',
    type: 'hls',
    subType: 'mp4',
  },
  // One variant, CODECS="mp4a.40.2", `.ts` segments and no EXT-X-MAP. The audio
  // counterpart of the MPEG-TS case, and the only source here that reaches the
  // *audio* verdict (2012): the other TS assets mux audio into their video
  // variants, so they expose no audio rendition to prune.
  'hls-audio-only-ts': {
    label: 'HLS - Audio only (MPEG-TS)',
    url: 'https://stream.mux.com/3zd01ukbq5UaSPrfGnZ2eYBcMXuf3Uc5Rc5XINRcHA00g.m3u8',
    type: 'hls',
    subType: 'ts',
  },
  // The same asset again, reached by plain URL and deliberately left unlicensed,
  // so any preset can be pointed at it. Video renditions carry #EXT-X-KEY for all
  // three key systems; the audio rendition is clear. An engine with no EME/license
  // pipeline prunes the video renditions and reports the source as protected,
  // which is the point: it is here to be refused, not played.
  'hls-drm-unlicensed': {
    label: 'HLS - DRM protected (no license)',
    url: `https://stream.mux.com/${DRM_PLAYBACK_ID}.m3u8?token=${DRM_TOKENS.playback}`,
    type: 'hls',
    subType: 'mp4',
    drm: true,
    poster: `https://image.mux.com/${DRM_PLAYBACK_ID}/thumbnail.webp?token=${DRM_TOKENS.thumbnail}`,
  },
  // Third-party DRM, for proving the engine is not shaped around one provider.
  // Every one is HLS + fMP4/CMAF with a public license server, verified reachable
  // 2026-08-24. They are here to be *played*, unlike `hls-drm-unlicensed`.
  'hls-drm-widevine-cwip': {
    // Google/Shaka's Angel One, licensed by the Widevine interop proxy with no auth
    // at all. The only source here using SAMPLE-AES-CTR, so it is also the only one
    // that reaches the `cenc` branch of `declaredEncryptionScheme` — Mux packages
    // SAMPLE-AES (cbcs) exclusively.
    label: 'HLS - DRM Widevine (Shaka/CWIP, no auth)',
    type: 'hls',
    subType: 'mp4',
    drm: true,
    source: {
      src: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-widevine-hls/hls.m3u8',
      drm: { 'com.widevine.alpha': { licenseUrl: 'https://cwip-shaka-proxy.appspot.com/no_auth' } },
    },
  },
  'hls-drm-ezdrm': {
    // EZDRM's FairPlay demo. No custom header — the asset is identified by the
    // license URL path — and the SPC goes up as a raw octet-stream body, the same
    // convention Mux uses. Its `skd://` carries the content id after a `;`, where
    // Mux and Axinom each delimit differently.
    label: 'HLS - DRM FairPlay (EZDRM)',
    type: 'hls',
    subType: 'mp4',
    drm: true,
    source: {
      src: 'https://na-fps.ezdrm.com/demo/ezdrm/master.m3u8',
      drm: {
        'com.apple.fps': {
          licenseUrl: 'https://fps.ezdrm.com/api/licenses/b99ed9e5-c641-49d1-bfa8-43692b686ddb',
          serverCertificateUrl: 'https://fps.ezdrm.com/demo/video/eleisure.cer',
          // `skd://fps.ezdrm.com/;b99ed9e5-…` — the asset id is what follows the
          // `;`, where the default takes everything after the scheme. Only the
          // legacy AirPlay path reads this; over EME the CDM gets the URI whole.
          fairPlayContentId: (keyUri) => keyUri.slice(keyUri.lastIndexOf(';') + 1),
        },
      },
    },
  },
  'hls-drm-playready-msft': {
    // Microsoft's public PlayReady test server, configured entirely through its
    // own URL query. Lets the PlayReady vertical be exercised without Mux as a
    // second variable; still needs a PlayReady CDM, so Windows/Edge only.
    //
    // The `cfg` query is copied verbatim from the asset's own `WRMHEADER`
    // `LA_URL`, which is the authority on how this content was keyed:
    //
    //   <LA_URL>http://experimental1.azurewebsites.net/rightsmanager.asmx
    //           ?cfg=(ck:W31bfVt9W31bfVt9W31bfQ==,ckt:AES128BitCBC)</LA_URL>
    //   <KID ALGID="AESCBC" VALUE="AAAAEAAQABAQABAAAAAAAQ==">
    //
    // Only the host differs: the one the header names is dead (connection
    // refused, 2026-09-17), so this points at the documented public test
    // server instead. The `cfg` is otherwise unchanged, casing included.
    //
    // **This vector has never been seen to play, and may be unusable.** It read
    // `ckt:aescbc` until 2026-09-17 — not a value the server takes — and
    // answered HTTP 500 with `Invalid config data in ckt` (SVTA 4004). That
    // string came from Shaka's own demo asset list, which still carries it, so
    // it was wrong from the day it was added here and the earlier "PlayReady
    // verified" pass must have rested on Mux alone.
    //
    // With `ckt` corrected the license returns 200 and decode still never
    // starts — the silent shape of a wrong content key. Shaka cannot be used to
    // check it: its demo requests `com.microsoft.playready.recommendation` and
    // `.recommendation.3000`, which Edge refuses, so it fails to negotiate
    // PlayReady at all on the machine where this engine licenses Mux fine.
    // Note the asset's own `LA_URL` names a host that no longer resolves, which
    // fits a fixture nobody has revalidated.
    //
    // Kept because a PlayReady vector without Mux as a second variable is worth
    // having if it can be revived; Mux is the verified PlayReady evidence
    // meanwhile. Nothing validates this string until a real CDM sends a real
    // challenge, so it can only ever be exercised on Windows.
    label: 'HLS - DRM PlayReady (Microsoft)',
    type: 'hls',
    subType: 'mp4',
    drm: true,
    source: {
      src: 'https://test.playready.microsoft.com/media/dash/APPLEENC_CBCS_BBB_1080p/1080p_alternate.m3u8',
      drm: {
        'com.microsoft.playready': {
          licenseUrl:
            'https://test.playready.microsoft.com/service/rightsmanager.asmx?cfg=(ck:W31bfVt9W31bfVt9W31bfQ==,ckt:AES128BitCBC)',
        },
      },
    },
  },
  'hls-drm-axinom': {
    // Axinom's H.264 CMAF cbcs vector — the same packaging Mux produces, from a
    // different packager, declaring Widevine and FairPlay in one manifest.
    //
    // Licensed by the `X-AxDRM-Message` entitlement, which is what a per-system
    // `headers` config exists for — a license URL alone cannot authenticate here.
    // {@link AXINOM_TOKEN} is paired with this asset's content key.
    //
    // Widevine only, though the manifest declares FairPlay too. Over MSE the SPC
    // is generated from an appended segment's `sinf`, which carries no IV, and
    // Axinom answers `An initialization vector must be provided with every key in
    // the entitlement message` — its published tokens carry none either. Shaka
    // plays this asset by letting Safari play it natively, which is not a route
    // an MSE engine has. Naming FairPlay here would report a licensing failure
    // that says more about the request shape than about this source.
    label: 'HLS - DRM Widevine (Axinom)',
    type: 'hls',
    subType: 'mp4',
    drm: true,
    source: {
      src: 'https://media.axprod.net/TestVectors/Cmaf/protected_1080p_h264_cbcs/manifest.m3u8',
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://drm-widevine-licensing.axtest.net/AcquireLicense',
          headers: { 'X-AxDRM-Message': AXINOM_TOKEN },
        },
      },
    },
  },
  'hls-drm-axinom-multikey': {
    // Axinom's H.264 CMAF cbcs MultiKey vector: distinct Widevine keys across
    // the quality ladder, the studio-policy shape nothing else in this set
    // exercises. Measured 2026-09-17 from the manifests: five variants, **two**
    // distinct KEYIDs, split at the 480->720 boundary (288/360/480 share
    // C83C4EA8..., 720/1080 share C868C702...), no `EXT-X-SESSION-KEY`, and
    // each variant playlist declares only its own key — twice, once as a
    // Widevine PSSH and once as an `skd://` URI naming the same keyid.
    //
    // So this does NOT show a license POST per ladder key at startup, as an
    // earlier version of this comment claimed. `resolve-track` resolves only
    // the selected variant, so exactly one key is declared when
    // `exchangeLicenses` runs, and exactly one license is fetched. The eager
    // fan-out the pin test pins is over *declared* keys, which in production is
    // one. Crossing 480<->720 therefore needs a key that was never licensed —
    // the defect tracked in #2863.
    //
    // Widevine only, for the same reason as `hls-drm-axinom`: its FairPlay
    // request over MSE cannot convey the `skd://keyid:iv` content id this
    // provider keys on.
    label: 'HLS - DRM Widevine multi-key (Axinom)',
    type: 'hls',
    subType: 'mp4',
    drm: true,
    source: {
      src: 'https://media.axprod.net/TestVectors/MultiKey/Cmaf_h264_1080p_cbcs/manifest.m3u8',
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://drm-widevine-licensing.axtest.net/AcquireLicense',
          headers: { 'X-AxDRM-Message': AXINOM_MULTIKEY_TOKEN },
        },
      },
    },
  },
  'mp4-1': {
    label: 'MP4 - Dancing Dude',
    url: 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4',
    type: 'mp4',
  },
  'dash-1': {
    label: 'DASH - Big Buck Bunny',
    url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
    type: 'dash',
  },
  'dash-2': {
    label: 'DASH - Envivio Test Stream',
    url: 'https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd',
    type: 'dash',
  },
  // YouTube page URLs, which only `<youtube-video>` plays. Big Buck Bunny has no
  // dialogue and no captions, so switching to it is how a previous video's
  // caption tracks are seen to go away.
  'youtube-1': {
    label: 'YouTube - Big Buck Bunny (no captions)',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    type: 'youtube',
  },
  // English captions, uploaded and auto-generated. Whether YouTube shows them on
  // load follows the viewer's own YouTube caption preference.
  'youtube-captions': {
    label: 'YouTube - Captions (English)',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    type: 'youtube',
  },
  // The same video with `cc_load_policy`, so YouTube shows captions on load
  // whatever the viewer's preference — the state the CC button must pick up.
  'youtube-captions-on': {
    label: 'YouTube - Captions on at load (cc_load_policy)',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    type: 'youtube',
    youtube: { cc_load_policy: 1 },
  },
  // Dozens of uploaded subtitle languages, which fills the captions menu.
  'youtube-captions-multi': {
    label: 'YouTube - Captions (many languages)',
    url: 'https://www.youtube.com/watch?v=iG9CE55wbtY',
    type: 'youtube',
  },
  // Forced on in a language other than the first, so the track the player marks
  // showing has to be the one YouTube picked rather than whichever came first.
  'youtube-captions-french': {
    label: 'YouTube - Captions on at load in French (cc_lang_pref)',
    url: 'https://www.youtube.com/watch?v=iG9CE55wbtY',
    type: 'youtube',
    youtube: { cc_load_policy: 1, cc_lang_pref: 'fr' },
  },
  'youtube-short': {
    label: 'YouTube - Short (portrait, captions)',
    url: 'https://www.youtube.com/shorts/8ZCeXQyavog',
    type: 'youtube',
  },
  // A 24/7 stream reached through a `/live/` URL. Not flagged `live`: the YouTube
  // media has no live player variant to switch to.
  'youtube-live': {
    label: 'YouTube - Live stream (Lofi Girl)',
    url: 'https://www.youtube.com/live/jfKfPfyJRdk',
    type: 'youtube',
  },
  'youtube-start-time': {
    label: 'YouTube - Short link with start time (youtu.be, t=60)',
    url: 'https://youtu.be/aqz-KE-bpKQ?t=60',
    type: 'youtube',
  },
  // A file that does not exist, so the player's error dialog can be looked at
  // without waiting for a network to fail.
  error: {
    label: 'Missing file (error dialog)',
    url: '/missing-video-that-does-not-exist.mp4',
    type: 'mp4',
  },
  // Empty src — exercises source teardown with nothing re-attaching, and the
  // engine's fresh-but-attached "no source" state. `src` forwards to the host
  // property rather than being mirrored onto the inner native element, so this
  // reaches the adapter as `''` (un-resolving the presentation) instead of
  // making the element load the document URL.
  none: {
    label: 'None (empty src)',
    url: '',
    type: 'none',
  },
} satisfies Record<string, SandboxSource>;

export type SourceId = keyof typeof SOURCE_MAP;

// Annotated rather than `as const`: indexing by a `SourceId` yields one entry
// shape, so callers see `url` and `source` as the optional fields they are
// instead of a union of literal types that only some members share.
export const SOURCES: Record<SourceId, SandboxSource> = SOURCE_MAP;

const ALL_SOURCE_IDS = Object.keys(SOURCES) as SourceId[];

/** Sources a media element or streaming engine plays. YouTube page URLs are kept apart for `<youtube-video>`. */
export const SOURCE_IDS = ALL_SOURCE_IDS.filter((id) => !isYouTubeSource(id));
export const YOUTUBE_SOURCE_IDS = ALL_SOURCE_IDS.filter(isYouTubeSource);
export const NON_DASH_SOURCE_IDS = SOURCE_IDS.filter(
  (id) => SOURCES[id].type !== 'dash' && !isDrmSource(id) && !isMuxSource(id)
);
/**
 * HLS presets add the DRM asset that names its license servers outright. Both hls.js and native HLS read it, each from
 * its own half of the source — which half depends on the path the browser ends up taking.
 */
export const HLS_SOURCE_IDS = SOURCE_IDS.filter(
  (id) => SOURCES[id].type !== 'dash' && !isMuxSource(id) && id !== 'hls-drm-unlicensed'
);
/**
 * Mux presets add everything reached by playback ID, plus the DRM asset licensed by a Mux token, which only they can
 * read.
 */
export const MUX_SOURCE_IDS = SOURCE_IDS.filter((id) => SOURCES[id].type !== 'dash' && id !== 'hls-drm-unlicensed');
/**
 * The SPF Mux presets read `source.drm`, so they license both protected assets: `mux-drm` from the token its license
 * servers derive from, `hls-drm` from the servers it names outright. The unlicensed asset stays alongside them, as the
 * one DRM source here that carries no credentials — refusing a protected source visibly is a behavior worth reaching.
 * Signed playback is not DRM and stays either way; SPF plays it once the token authorizes the URL.
 */
export const MUX_SPF_SOURCE_IDS = SOURCE_IDS.filter((id) => SOURCES[id].type !== 'dash');
/**
 * The plain HLS presets are the same engine reached through `<hls-video>`, which takes a structured `source` of its
 * own, so it licenses `source.drm` exactly as the Mux flavor does. Only what a playback ID reaches is dropped.
 */
export const SPF_HLS_SOURCE_IDS = SOURCE_IDS.filter((id) => SOURCES[id].type !== 'dash' && !isMuxSource(id));
export const DASH_SOURCE_IDS = SOURCE_IDS.filter((id) => SOURCES[id].type === 'dash');
/**
 * Shaka plays DASH and HLS from one element, so it is the only preset offered both. The DRM assets are left out until
 * the sandbox hands it license servers.
 */
export const SHAKA_SOURCE_IDS = SOURCE_IDS.filter((id) => !isDrmSource(id) && !isMuxSource(id));
export const DEFAULT_SOURCE: SourceId = 'hls-1';
export const DEFAULT_DASH_SOURCE: SourceId = 'dash-1';
export const DEFAULT_YOUTUBE_SOURCE: SourceId = 'youtube-1';
/**
 * Where the SPF background presets land when entered. The 4K ladder rather than {@link DEFAULT_SOURCE}, which is
 * MPEG-TS and so is a failure case for this engine rather than a demo of it.
 */
export const DEFAULT_BACKGROUND_SOURCE: SourceId = 'hls-4k';

export const BACKGROUND_VIDEO_SRC = 'https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/low.mp4';

/**
 * Add Mux's rendition cap to a stream URL, the param `<mux-background-video>` exists to demonstrate. Merged rather than
 * appended, since a sandbox source may already carry params of its own (clip bounds, a playback token).
 *
 * Left alone when the URL is signed: Mux validates the whole query against the token, so a param added beside one
 * answers 403 instead of capping — which would replace whatever failure that source was chosen to reach.
 */
export function withMuxMaxResolution(url: string, maxResolution: string): string {
  if (!url || url.includes('token=')) return url;

  const capped = new URL(url);

  capped.searchParams.set('max_resolution', maxResolution);
  return capped.href;
}

export const VIMEO_VIDEO_SRC = 'https://vimeo.com/76979871';

export const CLOUDFLARE_VIDEO_SRC = 'https://watch.videodelivery.net/bfbd585059e33391d67b0f1d15fe6ea4';

// An episode rather than a track: Spotify plays episodes in full for a signed-out
// listener, where a track is a 30 second preview.
export const SPOTIFY_AUDIO_SRC = 'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5';

export const TIKTOK_VIDEO_SRC = 'https://www.tiktok.com/@_luwes/video/7527476667770522893';

// A VOD rather than a channel: a channel embed only plays while its streamer is
// live, so it would show an offline banner most of the time.
export const TWITCH_VIDEO_SRC = 'https://www.twitch.tv/videos/106400740';

export const WISTIA_VIDEO_SRC = 'https://wesleyluyten.wistia.com/medias/oifkgmxnkb';

/** Returns true when the given source represents a live stream and should use the live-video skin. */
export function isLiveSource(id: SourceId): boolean {
  return SOURCES[id].live === true;
}

export function isYouTubeSource(id: SourceId): boolean {
  return SOURCES[id].type === 'youtube';
}

/** The structured source for a YouTube entry with player parameters, which a `src` attribute cannot carry. */
export function getYouTubeSource(id: SourceId): YouTubeSource | undefined {
  const { url, youtube } = SOURCES[id];

  return youtube ? { src: url, engine: { youtube } } : undefined;
}

/** Returns true when the given source is DRM protected and needs signed tokens. */
export function isDrmSource(id: SourceId): boolean {
  return SOURCES[id].drm === true;
}

/**
 * Returns true when the given source is reached by playback ID, so only a preset whose media builds Mux URLs can offer
 * it — anything else has no `url` to fall back to.
 */
export function isMuxSource(id: SourceId): boolean {
  return SOURCES[id].source?.playbackId !== undefined;
}

// A signed asset rejects an unsigned image URL, so a source that carries an
// image token signs with it, alongside whatever params the caller asked for.
function imageQuery(id: SourceId, kind: 'poster' | 'storyboard', params?: string): string {
  const query = new URLSearchParams(params);

  const token = SOURCES[id].source?.[kind]?.token;

  if (token) query.set('token', token);

  const search = query.toString();

  return search ? `?${search}` : '';
}

export function getPosterSrc(source: SourceId): string | undefined {
  const { poster } = SOURCES[source];
  if (poster) return poster;

  const id = getMuxAssetId(source);

  return id ? `https://image.mux.com/${id}/thumbnail.webp${imageQuery(source, 'poster')}` : undefined;
}

/**
 * A CSS image to sit behind the poster while it loads. This upscales a 20px thumbnail, and the browser's own smoothing
 * does the blurring.
 */
export function getPlaceholderSrc(source: SourceId): string | undefined {
  const id = getMuxAssetId(source);

  return id ? `https://image.mux.com/${id}/thumbnail.webp${imageQuery(source, 'poster', 'width=20')}` : undefined;
}

export function getStoryboardSrc(source: SourceId): string | undefined {
  // Storyboards aren't generated for live streams, so skip the request entirely.
  if (isLiveSource(source)) return undefined;

  const id = getMuxAssetId(source);

  return id ? `https://image.mux.com/${id}/storyboard.vtt${imageQuery(source, 'storyboard')}` : undefined;
}

export function getChapters(source: SourceId): readonly ChapterTrack[] {
  return SOURCES[source].chapters ?? [];
}

/** Key system per `drm=` query value, the sandbox's shorthand for the EME ids. */
export const KEY_SYSTEM_BY_DRM_PARAM: Record<string, string> = {
  widevine: 'com.widevine.alpha',
  playready: 'com.microsoft.playready',
  fairplay: 'com.apple.fps',
};

/**
 * Narrow a source's `drm` to the one key system a `drm=` query value names, so a browser with several CDMs negotiates
 * the one under test — Edge on Windows has Widevine AND PlayReady, and unfiltered Widevine wins, which makes the Mux
 * source untestable for PlayReady.
 *
 * Returns the source untouched when the param is absent or unrecognized, or when the source names no DRM at all. Copies
 * rather than mutating: `SOURCES` is a shared module-level object, and a template that re-renders on source change
 * would otherwise carry the narrowed config into every later source.
 */
export function restrictDrmSystems<T extends { drm?: Record<string, unknown> }>(
  source: T | undefined,
  param: string | null
): T | undefined {
  const keySystem = KEY_SYSTEM_BY_DRM_PARAM[param ?? ''];
  if (!source?.drm || !keySystem || !(keySystem in source.drm)) return source;

  return { ...source, drm: { [keySystem]: source.drm[keySystem] } };
}
