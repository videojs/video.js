import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { HTMLAudioAdapter } from '../html-audio-adapter';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('HTMLMediaAdapter', () => {
  describe('target forwarding', () => {
    it('reads from the attached target', () => {
      const host = new HTMLAudioAdapter();
      const audio = document.createElement('audio');

      audio.muted = true;
      Object.defineProperty(audio, 'paused', { value: false });
      host.attach(audio);

      expect(host.muted).toBe(true);
      expect(host.paused).toBe(false);
    });

    it('falls back to the default when nothing is attached', () => {
      const host = new HTMLAudioAdapter();

      expect(host.paused).toBe(true);
      expect(host.muted).toBe(false);
      expect(host.contentData).toBeUndefined();
    });

    it('reads content data independently from the legacy title property', () => {
      const host = new HTMLAudioAdapter();
      const audio = document.createElement('audio') as HTMLAudioElement & {
        contentData?: Record<string, string | null>;
      };

      audio.title = 'Legacy title';
      host.attach(audio);

      expect(host.contentData).toBeUndefined();

      audio.contentData = { title: 'Media title' };

      expect(host.contentData).toEqual({ title: 'Media title' });
      expect(host.title).toBe('Legacy title');
    });

    it('writes setter values to the target', () => {
      const host = new HTMLAudioAdapter();
      const audio = document.createElement('audio');

      host.attach(audio);

      host.muted = true;
      host.volume = 0.5;

      expect(audio.muted).toBe(true);
      expect(audio.volume).toBe(0.5);
    });

    it('ignores setter values when nothing is attached', () => {
      const host = new HTMLAudioAdapter();

      host.muted = true;

      expect(host.muted).toBe(false);
    });

    it('stops forwarding events from a detached target', () => {
      const host = new HTMLAudioAdapter();
      const audio = document.createElement('audio');
      const listener = vi.fn();

      host.addEventListener('play', listener);
      host.attach(audio);
      audio.dispatchEvent(new Event('play'));

      expect(listener).toHaveBeenCalledOnce();

      host.destroy();
      audio.dispatchEvent(new Event('play'));

      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('play', () => {
    it('rejects when nothing is attached', async () => {
      const host = new HTMLAudioAdapter();

      await expect(host.play()).rejects.toBeInstanceOf(DOMException);
    });

    it('rejects when the target lacks a play implementation', async () => {
      const host = new HTMLAudioAdapter();

      host.attach({} as HTMLAudioElement);

      await expect(host.play()).rejects.toBeInstanceOf(DOMException);
    });
  });

  it('stops forwarding from the target after destroy', () => {
    const host = new HTMLAudioAdapter();
    const audio = document.createElement('audio');
    const listener = vi.fn();

    host.attach(audio);
    host.addEventListener('play', listener);
    audio.dispatchEvent(new Event('play'));
    expect(listener).toHaveBeenCalledOnce();

    host.destroy();
    listener.mockClear();
    audio.dispatchEvent(new Event('play'));

    expect(listener).not.toHaveBeenCalled();
  });

  it('forwards contentdatachange from the attached media target', () => {
    const host = new HTMLAudioAdapter();
    const audio = document.createElement('audio') as HTMLAudioElement & {
      contentData: Record<string, string | null>;
    };

    audio.contentData = { title: null };
    const listener = vi.fn();

    host.attach(audio);
    host.addEventListener('contentdatachange', listener);

    audio.contentData = { title: 'Media title' };
    audio.dispatchEvent(new Event('contentdatachange'));

    expect(listener).toHaveBeenCalledOnce();
    expect(host.contentData).toEqual({ title: 'Media title' });
  });
});
