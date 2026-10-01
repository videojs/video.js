import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  findLocaleKeys,
  getI18nTranslations,
  hasRegisteredLocale,
  onI18nRegistryChange,
  registerI18n,
  resetI18nRegistry,
} from '../registry';

describe('i18n registry', () => {
  beforeEach(() => {
    resetI18nRegistry();
  });

  it('merges multiple registerI18n calls for one locale', () => {
    registerI18n('es', { buttons: { play: 'Ir' } });
    registerI18n('es', { buttons: { pause: 'Pausa' } });
    const es = getI18nTranslations('es');

    expect(es['buttons.play']).toBe('Ir');
    expect(es['buttons.pause']).toBe('Pausa');
  });

  it('leaves missing keys for descriptor fallbacks', () => {
    registerI18n('es', { 'buttons.play': 'Ir' });
    const es = getI18nTranslations('es');

    expect(es['buttons.mute']).toBeUndefined();
  });

  it('resolves es-419-u-nu-latn to the es layer before English', () => {
    registerI18n('es', { 'buttons.play': 'ES-generic' });
    const merged = getI18nTranslations('es-419-u-nu-latn');

    expect(merged['buttons.play']).toBe('ES-generic');
  });

  it('registers unicode-extension locales under the same key as findLocaleKeys', () => {
    registerI18n('es-u-nu-latn', { 'buttons.play': 'Latin-numerals ES' });
    expect(hasRegisteredLocale('es-u-nu-latn')).toBe(true);
    expect(getI18nTranslations('es-u-nu-latn')['buttons.play']).toBe('Latin-numerals ES');
  });

  it('does not strip -u- subtags inside a private-use extension', () => {
    registerI18n('en-x-u-k0', { 'buttons.play': 'Private U' });
    registerI18n('en-x-u-k1', { 'buttons.play': 'Private U2' });
    expect(getI18nTranslations('en-x-u-k0')['buttons.play']).toBe('Private U');
    expect(getI18nTranslations('en-x-u-k1')['buttons.play']).toBe('Private U2');
  });

  it('walks zh-Hant-HK through zh-TW before zh', () => {
    expect(findLocaleKeys('zh-Hant-HK')).toEqual(['zh-hant-hk', 'zh-hant', 'zh-tw', 'zh', 'en']);
    registerI18n('zh', { 'buttons.play': 'ZH' });
    registerI18n('zh-TW', { 'buttons.play': 'TW' });
    registerI18n('zh-Hant', { 'buttons.pause': 'Hant' });
    registerI18n('zh-Hant-HK', { 'buttons.replay': 'HK' });
    const merged = getI18nTranslations('zh-Hant-HK');

    expect(merged['buttons.replay']).toBe('HK');
    expect(merged['buttons.pause']).toBe('Hant');
    expect(merged['buttons.play']).toBe('TW');
    expect(merged['buttons.mute']).toBeUndefined();
  });

  it('walks zh-Hans-HK through zh-CN before zh', () => {
    expect(findLocaleKeys('zh-Hans-HK')).toEqual(['zh-hans-hk', 'zh-hans', 'zh-cn', 'zh', 'en']);
  });

  it('truncates en-GB-scotland toward en-GB then en', () => {
    expect(findLocaleKeys('en-GB-scotland')).toEqual(['en-gb-scotland', 'en-gb', 'en']);
    registerI18n('en-GB', { 'buttons.play': 'GB' });
    const merged = getI18nTranslations('en-GB-scotland');

    expect(merged['buttons.play']).toBe('GB');
  });

  it('does not use a sibling locale tag when only the parent matches (es-AR vs es-MX)', () => {
    registerI18n('es-MX', { 'buttons.play': 'MX' });
    registerI18n('es', { 'buttons.play': 'ES' });
    const merged = getI18nTranslations('es-AR');

    expect(merged['buttons.play']).toBe('ES');
  });

  it('reports hasRegisteredLocale with normalized tags', () => {
    expect(hasRegisteredLocale('en')).toBe(false);
    expect(hasRegisteredLocale('fr')).toBe(false);
    registerI18n('fr', { 'buttons.play': 'Lire' });
    expect(hasRegisteredLocale('FR')).toBe(true);
  });

  it('onI18nRegistryChange unsubscribe stops notifications', () => {
    const spy = vi.fn();
    const off = onI18nRegistryChange(spy);

    registerI18n('de', { 'buttons.play': 'Los' });
    expect(spy).toHaveBeenCalledOnce();
    off();
    registerI18n('de', { 'buttons.pause': 'Pause' });
    expect(spy).toHaveBeenCalledOnce();
  });
});

/**
 * A page can end up with more than one copy of this module — separately loaded CDN bundles, a pinned and an unpinned
 * URL for the same file, or two bundlers' output. Registry state is realm-global so those copies still agree; these
 * tests stand in for that duplication by loading the module twice through a reset module cache.
 */
describe('i18n registry shared across module instances', () => {
  async function loadTwoInstances() {
    vi.resetModules();
    const first = await import('../registry');

    vi.resetModules();
    const second = await import('../registry');

    // Guards the premise: same state through genuinely different module objects.
    expect(first).not.toBe(second);

    return { first, second };
  }

  beforeEach(() => {
    resetI18nRegistry();
  });

  it('reads translations registered through another instance', async () => {
    const { first, second } = await loadTwoInstances();

    first.registerI18n('es', { buttons: { play: 'Reproducir' } });

    expect(second.getI18nTranslations('es')['buttons.play']).toBe('Reproducir');
    expect(second.hasRegisteredLocale('es')).toBe(true);
  });

  it('merges layers for one locale across instances', async () => {
    const { first, second } = await loadTwoInstances();

    first.registerI18n('es', { buttons: { play: 'Reproducir' } });
    second.registerI18n('es', { buttons: { pause: 'Pausa' } });

    const es = first.getI18nTranslations('es');

    expect(es['buttons.play']).toBe('Reproducir');
    expect(es['buttons.pause']).toBe('Pausa');
  });

  it('notifies subscribers of another instance', async () => {
    const { first, second } = await loadTwoInstances();
    const spy = vi.fn();

    const off = first.onI18nRegistryChange(spy);

    second.registerI18n('fr', { buttons: { play: 'Lire' } });
    expect(spy).toHaveBeenCalledOnce();

    off();
    second.registerI18n('fr', { buttons: { pause: 'Pause' } });
    expect(spy).toHaveBeenCalledOnce();
  });
});
