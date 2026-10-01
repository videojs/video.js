import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { resolveVttSegmentMetadata } from '../../../text/resolve-vtt-metadata';
import { destroyVttResolver, resolveVttSegment } from '../resolve-vtt-segment';

describe('resolveVttSegment', () => {
  beforeEach(() => {
    destroyVttResolver();
  });

  it('parses valid VTT segment with single cue', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:00.000 --> 00:00:05.000
First subtitle
`);

    const cues = await resolveVttSegment(vttDataUrl);

    expect(cues).toHaveLength(1);
    expect(cues[0]).toBeInstanceOf(VTTCue);
    expect(cues[0]!.startTime).toBe(0);
    expect(cues[0]!.endTime).toBe(5);
    expect(cues[0]!.text).toBe('First subtitle');
  });

  it('parses VTT segment with multiple cues', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:00.000 --> 00:00:05.000
First subtitle

00:00:05.000 --> 00:00:10.000
Second subtitle

00:00:10.000 --> 00:00:15.000
Third subtitle
`);

    const cues = await resolveVttSegment(vttDataUrl);

    expect(cues).toHaveLength(3);
    expect(cues[0]!.text).toBe('First subtitle');
    expect(cues[1]!.text).toBe('Second subtitle');
    expect(cues[2]!.text).toBe('Third subtitle');
  });

  it('extracts correct startTime, endTime, text from cues', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:01.500 --> 00:00:03.750
Test subtitle with precise timing
`);

    const cues = await resolveVttSegment(vttDataUrl);

    expect(cues).toHaveLength(1);
    expect(cues[0]!.startTime).toBe(1.5);
    expect(cues[0]!.endTime).toBe(3.75);
    expect(cues[0]!.text).toBe('Test subtitle with precise timing');
  });

  it('handles VTT with positioning and styling', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:00.000 --> 00:00:05.000 align:start position:10%
<v Speaker>Positioned subtitle</v>
`);

    const cues = await resolveVttSegment(vttDataUrl);

    expect(cues).toHaveLength(1);
    expect(cues[0]!.startTime).toBe(0);
    expect(cues[0]!.endTime).toBe(5);
    expect(cues[0]!.text).toContain('Positioned subtitle');
    expect(cues[0]!.align).toBe('start');
    expect(cues[0]!.position).toBe(10);
  });

  it('handles VTT with multiline text', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:00.000 --> 00:00:05.000
First line
Second line
Third line
`);

    const cues = await resolveVttSegment(vttDataUrl);

    expect(cues).toHaveLength(1);
    expect(cues[0]!.text).toContain('First line');
    expect(cues[0]!.text).toContain('Second line');
    expect(cues[0]!.text).toContain('Third line');
  });

  it('rejects on invalid URL', async () => {
    await expect(resolveVttSegment('https://invalid.example.com/missing.vtt')).rejects.toThrow(
      'Failed to load VTT segment'
    );
  });

  it('rejects on malformed VTT', async () => {
    const invalidVtt = `data:text/vtt,${encodeURIComponent('NOT VALID VTT CONTENT')}`;

    await expect(resolveVttSegment(invalidVtt)).rejects.toThrow('Failed to load VTT segment');
  });

  it('returns empty array for VTT with no cues', async () => {
    const vttDataUrl = `data:text/vtt,${encodeURIComponent('WEBVTT\n\n')}`;

    const cues = await resolveVttSegment(vttDataUrl);

    expect(cues).toHaveLength(0);
  });

  it('reuses dummy elements across multiple calls', async () => {
    const vtt1 =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:00.000 --> 00:00:01.000
First
`);

    const vtt2 =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:00.000 --> 00:00:01.000
Second
`);

    const cues1 = await resolveVttSegment(vtt1);

    expect(cues1).toHaveLength(1);
    expect(cues1[0]!.text).toBe('First');

    const cues2 = await resolveVttSegment(vtt2);

    expect(cues2).toHaveLength(1);
    expect(cues2[0]!.text).toBe('Second');
  });

  it('cleans up dummy elements on destroy', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

00:00:00.000 --> 00:00:01.000
Test
`);

    const createElement = vi.spyOn(document, 'createElement');

    try {
      await resolveVttSegment(vttDataUrl);

      const video = createElement.mock.results.find(({ value }) => value instanceof HTMLVideoElement)!.value;
      const track = createElement.mock.results.find(({ value }) => value instanceof HTMLTrackElement)!.value;

      expect(track.parentNode).toBeNull();
      expect(video.childElementCount).toBe(0);

      createElement.mockClear();
      destroyVttResolver();

      const cues = await resolveVttSegment(vttDataUrl);
      const nextVideo = createElement.mock.results.find(({ value }) => value instanceof HTMLVideoElement)?.value;
      const nextTrack = createElement.mock.results.find(({ value }) => value instanceof HTMLTrackElement)!.value;

      expect(createElement).toHaveBeenCalledWith('video');
      expect(nextVideo).toBeInstanceOf(HTMLVideoElement);
      expect(nextVideo).not.toBe(video);
      expect(nextTrack.parentNode).toBeNull();
      expect(cues).toHaveLength(1);
      expect(cues[0]!.text).toBe('Test');
    } finally {
      createElement.mockRestore();
      destroyVttResolver();
    }
  });
});

describe('destroyVttResolver', () => {
  it('can be called multiple times safely', () => {
    expect(() => {
      destroyVttResolver();
      destroyVttResolver();
      destroyVttResolver();
    }).not.toThrow();
  });
});

describe('resolveVttSegmentMetadata', () => {
  it('extracts the X-TIMESTAMP-MAP from the segment header', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT
X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000

1
00:00:00.008 --> 00:00:00.992
Bip!
`);

    const metadata = await resolveVttSegmentMetadata(vttDataUrl);

    expect(metadata.timestampMap).toEqual({ mpegts: 900000, local: 0 });
  });

  it('reports an undefined timestampMap when the segment has no map', async () => {
    const vttDataUrl =
      'data:text/vtt,' +
      encodeURIComponent(`WEBVTT

11
00:00:46.320 --> 00:01:00.880
The robot.
`);

    const metadata = await resolveVttSegmentMetadata(vttDataUrl);

    expect(metadata.timestampMap).toBeUndefined();
  });
});
