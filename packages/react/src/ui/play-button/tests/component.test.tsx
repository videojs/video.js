import { cleanup, render, screen } from '@testing-library/react';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createI18n, I18nProvider } from '../../../i18n';
import { createPlayerWrapper } from '../../../testing/mocks';
import { PlayButton } from '../component';

afterEach(() => {
  resetI18nRegistry();
  cleanup();
});

describe('PlayButton', () => {
  it('applies translated aria-label and updates when locale changes', () => {
    registerI18n('es', { 'buttons.play': 'Reproducir' });
    registerI18n('fr', { 'buttons.play': 'Lire' });

    const { Wrapper } = createPlayerWrapper({
      paused: true,
      ended: false,
      started: false,
      waiting: false,
      play: vi.fn(),
      pause: vi.fn(),
    });

    const { rerender } = render(
      <Wrapper>
        <I18nProvider locale="es">
          <PlayButton data-testid="play" />
        </I18nProvider>
      </Wrapper>
    );

    expect(screen.getByTestId('play').getAttribute('aria-label')).toBe('Reproducir');

    rerender(
      <Wrapper>
        <I18nProvider locale="fr">
          <PlayButton data-testid="play" />
        </I18nProvider>
      </Wrapper>
    );

    expect(screen.getByTestId('play').getAttribute('aria-label')).toBe('Lire');
  });

  it('uses translations from a createI18n provider', () => {
    const { I18nProvider: CustomI18nProvider } = createI18n();

    const { Wrapper } = createPlayerWrapper({
      paused: true,
      ended: false,
      started: false,
      waiting: false,
      play: vi.fn(),
      pause: vi.fn(),
    });

    render(
      <Wrapper>
        <CustomI18nProvider locale="en" translations={{ 'buttons.play': 'Custom play' }}>
          <PlayButton data-testid="play" />
        </CustomI18nProvider>
      </Wrapper>
    );

    expect(screen.getByTestId('play').getAttribute('aria-label')).toBe('Custom play');
  });
});
