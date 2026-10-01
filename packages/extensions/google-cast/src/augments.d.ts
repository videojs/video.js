/**
 * Augments `@types/chromecast-caf-sender` with HLS segment format properties added after the community types were last
 * updated.
 */
declare namespace chrome.cast.media {
  enum HlsSegmentFormat {
    AAC = 'aac',
    AC3 = 'ac3',
    E_AC3 = 'e_ac3',
    FMP4 = 'fmp4',
    MP3 = 'mp3',
    TS = 'ts',
    TS_AAC = 'ts_aac',
  }

  enum HlsVideoSegmentFormat {
    FMP4 = 'fmp4',
    MPEG2_TS = 'mpeg2_ts',
    TS = 'ts',
  }

  interface MediaInfo {
    hlsSegmentFormat?: chrome.cast.media.HlsSegmentFormat;
    hlsVideoSegmentFormat?: chrome.cast.media.HlsVideoSegmentFormat;
  }
}
