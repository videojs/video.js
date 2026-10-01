import type { MediaRemotePlaybackState } from '@videojs/media';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { CastButtonState } from '../core';
import { CastButtonCore } from '../core';

function createMediaState(overrides: Partial<MediaRemotePlaybackState> = {}): MediaRemotePlaybackState {
  return {
    remotePlaybackState: 'disconnected',
    remotePlaybackAvailability: 'available',
    promptRemotePlayback: vi.fn(async () => {}),
    ...overrides,
  };
}

function createState(overrides: Partial<CastButtonState> = {}): CastButtonState {
  return {
    connection: 'disconnected',
    availability: 'available',
    disabled: false,
    hidden: false,
    label: '',
    ...overrides,
  };
}

function stubCastSupport(): void {
  vi.stubGlobal('chrome', {});
}

describe('CastButtonCore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getState', () => {
    it('projects connection and availability', () => {
      stubCastSupport();
      const core = new CastButtonCore();
      const media = createMediaState({ remotePlaybackState: 'connected' });

      core.setMedia(media);
      const state = core.getState();

      expect(state.connection).toBe('connected');
      expect(state.availability).toBe('available');
      expect(state.disabled).toBe(false);
      expect(state.hidden).toBe(false);
    });

    it('marks disabled when no cast device is available', () => {
      stubCastSupport();
      const core = new CastButtonCore();

      core.setMedia(createMediaState({ remotePlaybackAvailability: 'unavailable' }));
      const state = core.getState();

      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(false);
    });

    it.each([
      { chrome: undefined, remotePlaybackAvailability: 'available' as const, reason: 'Chrome is absent' },
      { chrome: {}, remotePlaybackAvailability: 'unsupported' as const, reason: 'media is unsupported' },
    ])('marks disabled and hidden when $reason', ({ chrome, remotePlaybackAvailability }) => {
      vi.stubGlobal('chrome', chrome);
      const core = new CastButtonCore();

      core.setMedia(createMediaState({ remotePlaybackAvailability }));
      const state = core.getState();

      expect(state.availability).toBe('unsupported');
      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(true);
    });

    it('marks disabled when the disabled prop is set, even if available', () => {
      stubCastSupport();
      const core = new CastButtonCore({ disabled: true });

      core.setMedia(createMediaState({ remotePlaybackAvailability: 'available' }));
      const state = core.getState();

      expect(state.disabled).toBe(true);
      expect(state.hidden).toBe(false);
    });
  });

  describe('getLabel', () => {
    it('returns Start casting when disconnected', () => {
      const core = new CastButtonCore();

      expect(core.getLabel(createState({ connection: 'disconnected' }))).toMatchObject({
        key: 'cast.start',
        text: 'Start casting',
      });
    });

    it('returns Stop casting when connected', () => {
      const core = new CastButtonCore();

      expect(core.getLabel(createState({ connection: 'connected' }))).toMatchObject({
        key: 'cast.stop',
        text: 'Stop casting',
      });
    });

    it('returns Connecting when connecting', () => {
      const core = new CastButtonCore();

      expect(core.getLabel(createState({ connection: 'connecting' }))).toMatchObject({
        key: 'cast.connecting',
        text: 'Connecting',
      });
    });

    it('returns custom string label', () => {
      const core = new CastButtonCore({ label: 'Cast' });

      expect(core.getLabel(createState())).toBe('Cast');
    });

    it('returns custom function label', () => {
      const core = new CastButtonCore({
        label: (state) => (state.connection === 'connected' ? 'Disconnect' : 'Connect'),
      });

      expect(core.getLabel(createState({ connection: 'connected' }))).toBe('Disconnect');
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label', () => {
      const core = new CastButtonCore();
      const attrs = core.getAttrs(createState());

      expect(attrs['aria-label']).toMatchObject({ key: 'cast.start', text: 'Start casting' });
    });

    it('sets aria-disabled when state.disabled is true', () => {
      const core = new CastButtonCore();
      const attrs = core.getAttrs(createState({ disabled: true }));

      expect(attrs['aria-disabled']).toBe('true');
    });

    it('sets the hidden attribute when state.hidden is true', () => {
      const core = new CastButtonCore();
      const attrs = core.getAttrs(createState({ hidden: true }));

      expect(attrs.hidden).toBe('');
    });
  });

  describe('toggle', () => {
    it('calls promptRemotePlayback when available', async () => {
      stubCastSupport();
      const core = new CastButtonCore();
      const media = createMediaState({ remotePlaybackState: 'disconnected' });

      await core.toggle(media);
      expect(media.promptRemotePlayback).toHaveBeenCalled();
    });

    it('does nothing when the disabled prop is set', async () => {
      stubCastSupport();
      const core = new CastButtonCore({ disabled: true });
      const media = createMediaState();

      await core.toggle(media);
      expect(media.promptRemotePlayback).not.toHaveBeenCalled();
    });

    it('does nothing when no cast device is available', async () => {
      stubCastSupport();
      const core = new CastButtonCore();
      const media = createMediaState({ remotePlaybackAvailability: 'unavailable' });

      await core.toggle(media);
      expect(media.promptRemotePlayback).not.toHaveBeenCalled();
    });

    it('does nothing when unsupported', async () => {
      const core = new CastButtonCore();
      const media = createMediaState({ remotePlaybackAvailability: 'unsupported' });

      await core.toggle(media);
      expect(media.promptRemotePlayback).not.toHaveBeenCalled();
    });

    it('propagates errors from promptRemotePlayback', async () => {
      stubCastSupport();
      const core = new CastButtonCore();
      const media = createMediaState({
        promptRemotePlayback: vi.fn(async () => {
          throw new Error('user cancelled');
        }),
      });

      await expect(core.toggle(media)).rejects.toThrow('user cancelled');
    });
  });
});
