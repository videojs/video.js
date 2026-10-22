import { render, waitFor } from '@testing-library/react';
import { MuxAudioAdapter } from '@videojs/mux-audio';
import { HlsAudioAdapter } from '@videojs/spf/adapters/hls-audio';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { LazyAudio } from '../lazy-audio';

// The first import of an engine can be slow under a full test run.
const LOAD_TIMEOUT = { timeout: 5000 };

describe('LazyAudio', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a native audio for a file', () => {
    const { container } = render(<LazyAudio src="/song.mp3" />);
    const audio = container.querySelector('audio')!;

    expect(audio.getAttribute('src')).toBe('/song.mp3');
    expect(audio.getAttribute('preload')).toBe('none');
  });

  it('loads the HLS audio engine when MSE playback is preferred', async () => {
    const attach = vi.spyOn(HlsAudioAdapter.prototype, 'attach');
    const { container } = render(<LazyAudio src="https://example.com/master.m3u8" preferPlayback="mse" />);

    await waitFor(() => expect(attach).toHaveBeenCalledWith(container.querySelector('audio')), LOAD_TIMEOUT);
  });

  it('loads Mux audio for a Mux stream', async () => {
    const attach = vi.spyOn(MuxAudioAdapter.prototype, 'attach');

    render(<LazyAudio src="https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8" />);

    await waitFor(() => expect(attach).toHaveBeenCalled(), LOAD_TIMEOUT);
  });

  it('renders nothing and reports a source no audio media plays', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<LazyAudio src="https://vimeo.com/76979871" />);

    expect(container.innerHTML).toBe('');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('[LazyAudio]'));
  });
});
