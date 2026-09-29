import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPlayerWrapper } from '../../../testing/mocks';
import { Menu } from '../../menu';
import { Tooltip, useOptionalTooltipContext } from '../../tooltip';
import { CaptionsButton } from '../component';

afterEach(cleanup);

function renderCaptionsTrigger({
  textTrackList = [
    { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'showing' },
    { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
  ] as const,
  toggleSubtitles = vi.fn(() => true),
}: {
  textTrackList?: readonly { id: string; kind: string; label: string; language: string; mode: string }[];
  toggleSubtitles?: () => boolean;
} = {}) {
  const { Wrapper } = createPlayerWrapper({
    textTrackList,
    subtitlesShowing: true,
    selectSubtitlesTrack: vi.fn(),
    chaptersCues: [],
    thumbnailsTrack: null,
    toggleSubtitles,
  });

  render(
    <Menu.Root>
      <Menu.Trigger render={<CaptionsButton data-testid="trigger" />} />
      <Menu.Popup>
        <Menu.Content>Captions</Menu.Content>
      </Menu.Popup>
    </Menu.Root>,
    { wrapper: Wrapper }
  );

  return { toggleSubtitles };
}

describe('CaptionsButton', () => {
  it('does not register tooltip content when hidden', () => {
    const { Wrapper } = createPlayerWrapper({
      textTrackList: [],
      subtitlesShowing: false,
      selectSubtitlesTrack: vi.fn(),
      chaptersCues: [],
      thumbnailsTrack: null,
      toggleSubtitles: vi.fn(),
    });

    function TooltipContentProbe() {
      const tooltip = useOptionalTooltipContext();

      return <span data-testid="tooltip-label">{tooltip?.content?.label}</span>;
    }

    render(
      <Tooltip.Root>
        <CaptionsButton data-testid="trigger" />
        <TooltipContentProbe />
      </Tooltip.Root>,
      { wrapper: Wrapper }
    );

    expect(screen.queryByTestId('trigger')).toBeNull();
    expect(screen.getByTestId('tooltip-label').textContent).toBe('');
  });

  it('does not toggle captions when rendered inside Menu.Trigger with multiple tracks', () => {
    const { toggleSubtitles } = renderCaptionsTrigger();

    fireEvent.click(screen.getByTestId('trigger'));

    expect(toggleSubtitles).not.toHaveBeenCalled();
  });

  it('still toggles captions outside Menu.Trigger', () => {
    const toggleSubtitles = vi.fn(() => true);
    const { Wrapper } = createPlayerWrapper({
      textTrackList: [
        { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'showing' },
        { id: 'subtitles-es', kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
      ],
      subtitlesShowing: true,
      selectSubtitlesTrack: vi.fn(),
      chaptersCues: [],
      thumbnailsTrack: null,
      toggleSubtitles,
    });

    render(<CaptionsButton data-testid="trigger" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByTestId('trigger'));

    expect(toggleSubtitles).toHaveBeenCalled();
  });
});
