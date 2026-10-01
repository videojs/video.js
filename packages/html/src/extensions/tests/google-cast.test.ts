import { GoogleCastExtension as GoogleCastExtensionBase } from '@videojs/google-cast';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { GoogleCastExtension } from '../google-cast';
import { TestExtensionProvider } from './test-utils';

customElements.define('test-cast-provider', TestExtensionProvider);
customElements.define('test-google-cast', GoogleCastExtension);

function setup() {
  const provider = new TestExtensionProvider();
  const el = new GoogleCastExtension();

  provider.append(el);
  document.body.append(provider);

  return { provider, el };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('GoogleCastExtension', () => {
  it('registers a GoogleCastExtension with the surrounding player', () => {
    const { provider } = setup();

    expect(provider.extensions.get(GoogleCastExtensionBase)).toBeInstanceOf(GoogleCastExtensionBase);
  });

  it('follows the media the player attaches, a plain video included', () => {
    const { provider } = setup();
    const video = document.createElement('video');

    video.src = 'https://example.com/video.mp4';
    provider.extensions.attach({ media: video, container: null });

    expect(provider.extensions.get(GoogleCastExtensionBase)!.src).toBe('https://example.com/video.mp4');
  });

  it('forwards attributes to the extension', () => {
    const { provider, el } = setup();

    el.setAttribute('receiver', 'APP_ID');
    el.setAttribute('content-type', 'application/x-mpegURL');
    el.setAttribute('stream-type', 'live');
    el.setAttribute('src', 'https://example.com/stream.m3u8');

    const extension = provider.extensions.get(GoogleCastExtensionBase)!;

    expect(extension.receiver).toBe('APP_ID');
    expect(extension.contentType).toBe('application/x-mpegURL');
    expect(extension.streamType).toBe('live');
    expect(extension.src).toBe('https://example.com/stream.m3u8');
    // Properties read back from the extension.
    expect(el.receiver).toBe('APP_ID');
  });

  it('forwards the customData property to the extension', () => {
    const { provider, el } = setup();
    const customData = { token: 'abc' };

    el.customData = customData;

    expect(provider.extensions.get(GoogleCastExtensionBase)!.customData).toBe(customData);
  });

  it('releases the extension when the element disconnects', () => {
    const { provider, el } = setup();

    el.remove();

    expect(provider.extensions.get(GoogleCastExtensionBase)).toBeUndefined();
  });

  it('releases the extension on destroy', () => {
    const { provider, el } = setup();

    el.destroy();

    expect(provider.extensions.get(GoogleCastExtensionBase)).toBeUndefined();
  });
});
