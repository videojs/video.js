import { GoogleAnalyticsExtension as GoogleAnalyticsExtensionBase } from '@videojs/google-analytics';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { GoogleAnalyticsExtension } from '../google-analytics';
import { TestExtensionProvider } from './test-utils';

customElements.define('test-ga-provider', TestExtensionProvider);
customElements.define('test-google-analytics', GoogleAnalyticsExtension);

function setup() {
  const provider = new TestExtensionProvider();
  const el = new GoogleAnalyticsExtension();

  provider.append(el);
  document.body.append(provider);

  return { provider, el };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('GoogleAnalyticsExtension', () => {
  it('registers when parsed into a connected player', () => {
    const provider = new TestExtensionProvider();

    document.body.append(provider);
    provider.innerHTML = '<test-google-analytics></test-google-analytics>';

    expect(provider.extensions.get(GoogleAnalyticsExtensionBase)).toBeInstanceOf(GoogleAnalyticsExtensionBase);
  });

  it('leaves the extension to the base class lazy getter', () => {
    expect(Object.getOwnPropertyNames(new GoogleAnalyticsExtension())).not.toContain('extension');
  });

  it('registers a GoogleAnalyticsExtension with the surrounding player', () => {
    const { provider } = setup();

    expect(provider.extensions.get(GoogleAnalyticsExtensionBase)).toBeInstanceOf(GoogleAnalyticsExtensionBase);
  });

  it('forwards attributes to the extension', () => {
    const { provider, el } = setup();

    el.setAttribute('data-layer-name', 'customDataLayer');
    el.setAttribute('video-title', 'Sample Video');
    el.setAttribute('video-provider', 'custom-provider');
    el.setAttribute('stream-type', 'live');
    el.setAttribute('debug', '');
    el.trackProgress = false;

    const extension = provider.extensions.get(GoogleAnalyticsExtensionBase)!;

    expect(extension.dataLayerName).toBe('customDataLayer');
    expect(extension.videoTitle).toBe('Sample Video');
    expect(extension.videoProvider).toBe('custom-provider');
    expect(extension.streamType).toBe('live');
    expect(extension.debug).toBe(true);
    expect(extension.trackProgress).toBe(false);
  });
});
