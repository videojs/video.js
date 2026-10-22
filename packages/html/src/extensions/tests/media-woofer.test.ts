import { MediaWooferExtension as MediaWooferExtensionBase } from '@videojs/media-woofer';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { MediaWooferExtension } from '../media-woofer';
import { TestExtensionProvider } from './test-utils';

customElements.define('test-woofer-provider', TestExtensionProvider);
customElements.define('test-media-woofer', MediaWooferExtension);

function setup() {
  const provider = new TestExtensionProvider();
  const el = new MediaWooferExtension();

  provider.append(el);
  document.body.append(provider);

  return { provider, el };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MediaWooferExtension', () => {
  it('registers a MediaWooferExtension with the surrounding player', () => {
    const { provider } = setup();

    expect(provider.extensions.get(MediaWooferExtensionBase)).toBeInstanceOf(MediaWooferExtensionBase);
  });

  it('forwards attributes to the extension', () => {
    const { provider, el } = setup();

    el.setAttribute('threshold', '200');
    el.setAttribute('vibration', '0');

    const extension = provider.extensions.get(MediaWooferExtensionBase)!;

    expect(extension.threshold).toBe(200);
    expect(extension.vibration).toBe(0);
    expect(el.threshold).toBe(200);
  });

  it('restores the default when an attribute is removed', () => {
    const { provider, el } = setup();

    el.setAttribute('threshold', '200');
    el.removeAttribute('threshold');

    expect(provider.extensions.get(MediaWooferExtensionBase)!.threshold).toBe(
      MediaWooferExtensionBase.defaultProps.threshold
    );
  });

  it('releases the extension when the element disconnects', () => {
    const { provider, el } = setup();

    el.remove();

    expect(provider.extensions.get(MediaWooferExtensionBase)).toBeUndefined();
  });
});
