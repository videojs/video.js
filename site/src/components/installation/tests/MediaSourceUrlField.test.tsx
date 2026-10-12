import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { media, sourceUrl, useCase } from '@/stores/installation';

import MediaSourceUrlField from '../MediaSourceUrlField';

describe('MediaSourceUrlField', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    useCase.set('default-video');
    media.set('html5-video');
    sourceUrl.set('');
  });

  it('commits a typed URL after a pause', () => {
    vi.useFakeTimers();
    render(<MediaSourceUrlField id="url" choicesLocation="below" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://example.com/video.mp4' } });

    expect(sourceUrl.get()).toBe('');

    act(() => vi.advanceTimersByTime(500));

    expect(sourceUrl.get()).toBe('https://example.com/video.mp4');
  });

  it('keeps a URL written from outside during the pause, such as a finished upload', () => {
    const uploaded = 'https://stream.mux.com/abc123.m3u8';

    vi.useFakeTimers();
    render(<MediaSourceUrlField id="url" choicesLocation="below" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://example.com/half-typ' } });
    act(() => sourceUrl.set(uploaded));
    act(() => vi.advanceTimersByTime(500));

    expect(sourceUrl.get()).toBe(uploaded);
    expect(screen.getByRole('textbox')).toHaveValue(uploaded);
  });
});
