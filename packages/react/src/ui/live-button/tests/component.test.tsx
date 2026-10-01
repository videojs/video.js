import { cleanup, render, screen } from '@testing-library/react';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { I18nProvider } from '../../../i18n';
import { createPlayerWrapper } from '../../../testing/mocks';
import { LiveButton } from '../component';

afterEach(() => {
  resetI18nRegistry();
  cleanup();
});

function createWrapper() {
  return createPlayerWrapper({
    liveEdgeStart: 90,
    targetLiveWindow: 0,
    currentTime: 80,
    duration: 100,
    seeking: false,
    seek: vi.fn(),
    buffered: [],
    seekable: [[0, 100]],
  }).Wrapper;
}

describe('LiveButton', () => {
  it('translates the default badge and updates when locale changes', () => {
    registerI18n('es', { 'live.badge': 'En vivo' });
    registerI18n('fr', { 'live.badge': 'Direct' });
    const Wrapper = createWrapper();

    const { rerender } = render(
      <Wrapper>
        <I18nProvider locale="es">
          <LiveButton data-testid="live" />
        </I18nProvider>
      </Wrapper>
    );

    expect(screen.getByTestId('live').textContent).toBe('En vivo');

    rerender(
      <Wrapper>
        <I18nProvider locale="fr">
          <LiveButton data-testid="live" />
        </I18nProvider>
      </Wrapper>
    );

    expect(screen.getByTestId('live').textContent).toBe('Direct');
  });

  it('preserves authored badge copy', () => {
    registerI18n('es', { 'live.badge': 'En vivo' });
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <I18nProvider locale="es">
          <LiveButton data-testid="live">On air</LiveButton>
        </I18nProvider>
      </Wrapper>
    );

    expect(screen.getByTestId('live').textContent).toBe('On air');
  });
});
