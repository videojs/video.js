import { render } from '@testing-library/react';
import { KalturaVideoAdapter } from '@videojs/kaltura-video';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { KalturaVideo } from '../kaltura-video';

const SHORTHAND = 'kaltura/243342/0_uka1msg4';

/** Render and capture the media the component attached, so assertions read its state rather than its setters. */
function renderWithMedia(ui: ReactElement) {
  const attach = vi.spyOn(KalturaVideoAdapter.prototype, 'attach');
  const result = render(ui);
  const media = attach.mock.contexts[0] as KalturaVideoAdapter;

  attach.mockRestore();
  return { ...result, media };
}

// Kaltura is never answered here: what is under test is when the component asks.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {}))
  );
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('KalturaVideo', () => {
  it('hands src to the media as written, and keeps source off the element', () => {
    const { container, media } = renderWithMedia(<KalturaVideo src={SHORTHAND} />);

    expect(media.src).toBe(SHORTHAND);
    expect(media.source).toMatchObject({ partnerId: 243342, entryId: '0_uka1msg4' });
    expect(container.querySelector('video')!.hasAttribute('source')).toBe(false);
  });

  it('asks Kaltura once for an entry whose source is a new object on every render', async () => {
    const { rerender } = render(<KalturaVideo source={{ partnerId: 243342, entryId: '0_uka1msg4' }} />);

    rerender(<KalturaVideo source={{ partnerId: 243342, entryId: '0_uka1msg4' }} />);
    rerender(<KalturaVideo source={{ partnerId: 243342, entryId: '0_uka1msg4' }} />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('links to the help page as fallback content', () => {
    const { container } = render(<KalturaVideo src={SHORTHAND} />);

    expect(container.querySelector('video a')?.getAttribute('href')).toBe('https://videojs.org/help');
  });
});
