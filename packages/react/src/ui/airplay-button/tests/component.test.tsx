import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { AirPlayButton } from '../component';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderAirPlayButton(props: AirPlayButton.Props = {}) {
  const { Wrapper } = createPlayerWrapper({
    remotePlaybackState: 'disconnected',
    remotePlaybackAvailability: 'available',
    promptRemotePlayback: vi.fn(),
  });

  render(<AirPlayButton data-testid="airplay" {...props} />, { wrapper: Wrapper });
}

describe('AirPlayButton', () => {
  it('is hidden outside WebKit', () => {
    renderAirPlayButton();

    expect(screen.queryByTestId('airplay')).toBeNull();
  });

  it('renders when AirPlay is available in WebKit', () => {
    vi.stubGlobal('WebKitPlaybackTargetAvailabilityEvent', class {});

    renderAirPlayButton();

    expect(screen.getByTestId('airplay')).toBeDefined();
  });

  it('lets element props override generated attributes', () => {
    vi.stubGlobal('WebKitPlaybackTargetAvailabilityEvent', class {});

    renderAirPlayButton({ hidden: true, 'aria-label': 'Custom AirPlay' });

    const button = screen.getByTestId('airplay');

    expect(button.hidden).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Custom AirPlay');
  });
});
