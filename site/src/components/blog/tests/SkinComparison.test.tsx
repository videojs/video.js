import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import SkinComparison from '../SkinComparison';

const tracks = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'audioTracks');

beforeEach(() => {
  // jsdom's plain array cannot act as a browser track list. Exercise the unsupported-track path.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  Reflect.deleteProperty(HTMLMediaElement.prototype, 'audioTracks');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();

  if (tracks) Object.defineProperty(HTMLMediaElement.prototype, 'audioTracks', tracks);
});

describe('SkinComparison', () => {
  it('keeps one media element and reflects its playback state in every skin', async () => {
    const { container } = render(<SkinComparison />);
    const video = container.querySelector<HTMLVideoElement>('.skin-comparison-video')!;

    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });
    act(() => video.dispatchEvent(new Event('playing')));

    for (const name of ['Default', 'Neutral', 'Compat', 'Scaffold']) {
      fireEvent.click(screen.getByRole('button', { name }));
      await waitFor(() => expect(screen.getAllByRole('button', { name: 'Pause' }).length).toBeGreaterThan(0));
      expect(container.querySelectorAll('.skin-comparison-video')).toHaveLength(1);
      expect(container.querySelector('.skin-comparison-video')).toBe(video);
      expect(video.paused).toBe(false);
    }

    expect(container.querySelectorAll('.comparison-slice:not([aria-hidden]) [role=status]')).toHaveLength(1);
  });

  it('pushes neighboring dividers in either direction without pulling them back', () => {
    render(<SkinComparison />);
    const first = screen.getByRole('slider', { name: 'Default and Neutral divider' });
    const middle = screen.getByRole('slider', { name: 'Neutral and Compat divider' });
    const last = screen.getByRole('slider', { name: 'Compat and Scaffold divider' });

    fireEvent.click(screen.getByText('Adjust dividers'));
    const position = screen.getByRole('slider', { name: 'Default / Neutral' });

    fireEvent.change(position, { target: { value: '60' } });
    expect(first).toHaveAttribute('aria-valuenow', '60');
    expect(middle).toHaveAttribute('aria-valuenow', '60');
    expect(last).toHaveAttribute('aria-valuenow', '75');

    fireEvent.change(position, { target: { value: '90' } });

    for (const divider of [first, middle, last]) expect(divider).toHaveAttribute('aria-valuenow', '90');

    fireEvent.change(position, { target: { value: '40' } });
    expect(first).toHaveAttribute('aria-valuenow', '40');
    expect(middle).toHaveAttribute('aria-valuenow', '90');
    expect(last).toHaveAttribute('aria-valuenow', '90');

    fireEvent.keyDown(last, { key: 'Home' });

    for (const divider of [first, middle, last]) expect(divider).toHaveAttribute('aria-valuenow', '0');
  });

  it('reveals each skin through the dividers and keeps the handles available', () => {
    render(<SkinComparison />);
    const dividers = [
      screen.getByRole('slider', { name: 'Default and Neutral divider' }),
      screen.getByRole('slider', { name: 'Neutral and Compat divider' }),
      screen.getByRole('slider', { name: 'Compat and Scaffold divider' }),
    ];

    for (const [index, name] of ['Default', 'Neutral', 'Compat', 'Scaffold'].entries()) {
      fireEvent.click(screen.getByRole('button', { name }));
      dividers.forEach((divider, position) => {
        expect(divider).toHaveAttribute('aria-valuenow', position < index ? '0' : '100');
      });
    }

    fireEvent.keyDown(dividers[0]!, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Compare all' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('resets every divider on double-click without changing playback position', () => {
    const { container } = render(<SkinComparison />);
    const video = container.querySelector<HTMLVideoElement>('.skin-comparison-video')!;

    video.currentTime = 12;
    const first = screen.getByRole('slider', { name: 'Default and Neutral divider' });
    const middle = screen.getByRole('slider', { name: 'Neutral and Compat divider' });
    const last = screen.getByRole('slider', { name: 'Compat and Scaffold divider' });

    fireEvent.keyDown(first, { key: 'End' });
    fireEvent.doubleClick(middle);
    expect(first).toHaveAttribute('aria-valuenow', '25');
    expect(middle).toHaveAttribute('aria-valuenow', '50');
    expect(last).toHaveAttribute('aria-valuenow', '75');
    expect(video.currentTime).toBe(12);
  });

  it('moves dividers with the keyboard without seeking the video and keeps them ordered', () => {
    const { container } = render(<SkinComparison />);
    const video = container.querySelector<HTMLVideoElement>('.skin-comparison-video')!;

    video.currentTime = 12;
    const divider = screen.getByRole('slider', { name: 'Default and Neutral divider' });

    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(divider).toHaveAttribute('aria-valuenow', '26');
    expect(video.currentTime).toBe(12);

    fireEvent.keyDown(divider, { key: 'End' });
    expect(divider).toHaveAttribute('aria-valuenow', '100');
    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(divider).toHaveAttribute('aria-valuenow', '100');
    fireEvent.keyDown(divider, { key: 'Home' });
    expect(divider).toHaveAttribute('aria-valuenow', '0');

    fireEvent.click(screen.getByRole('button', { name: 'Scaffold' }));
    expect(container.querySelectorAll('.comparison-slice[inert]')).toHaveLength(3);
    expect(screen.getByRole('slider', { name: 'Default and Neutral divider' })).toHaveAttribute('aria-valuenow', '0');
    fireEvent.click(screen.getByRole('button', { name: 'Compare all' }));
    expect(screen.getByRole('slider', { name: 'Default and Neutral divider' })).toHaveAttribute('aria-valuenow', '25');
  });
});
