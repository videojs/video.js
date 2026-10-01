import { describe, expect, it } from 'vite-plus/test';

import { applyStateDataAttrs, getStateDataAttrs } from '../state-data-attrs';

describe('getStateDataAttrs', () => {
  it('converts true to empty string attribute', () => {
    const state = { paused: true };

    expect(getStateDataAttrs(state)).toEqual({ 'data-paused': '' });
  });

  it.each([false, undefined, null, 0, ''])('ignores falsy value %s', (paused) => {
    expect(getStateDataAttrs({ paused })).toEqual({});
  });

  it('converts string values to attribute', () => {
    const state = { status: 'loading' };

    expect(getStateDataAttrs(state)).toEqual({ 'data-status': 'loading' });
  });

  it('converts number values to string attribute', () => {
    const state = { volume: 0.5 };

    expect(getStateDataAttrs(state)).toEqual({ 'data-volume': '0.5' });
  });

  it('converts keys to lowercase', () => {
    const state = { isPaused: true, ended: false, currentTime: 10, waiting: true, volume: 0.8 };

    expect(getStateDataAttrs(state)).toEqual({
      'data-ispaused': '',
      'data-currenttime': '10',
      'data-waiting': '',
      'data-volume': '0.8',
    });
  });

  it('supports explicit attribute mapping', () => {
    const state = { muted: true, volumeLevel: 'low' };
    const mapping = {
      muted: 'data-muted',
      volumeLevel: 'data-volume-level',
    };

    expect(getStateDataAttrs(state, mapping)).toEqual({
      'data-muted': '',
      'data-volume-level': 'low',
    });
  });

  it('skips unmapped keys when mapping is provided', () => {
    const state = { muted: true, volumeLevel: 'low' };
    const mapping = { muted: 'data-muted' };

    expect(getStateDataAttrs(state, mapping)).toEqual({
      'data-muted': '',
    });
  });
});

describe('applyStateDataAttrs', () => {
  it('applies data attributes to element', () => {
    const element = document.createElement('div');
    const state = { paused: true, volume: 0.5 };

    applyStateDataAttrs(element, state);

    expect(element.getAttribute('data-paused')).toBe('');
    expect(element.getAttribute('data-volume')).toBe('0.5');
  });

  it('does not apply falsy values', () => {
    const element = document.createElement('div');
    const state = { paused: false, ended: null, waiting: undefined };

    applyStateDataAttrs(element, state);

    expect(element.hasAttribute('data-paused')).toBe(false);
    expect(element.hasAttribute('data-ended')).toBe(false);
    expect(element.hasAttribute('data-waiting')).toBe(false);
  });

  it('removes attributes when state becomes false', () => {
    const element = document.createElement('div');

    applyStateDataAttrs(element, { paused: true });
    expect(element.hasAttribute('data-paused')).toBe(true);

    applyStateDataAttrs(element, { paused: false });
    expect(element.hasAttribute('data-paused')).toBe(false);
  });

  it('removes attributes when state becomes null or undefined', () => {
    const element = document.createElement('div');

    applyStateDataAttrs(element, { status: 'loading' });
    expect(element.getAttribute('data-status')).toBe('loading');
    applyStateDataAttrs(element, { status: null });
    expect(element.hasAttribute('data-status')).toBe(false);

    applyStateDataAttrs(element, { status: 'loading' });
    expect(element.getAttribute('data-status')).toBe('loading');
    applyStateDataAttrs(element, { status: undefined });
    expect(element.hasAttribute('data-status')).toBe(false);
  });

  it('handles state transitions correctly', () => {
    const element = document.createElement('div');

    // Initial state
    applyStateDataAttrs(element, { paused: true, ended: false, volume: 0.5 });
    expect(element.hasAttribute('data-paused')).toBe(true);
    expect(element.hasAttribute('data-ended')).toBe(false);
    expect(element.getAttribute('data-volume')).toBe('0.5');

    // Transition: paused false, ended true, volume 0
    applyStateDataAttrs(element, { paused: false, ended: true, volume: 0 });
    expect(element.hasAttribute('data-paused')).toBe(false);
    expect(element.hasAttribute('data-ended')).toBe(true);
    expect(element.hasAttribute('data-volume')).toBe(false);
  });

  it('removes mapped attributes when values become falsy', () => {
    const element = document.createElement('div');
    const mapping = { muted: 'data-muted', volumeLevel: 'data-volume-level' };

    applyStateDataAttrs(element, { muted: true, volumeLevel: 'high' }, mapping);
    expect(element.getAttribute('data-muted')).toBe('');
    expect(element.getAttribute('data-volume-level')).toBe('high');

    applyStateDataAttrs(element, { muted: false, volumeLevel: '' }, mapping);
    expect(element.hasAttribute('data-muted')).toBe(false);
    expect(element.hasAttribute('data-volume-level')).toBe(false);
  });
});
