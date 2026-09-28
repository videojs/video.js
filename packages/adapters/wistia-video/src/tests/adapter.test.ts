import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { WistiaAdapter } from '../adapter';

// Wistia's package registers `<wistia-player>` as it evaluates and reaches for browser APIs the test
// environment has none of, so the class the media extends is stubbed down to what it is extended for.
vi.mock('@wistia/wistia-player', () => {
  class WistiaPlayer extends HTMLElement {
    static observedAttributes = ['media-id', 'player-color'];

    mediaId = '';
    duration = 0;
    muted = false;
    volume = 1;
    currentTime = 0;
    paused = true;
    poster = '';
    preload = 'metadata';
    autoplay = false;
    endVideoBehavior = 'default';
    inFullscreen = false;
    playBarControl = true;
    bigPlayButton = true;
    playerColor = '';

    controlsVisibleOnLoad = true;
    roundedPlayer = 6;

    connectedCallback() {}

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
      if (name === 'media-id') this.mediaId = newValue;

      if (name === 'player-color') this.playerColor = newValue;
    }
  }

  return { WistiaPlayer };
});

const SRC = 'https://wesleyluyten.wistia.com/medias/oifkgmxnkb';

let tagCounter = 0;

type WistiaMediaElement = HTMLElement & Record<string, any>;

function create(): WistiaMediaElement {
  const tag = `test-wistia-media-${tagCounter++}`;

  customElements.define(tag, class extends WistiaAdapter {});
  const element = document.createElement(tag) as WistiaMediaElement;

  document.body.append(element);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('WistiaAdapter', () => {
  it('is Wistia’s own player, normalized rather than wrapped', () => {
    const element = create();

    // No inner player and no container: the element the consumer wrote is the media.
    expect(element.children).toHaveLength(0);
    expect(element.source).toBe(null);
    expect(element.src).toBe('');
  });

  it('resolves a src attribute to the media id Wistia wants', () => {
    const element = create();

    element.setAttribute('src', SRC);

    expect(element.mediaId).toBe('oifkgmxnkb');
    expect(element.src).toBe('oifkgmxnkb');
  });

  it('keeps observing Wistia’s own attributes alongside the media ones', () => {
    const element = create();

    element.setAttribute('player-color', '54bbff');

    expect(element.playerColor).toBe('54bbff');
  });

  it('hides Wistia chrome when no controls attribute was written', () => {
    // Wistia draws chrome by default and an absent attribute reports no change to act on, so without a
    // default of our own the controls would show for markup that never asked for them.
    const element = create();

    expect(element.playBarControl).toBe(false);
    expect(element.bigPlayButton).toBe(false);
    expect(element.controlsVisibleOnLoad).toBe(false);
  });

  it('squares the corners Wistia rounds, which are the skin’s to round', () => {
    const element = create();

    expect(element.roundedPlayer).toBe(0);
  });

  it('lets a source set before connecting outrank the defaults', () => {
    const tag = `test-wistia-media-${tagCounter++}`;

    customElements.define(tag, class extends WistiaAdapter {});
    const element = document.createElement(tag) as WistiaMediaElement;

    element.source = { mediaId: 'oifkgmxnkb', roundedPlayer: 12 };
    document.body.append(element);

    expect(element.roundedPlayer).toBe(12);
  });

  it('turns the controls attribute into the group of switches Wistia hides chrome behind', () => {
    const element = create();

    element.setAttribute('controls', '');
    expect(element.playBarControl).toBe(true);
    expect(element.bigPlayButton).toBe(true);

    element.removeAttribute('controls');

    expect(element.playBarControl).toBe(false);
    expect(element.bigPlayButton).toBe(false);
  });

  it('crops itself to the skin’s corners, which Wistia paints child elements past', () => {
    const element = create();

    expect(element.style.borderRadius).toBe('var(--media-video-border-radius)');
    expect(element.style.overflow).toBe('hidden');

    // Still cropped once chrome is asked for, which is a separate decision.
    element.setAttribute('controls', '');
    expect(element.style.borderRadius).toBe('var(--media-video-border-radius)');
  });

  it('stops a chromeless player taking the pointer events the skin is listening for', () => {
    const element = create();

    expect(element.style.pointerEvents).toBe('none');

    element.setAttribute('controls', '');
    expect(element.style.pointerEvents).toBe('auto');

    element.removeAttribute('controls');
    expect(element.style.pointerEvents).toBe('none');
  });

  it('keeps the chrome a controls attribute asked for on connect', () => {
    // The attribute lands before the first connect, which must not then overwrite it with the default.
    const tag = `test-wistia-media-${tagCounter++}`;

    customElements.define(tag, class extends WistiaAdapter {});
    document.body.innerHTML = `<${tag} controls></${tag}>`;
    const element = document.body.firstElementChild as WistiaMediaElement;

    expect(element.playBarControl).toBe(true);
  });

  it('maps the loop and playsinline attributes onto what Wistia understands', () => {
    const element = create();

    element.setAttribute('loop', '');
    element.setAttribute('playsinline', '');

    expect(element.endVideoBehavior).toBe('loop');
    expect(element.playsInline).toBe(true);
  });

  it('reads the muted attribute as the state to start in, not as the viewer’s', () => {
    const element = create();

    element.setAttribute('muted', '');

    expect(element.defaultMuted).toBe(true);
    expect(element.muted).toBe(true);

    // A mute toggle drives `muted` directly, and must not be reflected back onto the attribute.
    element.muted = false;
    expect(element.muted).toBe(false);
    expect(element.hasAttribute('muted')).toBe(true);
  });

  it('resolves an empty preload, which is what a bare attribute means and not a word Wistia knows', () => {
    const element = create();

    element.setAttribute('preload', 'none');
    expect(element.preload).toBe('none');

    element.setAttribute('preload', '');
    expect(element.preload).toBe('metadata');
  });

  it('keeps a source’s options through a later attribute change', () => {
    const element = create();

    element.source = { mediaId: 'oifkgmxnkb', roundedPlayer: 12 };

    // Every attribute is worked out from scratch, so a source has to outrank the defaults every time.
    element.setAttribute('controls', '');

    expect(element.roundedPlayer).toBe(12);
  });

  it('does not put a mute back when something else about the player changes', () => {
    const element = create();

    element.setAttribute('muted', '');
    element.muted = false;

    element.setAttribute('controls', '');

    expect(element.muted).toBe(false);
  });

  it('accepts a source of Wistia’s own options', () => {
    const element = create();

    element.source = { mediaId: 'oifkgmxnkb', playerColor: '54bbff' };

    expect(element.mediaId).toBe('oifkgmxnkb');
    expect(element.playerColor).toBe('54bbff');
  });

  it('speaks the media event vocabulary', () => {
    const element = create();
    const types: string[] = [];

    for (const type of ['timeupdate', 'volumechange']) {
      element.addEventListener(type, () => types.push(type));
    }

    element.dispatchEvent(new Event('time-update'));
    element.dispatchEvent(new Event('volume-change'));

    expect(types).toEqual(['timeupdate', 'volumechange']);
  });
});
