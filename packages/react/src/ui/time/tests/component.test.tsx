import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { MediaBufferState, MediaTimeState } from '@videojs/media';
import { formatTimeAsPhrase } from '@videojs/utils/time';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { I18nProvider } from '../../../i18n';
import { createPlayerWrapper } from '../../../testing/mocks';
import { Value } from '../value';

const buffered: MediaBufferState['buffered'] = [];
const seekable: MediaBufferState['seekable'] = [];

const timeState = {
  currentTime: 90,
  duration: 300,
  seeking: false,
  seek: vi.fn(async () => 0),
  buffered,
  seekable,
} satisfies MediaTimeState & MediaBufferState;

function setup(props: Value.Props = {}, state = timeState) {
  const { Wrapper } = createPlayerWrapper(state);

  return render(
    <Wrapper>
      <Value data-testid="time" {...props} />
    </Wrapper>
  );
}

afterEach(cleanup);

describe('Time.Value', () => {
  it('is unavailable when the time range is unknown', () => {
    setup({}, { ...timeState, duration: 0, seekable: [] });

    const time = screen.getByTestId('time');

    expect(time.hasAttribute('data-unavailable')).toBe(true);
    expect(time.hasAttribute('data-disabled')).toBe(false);
    expect(time.getAttribute('aria-label')).toBe('Media not loaded, unknown time.');
    expect(time.hasAttribute('datetime')).toBe(false);
  });

  it('is enabled when a seekable range is available', () => {
    setup({}, { ...timeState, duration: 0, seekable: [[10, 120]] });

    expect(screen.getByTestId('time').hasAttribute('data-unavailable')).toBe(false);
  });

  it('removes unavailable toggles from the tab order', () => {
    setup({ toggle: true }, { ...timeState, duration: 0, seekable: [] });

    const time = screen.getByTestId('time');

    expect(time.hasAttribute('data-disabled')).toBe(true);
    expect(time.hasAttribute('data-unavailable')).toBe(false);
    expect(time.getAttribute('role')).toBe('button');
    expect(time.getAttribute('aria-disabled')).toBe('true');
    expect(time.getAttribute('tabindex')).toBe('-1');

    fireEvent.click(time);

    expect(time.getAttribute('data-type')).toBe('current');
  });

  it('renders current time by default', () => {
    setup();

    const time = screen.getByTestId('time');

    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('datetime')).toBe('PT1M30S');
    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
  });

  it('toggles current time to remaining time on click', () => {
    setup({ toggle: true });

    const time = screen.getByTestId('time');

    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('role')).toBe('button');
    expect(time.getAttribute('tabindex')).toBe('0');
    expect(time.getAttribute('datetime')).toBeNull();
    expect(time.getAttribute('aria-description')).toBe('Toggle between elapsed and remaining time.');
    fireEvent.click(time);

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
    expect(time.getAttribute('aria-label')).toBe('Show elapsed time, 3 minutes, 30 seconds remaining.');

    fireEvent.click(time);

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
    expect(time.getAttribute('aria-label')).toBe('Show remaining time, 1 minute, 30 seconds elapsed.');
  });

  it('includes zero in the toggle label', () => {
    setup({ toggle: true }, { ...timeState, currentTime: 0 });

    expect(screen.getByTestId('time').getAttribute('aria-label')).toBe('Show remaining time, 0 seconds elapsed.');
  });

  it('formats toggle labels with the active locale', () => {
    const { Wrapper } = createPlayerWrapper(timeState);

    const { rerender } = render(
      <Wrapper>
        <I18nProvider
          locale="fr"
          translations={{
            time: {
              showRemaining: 'Afficher restant, {duration}.',
              elapsedSuffix: '{duration} écoulé',
              durationSuffix: '{duration} durée',
            },
          }}
        >
          <Value data-testid="time" toggle />
        </I18nProvider>
      </Wrapper>
    );

    const time = screen.getByTestId('time');

    expect(time.getAttribute('aria-label')).toBe(
      `Afficher restant, ${formatTimeAsPhrase(90, { locale: 'fr' })} écoulé.`
    );

    rerender(
      <Wrapper>
        <I18nProvider
          locale="fr"
          translations={{
            time: {
              showRemaining: 'Afficher restant, {duration}.',
              elapsedSuffix: '{duration} écoulé',
              durationSuffix: '{duration} durée',
            },
          }}
        >
          <Value data-testid="time" toggle type="duration" />
        </I18nProvider>
      </Wrapper>
    );

    expect(time.getAttribute('aria-label')).toBe(
      `Afficher restant, ${formatTimeAsPhrase(300, { locale: 'fr' })} durée.`
    );
  });

  it('formats digital time with locale digits', () => {
    const { Wrapper } = createPlayerWrapper(timeState);

    render(
      <Wrapper>
        <I18nProvider locale="fa">
          <Value data-testid="time" />
        </I18nProvider>
      </Wrapper>
    );

    expect(screen.getByTestId('time').textContent).toBe('۱:۳۰');
  });

  it('toggles with Enter and Space', () => {
    setup({ toggle: true });

    const time = screen.getByTestId('time');

    fireEvent.keyDown(time, { key: 'Enter' });

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');

    fireEvent.keyDown(time, { key: ' ' });

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
  });

  it('does not toggle on repeated keydown events', () => {
    setup({ toggle: true });

    const time = screen.getByTestId('time');

    fireEvent.keyDown(time, { key: 'Enter' });
    fireEvent.keyDown(time, { key: 'Enter', repeat: true });

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
  });

  it('renders a custom negative sign outside the accessible time value', () => {
    setup({ type: 'remaining', negativeSign: '−' });

    const time = screen.getByTestId('time');
    const sign = time.querySelector('span')!;

    expect(time.textContent).toBe('−3:30');
    expect(sign.textContent).toBe('−');
    expect(sign.getAttribute('aria-hidden')).toBe('true');
    expect(time.lastChild?.textContent).toBe('3:30');
  });

  it('starts in remaining mode when type is remaining', () => {
    setup({ toggle: true, type: 'remaining' });

    const time = screen.getByTestId('time');

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
    expect(time.getAttribute('aria-label')).toBe('Show duration, 3 minutes, 30 seconds remaining.');
    expect(time.getAttribute('aria-description')).toBe('Toggle between duration and remaining time.');
  });

  it('toggles remaining time to duration on click', () => {
    setup({ toggle: true, type: 'remaining' });

    const time = screen.getByTestId('time');

    fireEvent.click(time);

    expect(time.textContent).toBe('5:00');
    expect(time.getAttribute('data-type')).toBe('duration');
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('role')).toBe('button');

    fireEvent.click(time);

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');
  });

  it('resets to the default type when toggle is turned off', () => {
    const { Wrapper } = createPlayerWrapper(timeState);
    const { rerender } = render(
      <Wrapper>
        <Value data-testid="time" toggle />
      </Wrapper>
    );

    const time = screen.getByTestId('time');

    fireEvent.click(time);

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');

    rerender(
      <Wrapper>
        <Value data-testid="time" />
      </Wrapper>
    );

    expect(screen.getByTestId('time').tagName).toBe('TIME');
    expect(screen.getByTestId('time').textContent).toBe('1:30');
    expect(screen.getByTestId('time').getAttribute('data-type')).toBe('current');

    rerender(
      <Wrapper>
        <Value data-testid="time" toggle />
      </Wrapper>
    );

    expect(screen.getByTestId('time').tagName).toBe('TIME');
    expect(screen.getByTestId('time').getAttribute('role')).toBe('button');
    expect(screen.getByTestId('time').textContent).toBe('1:30');
    expect(screen.getByTestId('time').getAttribute('data-type')).toBe('current');
  });

  it('toggles duration to remaining time on click', () => {
    setup({ toggle: true, type: 'duration' });

    const time = screen.getByTestId('time');

    fireEvent.click(time);

    expect(time.textContent).toBe('-3:30');
    expect(time.getAttribute('data-type')).toBe('remaining');

    fireEvent.click(time);

    expect(time.textContent).toBe('5:00');
    expect(time.getAttribute('data-type')).toBe('duration');
  });

  it('chains user event handlers with toggling', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();

    setup({ toggle: true, onClick, onKeyDown });

    const time = screen.getByTestId('time');

    fireEvent.click(time);
    expect(time.getAttribute('data-type')).toBe('remaining');

    fireEvent.keyDown(time, { key: 'Enter' });
    expect(time.getAttribute('data-type')).toBe('current');

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('does not toggle when user event handlers prevent default', () => {
    setup({
      toggle: true,
      onClick: (event) => event.preventDefault(),
      onKeyDown: (event) => event.preventDefault(),
    });

    const time = screen.getByTestId('time');

    fireEvent.click(time);
    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');

    fireEvent.keyDown(time, { key: 'Enter' });

    expect(time.textContent).toBe('1:30');
    expect(time.getAttribute('data-type')).toBe('current');
  });
});
