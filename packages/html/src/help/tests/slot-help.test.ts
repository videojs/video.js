import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { afterParse, createSlotHelp, PLAYER_HELP_URL } from '../slot-help';

function getHelp(slot: HTMLSlotElement): HTMLElement {
  const help = slot.nextElementSibling;
  if (!(help instanceof HTMLElement)) throw new Error('No help after the slot');

  return help;
}

function createHost() {
  const host = document.createElement('div');
  const slot = document.createElement('slot');

  host.attachShadow({ mode: 'open' }).append(slot);
  document.body.append(host);

  return { host, slot };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('createSlotHelp', () => {
  it('puts a hidden help message with a link after the slot', () => {
    const { slot } = createHost();

    createSlotHelp(slot, 'Add a Media to this skin.');

    const help = getHelp(slot);

    expect(help.hidden).toBe(true);
    expect(help.textContent).toBe('Add a Media to this skin. Learn more');
    expect(help.querySelector('a')?.getAttribute('href')).toBe(PLAYER_HELP_URL);
  });

  it('shows the help while only whitespace is assigned to the slot', () => {
    const { host, slot } = createHost();
    const update = createSlotHelp(slot, 'Add a Media.');

    host.append('\n  ');
    update();

    expect(getHelp(slot).hidden).toBe(false);
  });

  it('hides the help once an element is assigned to the slot', () => {
    const { host, slot } = createHost();
    const update = createSlotHelp(slot, 'Add a Media.');

    update();
    host.append(document.createElement('video'));
    update();

    expect(getHelp(slot).hidden).toBe(true);
  });
});

describe('afterParse', () => {
  it('runs right away once the document has parsed', () => {
    const callback = vi.fn();

    afterParse(document, callback);

    expect(callback).toHaveBeenCalledOnce();
  });

  it('waits for DOMContentLoaded while the document is loading', () => {
    const callback = vi.fn();

    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    afterParse(document, callback);

    expect(callback).not.toHaveBeenCalled();

    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(callback).toHaveBeenCalledOnce();
  });
});
