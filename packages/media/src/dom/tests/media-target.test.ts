import { describe, expect, it } from 'vite-plus/test';

import { REGISTERED_MEDIA } from '../../core/registered-media';
import { CustomMediaElement } from '../custom-media-element';
import { HTMLVideoAdapter } from '../html-video-adapter';
import { getMediaAdapter, getMediaElement } from '../utils/media-target';

class TestVideoAdapter extends HTMLVideoAdapter {}

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
