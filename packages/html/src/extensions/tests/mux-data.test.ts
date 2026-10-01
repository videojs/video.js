import { MuxDataExtension as MuxDataExtensionBase } from '@videojs/mux-data';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { MuxDataExtension } from '../mux-data';
import { TestExtensionProvider } from './test-utils';

customElements.define('test-mux-data-provider', TestExtensionProvider);
customElements.define('test-mux-data', MuxDataExtension);

function setup() {
  const provider = new TestExtensionProvider();
  const el = new MuxDataExtension();

  // Prevent the real Mux SDK from initializing (and beaconing) in tests.
  el.MuxDataSdk = undefined;

  provider.append(el);
  document.body.append(provider);

  return { provider, el };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MuxDataExtension', () => {
  it('registers when parsed into a connected player', () => {
    const provider = new TestExtensionProvider();

    document.body.append(provider);
    provider.innerHTML = '<test-mux-data></test-mux-data>';

    expect(provider.extensions.get(MuxDataExtensionBase)).toBeInstanceOf(MuxDataExtensionBase);
  });

  it('leaves the extension to the base class lazy getter', () => {
    // An own `extension` field would shadow the getter and be initialized after
    // the base constructor — too late for a connected upgrade, where the context
    // callback registers the extension from within that constructor.
    expect(Object.getOwnPropertyNames(new MuxDataExtension())).not.toContain('extension');
  });

  it('registers a MuxDataExtension with the surrounding player', () => {
    const { provider } = setup();

    expect(provider.extensions.get(MuxDataExtensionBase)).toBeInstanceOf(MuxDataExtensionBase);
  });

  it('forwards attributes to the extension', () => {
    const { provider, el } = setup();

    el.setAttribute('env-key', 'test-key');
    el.setAttribute('player-software-name', 'mux-video');
    el.setAttribute('player-init-time', '1234');
    el.setAttribute('debug', '');
    el.setAttribute('disable-cookies', '');

    const extension = provider.extensions.get(MuxDataExtensionBase)!;

    expect(extension.envKey).toBe('test-key');
    expect(extension.playerSoftwareName).toBe('mux-video');
    expect(extension.playerInitTime).toBe(1234);
    expect(extension.debug).toBe(true);
    expect(extension.disableCookies).toBe(true);
    // Properties read back from the extension.
    expect(el.envKey).toBe('test-key');
  });

  it('forwards the metadata property to the extension', () => {
    const { provider, el } = setup();
    const metadata = { video_title: 'Test' };

    el.metadata = metadata;

    expect(provider.extensions.get(MuxDataExtensionBase)!.metadata).toEqual(metadata);
  });

  it('releases the extension when the element disconnects', () => {
    const { provider, el } = setup();

    el.remove();

    expect(provider.extensions.get(MuxDataExtensionBase)).toBeUndefined();
  });
});
