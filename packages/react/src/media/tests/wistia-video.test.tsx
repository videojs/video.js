import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PlayerContextProvider, type PlayerContextValue } from '../../player/context';
import { WistiaVideo } from '../wistia-video';

// Connecting a real player reaches for Wistia's CDN and runs an embed, where this component only renders the tag and
// configures its attributes and properties. Reuse the adapter's engine-free helpers while replacing the entry that registers the real player.
vi.mock('@videojs/wistia-video', async () => {
  const helpers = await vi.importActual<typeof import('@videojs/wistia-video/helpers')>(
    '@videojs/wistia-video/helpers'
  );

  class WistiaPlayer extends HTMLElement {
    static observedAttributes: string[] = [];
    mutedAssignments: unknown[] = [];
    #muted: unknown = false;

    get muted() {
      return this.#muted;
    }

    set muted(value: unknown) {
      this.mutedAssignments.push(value);
      this.#muted = value;
    }

    get currentTime() {
      return Number(this.getAttribute('current-time'));
    }

    set currentTime(value: number) {
      this.setAttribute('current-time', String(value));
    }
  }

  customElements.define('wistia-player', WistiaPlayer);
  return { ...helpers, WISTIA_PLAYER_TAG: 'wistia-player' };
});

const SRC = 'https://wesleyluyten.wistia.com/medias/oifkgmxnkb';

interface TestWistiaPlayer extends HTMLElement {
  muted: unknown;
  mutedAssignments: unknown[];
  currentTime: number;
}

function renderPlayer(ui: React.ReactElement): TestWistiaPlayer {
  const { container } = render(ui);
  const player = container.querySelector<TestWistiaPlayer>('wistia-player');
  if (!player) throw new Error('no <wistia-player> rendered');

  return player;
}

describe('WistiaVideo', () => {
  it('routes media event props to the element, which React wires only for <video> and <audio>', () => {
    const onPlay = vi.fn((event: Event) => event.currentTarget);
    const onTimeUpdate = vi.fn();
    const player = renderPlayer(<WistiaVideo src={SRC} onPlay={onPlay} onTimeUpdate={onTimeUpdate} />);

    player.dispatchEvent(new Event('play'));
    player.dispatchEvent(new Event('timeupdate'));

    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveReturnedWith(player);
    expect(onTimeUpdate).toHaveBeenCalledTimes(1);
  });

  it('resolves a Wistia URL to the media id the player wants', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} />).getAttribute('media-id')).toBe('oifkgmxnkb');
  });

  it('takes the media id straight from a source', () => {
    expect(renderPlayer(<WistiaVideo source={{ mediaId: 'abcde12345' }} />).getAttribute('media-id')).toBe(
      'abcde12345'
    );
  });

  it("passes Wistia's own options through untouched, spelled the way its element observes them", () => {
    const player = renderPlayer(
      <WistiaVideo source={{ mediaId: 'abcde12345', playerColor: '54bbff', qualityMin: 540 }} />
    );

    expect(player.getAttribute('player-color')).toBe('54bbff');
    expect(player.getAttribute('quality-min')).toBe('540');
  });

  it('hides Wistia chrome unless controls are asked for', () => {
    const { rerender, container } = render(<WistiaVideo src={SRC} />);
    const player = container.querySelector('wistia-player') as HTMLElement;

    // Spelled out rather than dropped: an absent attribute is Wistia's default, which is chrome.
    expect(player.getAttribute('big-play-button')).toBe('false');
    expect(player.getAttribute('play-bar-control')).toBe('false');

    rerender(<WistiaVideo src={SRC} controls />);

    expect(player.getAttribute('big-play-button')).toBe('true');
    expect(player.getAttribute('play-bar-control')).toBe('true');
  });

  it('squares the corners Wistia rounds, and lets a source round them back', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} />).getAttribute('rounded-player')).toBe('0');
    expect(renderPlayer(<WistiaVideo src={SRC} source={{ roundedPlayer: 12 }} />).getAttribute('rounded-player')).toBe(
      '12'
    );
  });

  it('crops itself to the skin’s corners, which Wistia paints child elements past', () => {
    const { style } = renderPlayer(<WistiaVideo src={SRC} />);

    expect(style.borderRadius).toBe('var(--media-video-border-radius)');
    expect(style.overflow).toBe('hidden');
  });

  it('stops a chromeless player taking the pointer events the skin is listening for', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} />).style.pointerEvents).toBe('none');
    expect(renderPlayer(<WistiaVideo src={SRC} controls />).style.pointerEvents).toBe('auto');
  });

  it('merges a style of its own rather than replacing the consumer’s', () => {
    const { style } = renderPlayer(<WistiaVideo src={SRC} style={{ borderRadius: 8 }} />);

    expect(style.borderRadius).toBe('8px');
    expect(style.pointerEvents).toBe('none');
  });

  it('spells loop the way Wistia does', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} loop />).getAttribute('end-video-behavior')).toBe('loop');
  });

  it('sends defaultMuted as the muted state the player starts in', () => {
    // Sent as a boolean rather than a spelling of one: Wistia keeps `muted` on its prototype, so React assigns
    // it rather than writing it, and the setter it reaches branches on the value it is handed.
    const player = renderPlayer(<WistiaVideo src={SRC} defaultMuted />);

    expect(player.mutedAssignments).toEqual([true]);
    expect(player.muted).toBe(true);
  });

  it('leaves an explicitly unmuted player unmuted, where a spelled-out false would mute it', () => {
    const player = renderPlayer(<WistiaVideo src={SRC} defaultMuted={false} />);

    expect(player.mutedAssignments).toEqual([false]);
    expect(player.muted).toBe(false);
  });

  it('does not put a mute back after the viewer cleared it', () => {
    const { rerender, container } = render(<WistiaVideo src={SRC} defaultMuted />);
    const player = container.querySelector<TestWistiaPlayer>('wistia-player')!;

    expect(player.mutedAssignments).toEqual([true]);
    expect(player.muted).toBe(true);
    player.muted = false;
    player.mutedAssignments.length = 0;

    rerender(<WistiaVideo src={SRC} defaultMuted className="changed" />);

    const current = container.querySelector<TestWistiaPlayer>('wistia-player')!;

    expect(current).toBe(player);
    expect(current.muted).toBe(false);
    expect(current.mutedAssignments).toEqual([]);
    expect(current.getAttribute('class')).toBe('changed');
  });

  it('deep-links a wtime start time the way the element does', () => {
    expect(renderPlayer(<WistiaVideo src={`${SRC}?wtime=30`} />).getAttribute('current-time')).toBe('30');
  });

  it('gives a new media the start time its own URL asked for, and no other', () => {
    const { rerender, container } = render(<WistiaVideo src={`${SRC}?wtime=30`} />);

    expect(container.querySelector('wistia-player')?.getAttribute('current-time')).toBe('30');

    rerender(<WistiaVideo source={{ mediaId: 'abcde12345' }} />);

    expect(container.querySelector('wistia-player')?.hasAttribute('current-time')).toBe(false);
  });

  it('does not send a playing media back to its start time on a later render', () => {
    const { rerender, container } = render(<WistiaVideo src={`${SRC}?wtime=30`} />);
    const player = container.querySelector<TestWistiaPlayer>('wistia-player')!;

    expect(player.currentTime).toBe(30);
    player.currentTime = 45;

    rerender(<WistiaVideo src={`${SRC}?wtime=30`} className="changed" />);

    const current = container.querySelector<TestWistiaPlayer>('wistia-player')!;

    expect(current).toBe(player);
    expect(current.currentTime).toBe(45);
    expect(current.getAttribute('class')).toBe('changed');
  });

  it('leaves currentTime alone for a source with no start time', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} />).hasAttribute('current-time')).toBe(false);
  });

  it('resolves an empty preload, which Wistia does not accept', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} preload="" />).getAttribute('preload')).toBe('metadata');
  });

  it('keeps playsInline to itself, since Wistia plays inline and has no knob for it', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} playsInline />).hasAttribute('plays-inline')).toBe(false);
  });

  it('leaves out an option with no attribute spelling rather than writing nonsense', () => {
    const player = renderPlayer(<WistiaVideo src={SRC} source={{ playerColorGradient: { on: false } }} />);

    expect(player.hasAttribute('player-color-gradient')).toBe(false);
  });

  it('passes unknown props through to the player', () => {
    expect(renderPlayer(<WistiaVideo src={SRC} className="block h-full w-full" />).getAttribute('class')).toBe(
      'block h-full w-full'
    );
  });

  it('replaces the element when the media does, and keeps it when only an option changes', () => {
    const { rerender, container } = render(<WistiaVideo src={SRC} />);
    const first = container.querySelector('wistia-player');

    expect(first).toBeTruthy();

    rerender(<WistiaVideo src={SRC} source={{ playerColor: '54bbff' }} />);
    expect(container.querySelector('wistia-player')).toBe(first);

    rerender(<WistiaVideo source={{ mediaId: 'abcde12345' }} />);
    const replacement = container.querySelector('wistia-player');

    expect(replacement).toBeTruthy();
    expect(replacement).not.toBe(first);
    expect(replacement!.getAttribute('media-id')).toBe('abcde12345');
  });

  it('normalizes the element as it mounts, since the store reads a media only once', () => {
    const registered: { element: unknown; seeking: boolean; source: boolean }[] = [];
    const setMedia = vi.fn((element) => {
      if (element) registered.push({ element, seeking: 'seeking' in element, source: 'source' in element });
    });
    const context: PlayerContextValue = {
      store: {} as PlayerContextValue['store'],
      media: null,
      setMedia,
      container: null,
      setContainer: vi.fn(),
    };
    const { container } = render(
      <PlayerContextProvider value={context}>
        <WistiaVideo src={SRC} />
      </PlayerContextProvider>
    );
    const player = container.querySelector('wistia-player');

    expect(player).toBeTruthy();
    expect(registered).toEqual([{ element: player, seeking: true, source: true }]);
  });
});
