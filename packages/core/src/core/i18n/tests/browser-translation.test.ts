import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  getBrowserTranslations,
  resetBrowserTranslationCacheForTesting,
  resolveBrowserTranslationTarget,
  shouldAttemptBrowserTranslation,
} from '../browser-translation';
import en from '../locales/en';
import { registerI18n, resetI18nRegistry } from '../registry';
import { flattenTranslations } from '../utils';

type MockAvailability = 'available' | 'downloadable' | 'unavailable';

function installMockTranslator(
  options: { availability?: MockAvailability; translate?: (text: string) => string | Promise<string> } = {}
) {
  const availability = options.availability ?? 'available';
  const translate = options.translate ?? ((text: string) => `translated:${text}`);

  const Translator = {
    availability: vi.fn(async () => availability),
    create: vi.fn(async (_options: { sourceLanguage: string; targetLanguage: string }) => ({
      translate: vi.fn(async (text: string) => translate(text)),
    })),
  };

  Object.defineProperty(globalThis, 'Translator', {
    configurable: true,
    writable: true,
    value: Translator,
  });

  return Translator;
}

function removeMockTranslator(): void {
  Reflect.deleteProperty(globalThis, 'Translator');
}

describe('resolveBrowserTranslationTarget', () => {
  it('returns the first non-en tag in the lookup chain', () => {
    expect(resolveBrowserTranslationTarget('fr-CA')).toBe('fr-ca');
    expect(resolveBrowserTranslationTarget('en')).toBeUndefined();
    expect(resolveBrowserTranslationTarget('en-US')).toBeUndefined();
    expect(resolveBrowserTranslationTarget('en-GB')).toBeUndefined();
  });
});

describe('shouldAttemptBrowserTranslation', () => {
  afterEach(() => {
    resetI18nRegistry();
  });

  it('skips English', () => {
    expect(shouldAttemptBrowserTranslation('en', [])).toBe(false);
    expect(shouldAttemptBrowserTranslation('en-US', [])).toBe(false);
  });

  it('skips when a non-English lazy built-in tag loaded', () => {
    expect(shouldAttemptBrowserTranslation('xx', ['xx'])).toBe(false);
    expect(shouldAttemptBrowserTranslation('es', ['en', 'es'])).toBe(false);
  });

  it('attempts when a loaded built-in pack is missing English keys', () => {
    expect(shouldAttemptBrowserTranslation('es', ['es'], { 'buttons.play': 'Ir' })).toBe(true);
  });

  it('skips when a loaded built-in pack covers English keys', () => {
    expect(shouldAttemptBrowserTranslation('es', ['es'], { ...flattenTranslations(en), 'buttons.play': 'Ir' })).toBe(
      false
    );
  });

  it('attempts when only English lazy tags loaded', () => {
    expect(shouldAttemptBrowserTranslation('xx', ['en'])).toBe(true);
  });

  it('skips when a non-en tag in the chain is registered', () => {
    registerI18n('es', { 'buttons.play': 'Ir' });
    expect(shouldAttemptBrowserTranslation('es-MX', [])).toBe(false);
  });

  it('attempts when locale has no pack', () => {
    expect(shouldAttemptBrowserTranslation('xx', [])).toBe(true);
  });
});

describe('getBrowserTranslations', () => {
  afterEach(() => {
    resetI18nRegistry();
    resetBrowserTranslationCacheForTesting();
    removeMockTranslator();
  });

  it('returns empty when Translator API is missing', async () => {
    removeMockTranslator();
    await expect(getBrowserTranslations('fr')).resolves.toEqual({});
  });

  it('returns empty when availability is not available', async () => {
    const translator = installMockTranslator({ availability: 'downloadable' });

    await expect(getBrowserTranslations('fr')).resolves.toEqual({});
    expect(translator.create).not.toHaveBeenCalled();
  });

  it('translates en values and maps them back to keys', async () => {
    installMockTranslator({
      translate: (text) => (text === 'Play' ? 'Jouer' : `translated:${text}`),
    });

    const result = await getBrowserTranslations('fr');

    expect(result['buttons.play']).toBe('Jouer');
    expect(result['buttons.pause']).toBe('translated:Pause');
  });

  it('masks named placeholders as numeric slots for whole-string translation', async () => {
    const translatedInputs: string[] = [];

    installMockTranslator({
      translate: (text) => {
        translatedInputs.push(text);

        if (text === 'Seek backward {0} seconds') {
          return 'Mencari mundur {0} detik';
        }

        if (text === 'Seek forward {0} seconds') {
          return 'Mencari maju {0} detik';
        }

        return text;
      },
    });

    const result = await getBrowserTranslations('fr');

    expect(translatedInputs).toContain('Seek backward {0} seconds');
    expect(translatedInputs.some((text) => text.includes('{seconds}'))).toBe(false);
    expect(result['seek.backward']).toBe('Mencari mundur {seconds} detik');
    expect(result['seek.forward']).toBe('Mencari maju {seconds} detik');
  });

  it('restores slots when the translator adds spaces inside braces', async () => {
    installMockTranslator({
      translate: (text) => (text === 'Playback rate {0}' ? 'Kecepatan pemutaran { 0 }' : text),
    });

    const result = await getBrowserTranslations('fr');

    expect(result['playback.rate']).toBe('Kecepatan pemutaran {rate}');
  });

  it('caches results per target language', async () => {
    const translator = installMockTranslator();

    translator.create.mockImplementation(async ({ targetLanguage }: { targetLanguage: string }) => ({
      translate: vi.fn(async (text: string) => `${targetLanguage}:${text}`),
    }));

    const french = await getBrowserTranslations('fr');
    const german = await getBrowserTranslations('de');
    const frenchAgain = await getBrowserTranslations('fr');

    expect(french['buttons.play']).toBe('fr:Play');
    expect(german['buttons.play']).toBe('de:Play');
    expect(frenchAgain['buttons.play']).toBe('fr:Play');
    expect(translator.create).toHaveBeenCalledTimes(2);
    expect(translator.create).toHaveBeenNthCalledWith(1, { sourceLanguage: 'en', targetLanguage: 'fr' });
    expect(translator.create).toHaveBeenNthCalledWith(2, { sourceLanguage: 'en', targetLanguage: 'de' });
  });

  it('downloads and translates when downloadIfNeeded is true', async () => {
    const onStart = vi.fn();
    const onFinish = vi.fn();
    const translator = installMockTranslator({
      availability: 'downloadable',
      translate: (text) => (text === 'Play' ? 'Main' : text),
    });

    const result = await getBrowserTranslations('id', {
      downloadIfNeeded: true,
      onModelDownload: { start: onStart, finish: onFinish },
    });

    expect(translator.create).toHaveBeenCalledTimes(1);
    expect(result['buttons.play']).toBe('Main');
    expect(onStart).toHaveBeenCalledWith('id');
    expect(onFinish).toHaveBeenCalledWith('id');
  });

  it('does not invoke download callbacks when the model is already available', async () => {
    const onStart = vi.fn();
    const onFinish = vi.fn();

    installMockTranslator();

    await getBrowserTranslations('fr', {
      downloadIfNeeded: true,
      onModelDownload: { start: onStart, finish: onFinish },
    });

    expect(onStart).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
