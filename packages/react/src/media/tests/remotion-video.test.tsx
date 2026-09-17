import { render } from '@testing-library/react';
import type { RemotionSource } from '@videojs/remotion-video';
import { forwardRef, useImperativeHandle } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RemotionVideo } from '../remotion-video';

// A real `<Player>` mounts Remotion's renderer and drives an animation loop, where this component only renders the tag
// and binds its ref. The stub records what it is handed and answers the `PlayerRef` calls the adapter makes on attach.
const players: { props: Record<string, unknown>; mounts: number }[] = [];

vi.mock('@remotion/player', () => ({
  Player: forwardRef<unknown, Record<string, unknown>>(function Player(props, ref) {
    players.push({ props, mounts: players.length });

    useImperativeHandle(ref, () => ({
      isMuted: () => false,
      isPlaying: () => false,
      getVolume: () => 1,
      getCurrentFrame: () => 0,
      addEventListener: () => {},
      removeEventListener: () => {},
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      mute: () => {},
      unmute: () => {},
      setVolume: () => {},
    }));

    return <div data-testid="remotion-player" />;
  }),
}));

const Composition = () => null;

const SOURCE: RemotionSource = {
  id: 'greeting',
  composition: {
    component: Composition,
    durationInFrames: 150,
    fps: 30,
    compositionWidth: 1920,
    compositionHeight: 1080,
  },
};

/** The props the most recently rendered `<Player>` received. */
function lastPlayerProps() {
  const player = players.at(-1);
  if (!player) throw new Error('no <Player> rendered');

  return player.props;
}

describe('RemotionVideo', () => {
  it('renders no player until a composition names what to play', () => {
    const { queryByTestId } = render(<RemotionVideo />);

    expect(queryByTestId('remotion-player')).toBeNull();
  });

  it('hands Remotion the composition and its timing', () => {
    render(<RemotionVideo source={SOURCE} />);

    expect(lastPlayerProps()).toMatchObject({
      component: Composition,
      durationInFrames: 150,
      fps: 30,
      compositionWidth: 1920,
      compositionHeight: 1080,
      inputProps: {},
    });
  });

  it('switches off every Remotion control surface, because the player owns them', () => {
    render(<RemotionVideo source={SOURCE} />);

    expect(lastPlayerProps()).toMatchObject({
      controls: false,
      clickToPlay: false,
      doubleClickToFullscreen: false,
      spaceKeyToPlayOrPause: false,
      allowFullscreen: false,
      browserMediaControlsBehavior: { mode: 'do-nothing' },
    });
  });

  it('leaves the composition on its last frame when it ends, as a media element does', () => {
    render(<RemotionVideo source={SOURCE} />);

    expect(lastPlayerProps()).toMatchObject({ moveToBeginningWhenEnded: false });
  });

  it('carries the values Remotion only takes as props', () => {
    render(<RemotionVideo source={SOURCE} loop playbackRate={2} muted volume={0.5} />);

    expect(lastPlayerProps()).toMatchObject({
      loop: true,
      playbackRate: 2,
      initiallyMuted: true,
      initialVolume: 0.5,
    });
  });

  it('keeps one player across an input-props edit, and remounts for a new composition', () => {
    const { rerender } = render(<RemotionVideo source={SOURCE} />);
    const before = players.length;

    rerender(
      <RemotionVideo source={{ ...SOURCE, composition: { ...SOURCE.composition, inputProps: { name: 'Ada' } } }} />
    );

    expect(lastPlayerProps()).toMatchObject({ inputProps: { name: 'Ada' } });

    rerender(<RemotionVideo source={{ ...SOURCE, id: 'outro' }} />);

    expect(players.length).toBeGreaterThan(before);
    expect(lastPlayerProps()).toMatchObject({ durationInFrames: 150 });
  });

  it('resets a prop to its default once the author stops passing it', () => {
    const { rerender } = render(<RemotionVideo source={SOURCE} playbackRate={2} />);

    expect(lastPlayerProps()).toMatchObject({ playbackRate: 2 });

    rerender(<RemotionVideo source={SOURCE} />);

    expect(lastPlayerProps()).toMatchObject({ playbackRate: 1 });
  });
});
