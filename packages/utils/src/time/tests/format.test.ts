import { describe, expect, it } from 'vite-plus/test';

import { formatTime, formatTimeAsPhrase, secondsToIsoDuration } from '../format';

describe('formatTime', () => {
  it('formats seconds only', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(59)).toBe('0:59');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(90, undefined, { locale: 'en' })).toBe('1:30');
    expect(formatTime(125)).toBe('2:05');
    expect(formatTime(599)).toBe('9:59');
    expect(formatTime(600)).toBe('10:00');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(7325)).toBe('2:02:05');
    expect(formatTime(36000)).toBe('10:00:00');
  });

  it('pads minutes when hours are shown', () => {
    expect(formatTime(3605)).toBe('1:00:05');
    expect(formatTime(3660)).toBe('1:01:00');
  });

  it('handles negative values', () => {
    expect(formatTime(-90)).toBe('-1:30');
    expect(formatTime(-3661)).toBe('-1:01:01');
  });

  it('uses guide to determine hour display', () => {
    expect(formatTime(35, 3600)).toBe('0:00:35');
    expect(formatTime(90, 7200)).toBe('0:01:30');
  });

  it('pads minutes when guide minutes >= 10', () => {
    // 10 minute guide (600s) should pad minutes for consistent width
    expect(formatTime(35, 600)).toBe('00:35');
    expect(formatTime(5, 600)).toBe('00:05');
    expect(formatTime(65, 600)).toBe('01:05');
    // 9 minute guide should not pad
    expect(formatTime(35, 540)).toBe('0:35');
  });

  it('handles invalid values', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
    expect(formatTime(-Infinity)).toBe('0:00');
  });

  it('uses locale digits', () => {
    expect(formatTime(90, undefined, { locale: 'fa' })).toBe('۱:۳۰');
    expect(formatTime(35, 600, { locale: 'fa' })).toBe('۰۰:۳۵');
  });
});

describe('formatTimeAsPhrase', () => {
  it('formats positive duration', () => {
    expect(formatTimeAsPhrase(90)).toContain('1');
    expect(formatTimeAsPhrase(90)).toMatch(/minute/i);
    expect(formatTimeAsPhrase(90)).toMatch(/30/);
    expect(formatTimeAsPhrase(300)).toMatch(/5/);
    expect(formatTimeAsPhrase(300)).toMatch(/minute/i);
  });

  it('formats zero duration', () => {
    expect(formatTimeAsPhrase(0)).toBe('0 seconds');
  });

  it('adds remaining suffix for negative seconds', () => {
    expect(formatTimeAsPhrase(-30)).toMatch(/30/);
    expect(formatTimeAsPhrase(-30)).toMatch(/remaining$/i);
  });

  it('uses formatRemaining only for negative durations', () => {
    expect(formatTimeAsPhrase(-30, { formatRemaining: (duration) => `quedan ${duration}` })).toMatch(/^quedan /);
    expect(formatTimeAsPhrase(-30, { formatRemaining: (duration) => `quedan ${duration}` })).toMatch(/30/);
    expect(formatTimeAsPhrase(90, { formatRemaining: () => 'should-not-appear' })).toBe(formatTimeAsPhrase(90));
  });

  it('omits English remaining suffix for non-English locales without formatRemaining', () => {
    const formatted = formatTimeAsPhrase(-30, { locale: 'es' });

    expect(formatted).toMatch(/30/);
    expect(formatted).not.toMatch(/remaining$/i);
  });

  it('localizes duration units and lists', () => {
    const en = formatTimeAsPhrase(125, { locale: 'en' });
    const fr = formatTimeAsPhrase(125, { locale: 'fr' });

    expect(formatTimeAsPhrase(125)).toBe(en);
    expect(en).toBe('2 minutes, 5 seconds');
    expect(fr).toContain('2 minutes');
    expect(fr).toContain('5\u00a0secondes');
  });

  it('supports short and narrow unit styles', () => {
    expect(formatTimeAsPhrase(125, { locale: 'en', style: 'short' })).toBe('2 min, 5 sec');
    expect(formatTimeAsPhrase(125, { locale: 'en', style: 'narrow' })).toBe('2m 5s');
  });

  it('joins units without `Intl.ListFormat`', () => {
    const listFormat = Intl.ListFormat;

    Object.defineProperty(Intl, 'ListFormat', { value: undefined, configurable: true, writable: true });

    try {
      expect(formatTimeAsPhrase(125, { locale: 'en-GB' })).toBe('2 minutes, 5 seconds');
      expect(formatTimeAsPhrase(125, { locale: 'en-GB', style: 'narrow' })).toBe('2m 5s');
    } finally {
      Object.defineProperty(Intl, 'ListFormat', { value: listFormat, configurable: true, writable: true });
    }
  });

  it('handles invalid values', () => {
    expect(formatTimeAsPhrase(NaN)).toBe('');
    expect(formatTimeAsPhrase(Infinity)).toBe('');
  });

  it('throws when Intl formatters reject the locale', () => {
    expect(() => formatTimeAsPhrase(90, { locale: 'not-a-valid-bcp47-tag!!!' })).toThrow(RangeError);
  });
});

describe('secondsToIsoDuration', () => {
  it('formats seconds only', () => {
    expect(secondsToIsoDuration(0)).toBe('PT0S');
    expect(secondsToIsoDuration(30)).toBe('PT30S');
  });

  it('formats minutes and seconds', () => {
    expect(secondsToIsoDuration(60)).toBe('PT1M');
    expect(secondsToIsoDuration(90)).toBe('PT1M30S');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(secondsToIsoDuration(3600)).toBe('PT1H');
    expect(secondsToIsoDuration(3661)).toBe('PT1H1M1S');
    expect(secondsToIsoDuration(7325)).toBe('PT2H2M5S');
  });

  it('handles negative values (uses absolute)', () => {
    expect(secondsToIsoDuration(-90)).toBe('PT1M30S');
  });

  it('handles invalid values', () => {
    expect(secondsToIsoDuration(NaN)).toBe('PT0S');
    expect(secondsToIsoDuration(Infinity)).toBe('PT0S');
  });
});
