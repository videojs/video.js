import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { usePlayer as useVideoPlayer, VideoPlayer } from '../video/player';

describe('VideoPlayer', () => {
  it('forwards preset configuration props to the player store', () => {
    function Title() {
      const title = useVideoPlayer((state) => state.title);

      return <span>{title}</span>;
    }

    render(
      <VideoPlayer title="Preset title">
        <Title />
      </VideoPlayer>
    );

    expect(screen.getByText('Preset title')).toBeTruthy();
  });
});
