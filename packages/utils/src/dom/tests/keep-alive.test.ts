import { afterEach, describe, expect, it } from 'vite-plus/test';

import { isKeptAlive } from '../keep-alive';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('isKeptAlive', () => {
  it('reads keep-alive on the element itself', () => {
    const el = document.createElement('div');

    expect(isKeptAlive(el)).toBe(false);

    el.setAttribute('keep-alive', '');
    expect(isKeptAlive(el)).toBe(true);
  });

  it('inherits keep-alive from light-DOM ancestors and shadow hosts', () => {
    const player = document.createElement('div');
    const host = document.createElement('div');
    const el = document.createElement('span');

    host.attachShadow({ mode: 'open' }).append(el);
    player.append(host);
    player.setAttribute('keep-alive', '');

    expect(isKeptAlive(el)).toBe(true);
  });

  it('stops inheriting once the element is detached from the kept-alive tree', () => {
    const player = document.createElement('div');
    const el = document.createElement('span');

    player.setAttribute('keep-alive', '');
    player.append(el);
    el.remove();

    expect(isKeptAlive(el)).toBe(false);
  });
});
