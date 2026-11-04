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
    el.setAttribute('debug', '');
    el.setAttribute('disable-progress', '');

    const extension = provider.extensions.get(GoogleAnalyticsExtensionBase)!;

    expect(extension.dataLayerName).toBe('customDataLayer');
    expect(extension.debug).toBe(true);
    expect(el.disableProgress).toBe(true);
    expect(extension.disableProgress).toBe(true);

    el.removeAttribute('disable-progress');
    expect(el.disableProgress).toBe(false);
    expect(extension.disableProgress).toBe(false);

    el.disableProgress = true;
    expect(el.disableProgress).toBe(true);
    expect(extension.disableProgress).toBe(true);
  });

  it('forwards metadata and onEvent properties to the extension', () => {
    const { provider, el } = setup();
    const metadata = { video_title: 'Sample Video', video_id: 'sample-123' };
    const onEvent = () => {};

    el.metadata = metadata;
    el.onEvent = onEvent;

    const extension = provider.extensions.get(GoogleAnalyticsExtensionBase)!;

    expect(extension.metadata).toEqual(metadata);
    expect(extension.onEvent).toBe(onEvent);
    expect(el.metadata).toEqual(metadata);
    expect(el.onEvent).toBe(onEvent);
  });
});
