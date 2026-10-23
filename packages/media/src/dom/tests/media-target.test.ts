import { describe, expect, it } from 'vite-plus/test';

import { REGISTERED_MEDIA } from '../../core/registered-media';
import { CustomMediaElement } from '../custom-media-element';
import { HTMLVideoAdapter } from '../html-video-adapter';
import { getMediaAdapter, getMediaElement, getMediaEngineName } from '../utils/media-target';

class TestVideoAdapter extends HTMLVideoAdapter {}

class TestEngineAdapter extends HTMLVideoAdapter {
  static readonly engineName: string = 'testjs';
}

/** Shaped like an adapter that picks its engine per source and reports the pick on the instance. */
class TestDelegatingAdapter extends TestEngineAdapter {
  engineName: string | undefined;
}

/** Shaped like an embed adapter: not an `HTMLMediaAdapter`, fronted by a media component as `adapter`. */
class TestEmbedAdapter extends EventTarget {
  static readonly engineName: string = 'testembed';
}

/** A stand-in for the player's facade: answers `REGISTERED_MEDIA` with `raw` and shadows everything else. */
function createFacade<T extends object>(raw: T, shadow: Record<PropertyKey, unknown> = {}): T {
  return new Proxy(raw, {
    get: (target, prop) => (prop === REGISTERED_MEDIA ? target : (shadow[prop] ?? Reflect.get(target, prop))),
  });
}

customElements.define('test-media-target-video', CustomMediaElement('video', TestVideoAdapter));

describe('getMediaAdapter', () => {
  it('returns an adapter as is', () => {
    const adapter = new TestVideoAdapter();

    expect(getMediaAdapter(adapter)).toBe(adapter);
  });

  it('resolves the adapter a media component fronts', () => {
    const element = document.createElement('test-media-target-video') as HTMLElement & { adapter: TestVideoAdapter };

    expect(getMediaAdapter(element)).toBe(element.adapter);
  });

  it('sees through a player facade', () => {
    const adapter = new TestVideoAdapter();

    expect(getMediaAdapter(createFacade(adapter))).toBe(adapter);
  });

  it('returns null for a native element or an unrelated value', () => {
    expect(getMediaAdapter(document.createElement('video'))).toBeNull();
    expect(getMediaAdapter({ adapter: {} })).toBeNull();
    expect(getMediaAdapter(null)).toBeNull();
  });
});

describe('getMediaEngineName', () => {
  it('reads the static engine name of the media class', () => {
    expect(getMediaEngineName(new TestEngineAdapter())).toBe('testjs');
  });

  it('prefers the engine an adapter reports for its current pick', () => {
    const adapter = new TestDelegatingAdapter();

    adapter.engineName = 'browser';

    expect(getMediaEngineName(adapter)).toBe('browser');

    adapter.engineName = undefined;

    expect(getMediaEngineName(adapter)).toBe('testjs');
  });

  it('reads the adapter a media component fronts, embeds included', () => {
    expect(getMediaEngineName({ adapter: new TestEmbedAdapter() })).toBe('testembed');
    expect(getMediaEngineName(createFacade({ adapter: new TestEngineAdapter() }))).toBe('testjs');
  });

  it('names the browser for a native element', () => {
    expect(getMediaEngineName(document.createElement('video'))).toBe('browser');
    expect(getMediaEngineName(document.createElement('audio'))).toBe('browser');
  });

  it('returns undefined for media that names no engine', () => {
    expect(getMediaEngineName(new TestVideoAdapter())).toBeUndefined();
    expect(getMediaEngineName(null)).toBeUndefined();
  });
});

describe('getMediaElement', () => {
  it('returns a native element as is', () => {
    const video = document.createElement('video');

    expect(getMediaElement(video)).toBe(video);
  });

  it('resolves the element a media component renders', () => {
    const element = document.createElement('test-media-target-video');

    expect(getMediaElement(element)).toBe(element.shadowRoot?.querySelector('video'));
  });

  it('resolves the element an adapter is attached to', () => {
    const adapter = new TestVideoAdapter();
    const video = document.createElement('video');

    expect(getMediaElement(adapter)).toBeNull();

    adapter.attach(video);

    expect(getMediaElement(adapter)).toBe(video);
  });

  it('returns the native element behind a player facade, not the facade', () => {
    const video = document.createElement('video');
    const facade = createFacade(video);

    expect(facade).toBeInstanceOf(HTMLVideoElement);
    expect(getMediaElement(facade)).toBe(video);
  });

  it('ignores a target an override supplies on the facade', () => {
    const adapter = new TestVideoAdapter();
    const video = document.createElement('video');

    adapter.attach(video);

    expect(getMediaElement(createFacade(adapter, { target: null }))).toBe(video);
  });

  it('returns null for media without a native element behind it', () => {
    expect(getMediaElement(new EventTarget())).toBeNull();
    expect(getMediaElement(null)).toBeNull();
  });
});
