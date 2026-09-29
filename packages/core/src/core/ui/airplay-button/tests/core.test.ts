import type { MediaRemotePlaybackState } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { AirPlayButtonState } from '../core';
import { AirPlayButtonCore } from '../core';

// AirPlayButtonCore reports `availability: 'unsupported'` outside WebKit
// (detected via `WebKitPlaybackTargetAvailabilityEvent` on globalThis).
// jsdom lacks that constructor, so stub it for every test.
function stubWebKit(present: boolean) {
  const key = 'WebKitPlaybackTargetAvailabilityEvent';

  if (present) {
    (globalThis as unknown as Record<string, unknown>)[key] = class {};
  } else {
    delete (globalThis as unknown as Record<string, unknown>)[key];
  }
}

function createMediaState(overrides: Partial<MediaRemotePlaybackState> = {}): MediaRemotePlaybackState {
  return {
    remotePlaybackState: 'disconnected',
    remotePlaybackAvailability: 'available',
    promptRemotePlayback: vi.fn(async () => {}),
    ...overrides,
  };
}

function createState(overrides: Partial<AirPlayButtonState> = {}): AirPlayButtonState {
  return {
    state: 'disconnected',
    availability: 'available',
    disabled: false,
    hidden: false,
    label: '',
    ...overrides,
  };
}

describe('AirPlayButtonCore', () => {
  beforeEach(() => stubWebKit(true));
  afterEach(() => stubWebKit(false));

  describe('getState', () => {
    it('projects state and availability', () => {
      const core = new AirPlayButtonCore();
      const media = createMediaState({ remotePlaybackState: 'connected' });

      core.setMedia(media);
      const result = core.getState();

      expect(result.state).toBe('connected');
      expect(result.availability).toBe('available');
      expect(result.disabled).toBe(false);
      expect(result.hidden).toBe(false);
    });

    it('marks disabled and hidden when unavailable', () => {
      const core = new AirPlayButtonCore();

      core.setMedia(createMediaState({ remotePlaybackAvailability: 'unavailable' }));
      const state = core.getState();

      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(true);
    });

    it('marks disabled and hidden when unsupported', () => {
      const core = new AirPlayButtonCore();

      core.setMedia(createMediaState({ remotePlaybackAvailability: 'unsupported' }));
      const state = core.getState();

      expect(state.availability).toBe('unsupported');
      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(true);
    });

    it('reflects connecting state', () => {
      const core = new AirPlayButtonCore();

      core.setMedia(createMediaState({ remotePlaybackState: 'connecting' }));
      const result = core.getState();

      expect(result.state).toBe('connecting');
    });

    it('reports unsupported outside WebKit', () => {
      stubWebKit(false);
      const core = new AirPlayButtonCore();

      core.setMedia(createMediaState({ remotePlaybackAvailability: 'available' }));
      const state = core.getState();

      expect(state.availability).toBe('unsupported');
      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(true);
    });

    it('marks disabled when the disabled prop is set, even if available', () => {
      const core = new AirPlayButtonCore({ disabled: true });

      core.setMedia(createMediaState({ remotePlaybackAvailability: 'available' }));
      const state = core.getState();

      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(false);
    });
  });

  describe('getLabel', () => {
    it('returns Start AirPlay when disconnected', () => {
      const core = new AirPlayButtonCore();

      expect(core.getLabel(createState({ state: 'disconnected' }))).toMatchObject({
        key: 'airplay.start',
        text: 'Start AirPlay',
      });
    });

    it('returns Stop AirPlay when connected', () => {
      const core = new AirPlayButtonCore();

      expect(core.getLabel(createState({ state: 'connected' }))).toMatchObject({
        key: 'airplay.stop',
        text: 'Stop AirPlay',
      });
    });

    it('returns Connecting when connecting', () => {
      const core = new AirPlayButtonCore();

      expect(core.getLabel(createState({ state: 'connecting' }))).toMatchObject({
        key: 'cast.connecting',
        text: 'Connecting',
      });
    });

    it('returns custom string label', () => {
      const core = new AirPlayButtonCore({ label: 'AirPlay' });

      expect(core.getLabel(createState())).toBe('AirPlay');
    });

    it('returns custom function label', () => {
      const core = new AirPlayButtonCore({
        label: (state) => (state.state === 'connected' ? 'Disconnect' : 'Connect'),
      });

      expect(core.getLabel(createState({ state: 'connected' }))).toBe('Disconnect');
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new AirPlayButtonCore();
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-label']).toMatchObject({ key: 'airplay.start', text: 'Start AirPlay' });
    });

    it('sets aria-disabled when disabled', () => {
      const core = new AirPlayButtonCore();
      const attrs = core.getAttrs(createState({ disabled: true }));

      expect(attrs['aria-disabled']).toBe('true');
    });

    it('sets the hidden attribute when hidden', () => {
      const core = new AirPlayButtonCore();
      const attrs = core.getAttrs(createState({ hidden: true }));

      expect(attrs.hidden).toBe('');
    });
  });

  describe('toggle', () => {
    it('calls promptRemotePlayback when disconnected', async () => {
      const core = new AirPlayButtonCore();
      const media = createMediaState({ remotePlaybackState: 'disconnected' });

      await core.toggle(media);
      expect(media.promptRemotePlayback).toHaveBeenCalled();
    });

    it('calls promptRemotePlayback when connected', async () => {
      const core = new AirPlayButtonCore();
      const media = createMediaState({ remotePlaybackState: 'connected' });

      await core.toggle(media);
      expect(media.promptRemotePlayback).toHaveBeenCalled();
    });

    it('does nothing when disabled', async () => {
      const core = new AirPlayButtonCore({ disabled: true });
      const media = createMediaState();

      await core.toggle(media);
      expect(media.promptRemotePlayback).not.toHaveBeenCalled();
    });

    it('does nothing when unavailable', async () => {
      const core = new AirPlayButtonCore();
      const media = createMediaState({ remotePlaybackAvailability: 'unavailable' });

      await core.toggle(media);
      expect(media.promptRemotePlayback).not.toHaveBeenCalled();
    });

    it('does nothing when unsupported', async () => {
      const core = new AirPlayButtonCore();
      const media = createMediaState({ remotePlaybackAvailability: 'unsupported' });

      await core.toggle(media);
      expect(media.promptRemotePlayback).not.toHaveBeenCalled();
    });

    it('catches AirPlay errors silently', async () => {
      const core = new AirPlayButtonCore();
      const media = createMediaState({
        promptRemotePlayback: vi.fn(async () => {
          throw new Error('user cancelled');
        }),
      });

      await expect(core.toggle(media)).resolves.toBeUndefined();
    });
  });
});
