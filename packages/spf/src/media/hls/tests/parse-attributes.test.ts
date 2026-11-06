import { describe, expect, it } from 'vite-plus/test';

import { parseCodecs } from '../parse-attributes';

describe('parseCodecs', () => {
  it('splits a muxed video + audio CODECS string', () => {
    expect(parseCodecs('avc1.640028,mp4a.40.2')).toEqual({ video: 'avc1.640028', audio: 'mp4a.40.2' });
  });

  it('recognizes HEVC video codecs', () => {
    expect(parseCodecs('hvc1.1.6.L120.B0')).toEqual({ video: 'hvc1.1.6.L120.B0' });
    expect(parseCodecs('hev1.2.4.L120.B0')).toEqual({ video: 'hev1.2.4.L120.B0' });
  });

  it('recognizes the other video codecs HLS carries', () => {
    expect(parseCodecs('avc3.640028')).toEqual({ video: 'avc3.640028' });
    expect(parseCodecs('av01.0.08M.08')).toEqual({ video: 'av01.0.08M.08' });
    expect(parseCodecs('vp09.00.40.08')).toEqual({ video: 'vp09.00.40.08' });
    expect(parseCodecs('dvh1.05.06')).toEqual({ video: 'dvh1.05.06' });
    expect(parseCodecs('dvhe.05.06')).toEqual({ video: 'dvhe.05.06' });
    expect(parseCodecs('dvav.09.05')).toEqual({ video: 'dvav.09.05' });
    expect(parseCodecs('dva1.09.05')).toEqual({ video: 'dva1.09.05' });
    expect(parseCodecs('dav1.10.06')).toEqual({ video: 'dav1.10.06' });
    expect(parseCodecs('av01.0.08M.08,opus')).toEqual({ video: 'av01.0.08M.08', audio: 'opus' });
  });

  it('matches video codecs case-insensitively, keeping the codec as written', () => {
    expect(parseCodecs('AVC1.640028,MP4A.40.2')).toEqual({ video: 'AVC1.640028', audio: 'MP4A.40.2' });
  });

  it('recognizes Dolby audio codecs (ac-3 / ec-3 / ac-4), including muxed with video', () => {
    expect(parseCodecs('ac-3')).toEqual({ audio: 'ac-3' });
    expect(parseCodecs('ec-3')).toEqual({ audio: 'ec-3' });
    // The 5.1-surround Mux manifest shape: video + AC-3 audio on one STREAM-INF.
    expect(parseCodecs('avc1.640020,ac-3')).toEqual({ video: 'avc1.640020', audio: 'ac-3' });
    expect(parseCodecs('avc1.640020,ac-4')).toEqual({ video: 'avc1.640020', audio: 'ac-4' });
  });

  it('recognizes Opus / FLAC / DTS / ALAC / Vorbis audio (case-insensitive)', () => {
    expect(parseCodecs('opus').audio).toBe('opus');
    expect(parseCodecs('fLaC').audio).toBe('fLaC');
    expect(parseCodecs('dtsc').audio).toBe('dtsc');
    expect(parseCodecs('alac').audio).toBe('alac');
    expect(parseCodecs('vorbis').audio).toBe('vorbis');
  });

  it('leaves both undefined for an unrecognized codec', () => {
    expect(parseCodecs('wxyz.1')).toEqual({});
  });
});
