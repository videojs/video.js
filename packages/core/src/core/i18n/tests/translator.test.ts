import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createTranslator } from '../translator';

describe('createTranslator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves a simple key', () => {
    const t = createTranslator({ 'buttons.play': 'Start' }, 'en');

    expect(t('buttons.play')).toBe('Start');
  });

  it.each([
    { seconds: 10, expected: 'Jump 10 s' },
    { seconds: 1.25, expected: 'Jump 1.25 s' },
  ])('interpolates {param} placeholders for $seconds', ({ seconds, expected }) => {
    const t = createTranslator({ 'seek.forward': 'Jump {seconds} s' }, 'en');

    expect(t('seek.forward', { seconds })).toBe(expected);
  });

  it('accepts a Text descriptor and uses its English text as the fallback', () => {
    const t = createTranslator({}, 'en');

    expect(t({ key: 'buttons.play', text: 'Play' })).toBe('Play');
  });

  it('translates a Text descriptor and interpolates its parameters', () => {
    const t = createTranslator({ 'seek.forward': 'Avance {seconds} segundos' }, 'es');

    expect(t({ key: 'seek.forward', text: 'Seek forward {seconds} seconds' }, { seconds: 10 })).toBe(
      'Avance 10 segundos'
    );
  });

  it('falls back to the source phrase when no translation is defined', () => {
    const t = createTranslator({}, 'en');

    expect(t('buttons.play')).toBe('buttons.play');
  });

  it('uses an inline default for a semantic key', () => {
    const t = createTranslator({}, 'en');

    expect(t('buttons.play', { default: 'Play' })).toBe('Play');
  });

  it('warns when a translation has no fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = createTranslator({}, 'en');

    expect(t('custom.missing')).toBe('custom.missing');
    expect(warn).toHaveBeenCalledWith('[videojs] Missing translation for "custom.missing".');
  });

  it('does not warn when a custom key has an inline default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = createTranslator({}, 'en');

    expect(t('custom.label', { default: 'Label' })).toBe('Label');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not interpolate the inline default option', () => {
    const t = createTranslator({ 'custom.label': '{default}' }, 'en');

    expect(t('custom.label', { default: 'Fallback' })).toBe('{default}');
  });

  it('interpolates the source phrase fallback', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = createTranslator({}, 'en');

    expect(t('Custom {value}', { value: 10 })).toBe('Custom 10');
  });

  it('keeps tokens that are not supplied as params', () => {
    const t = createTranslator({ 'buttons.play': 'Hi {name}' }, 'en');

    expect(t('buttons.play')).toBe('Hi {name}');
  });
});
