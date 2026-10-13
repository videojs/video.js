import { describe, expect, it } from 'vite-plus/test';

import { LEGACY_ERROR_CODES } from '../codes';
import {
  getLegacyErrorRecord,
  getLegacyErrorRecords,
  LEGACY_ERRORS,
  LEGACY_V8_DOCS_URL,
  LEGACY_V8_INSTALL,
  LEGACY_V8_LINE,
} from '../registry';

describe('LEGACY_ERRORS', () => {
  it('has exactly one entry per code', () => {
    expect(Object.keys(LEGACY_ERRORS).sort()).toEqual([...LEGACY_ERROR_CODES].sort());
  });

  it('gives every code a complete entry', () => {
    for (const code of LEGACY_ERROR_CODES) {
      const entry = LEGACY_ERRORS[code];

      expect(entry.summary.length, code).toBeGreaterThan(0);
      expect(entry.legacy.length, code).toBeGreaterThan(0);
      expect(entry.html.length, code).toBeGreaterThan(0);
      expect(entry.react.length, code).toBeGreaterThan(0);
    }
  });

  it('keeps markup and code inside backticks so the error pages can render the text as inline Markdown', () => {
    for (const code of LEGACY_ERROR_CODES) {
      const { summary, html, react } = LEGACY_ERRORS[code];

      for (const text of [summary, html, react]) {
        expect(text.replaceAll(/`[^`]*`/g, ''), `${code}: ${text}`).not.toMatch(/[<>]/);
      }
    }
  });

  it('never points a consumer back at the v8 factory', () => {
    for (const code of LEGACY_ERROR_CODES) {
      const { html, react } = LEGACY_ERRORS[code];

      expect(html, code).not.toMatch(/videojs\(/);
      expect(react, code).not.toMatch(/videojs\(/);
    }
  });

  it('sends a consumer to the framework packages, not back to `video.js`', () => {
    for (const code of LEGACY_ERROR_CODES) {
      const { html, react } = LEGACY_ERRORS[code];

      expect(html, code).not.toMatch(/'video\.js'/);
      expect(react, code).not.toMatch(/'video\.js'/);
    }
  });
});

describe('LEGACY_V8_LINE', () => {
  it('names the install command and the v8 docs', () => {
    expect(LEGACY_V8_LINE).toContain(LEGACY_V8_INSTALL);
    expect(LEGACY_V8_LINE).toContain(LEGACY_V8_DOCS_URL);
    expect(LEGACY_V8_INSTALL).toBe('npm install video.js@8');
    expect(LEGACY_V8_DOCS_URL).toBe('https://legacy.videojs.org');
  });
});

describe('getLegacyErrorRecord', () => {
  it('resolves the entry with its code, slug, URL, and stay-on-v8 line', () => {
    expect(getLegacyErrorRecord('VJS8_LEGACY_PLUGIN')).toEqual({
      code: 'VJS8_LEGACY_PLUGIN',
      slug: 'vjs8-legacy-plugin',
      url: 'https://videojs.org/docs/reference/api/vjs8-legacy-plugin',
      stayOnV8: LEGACY_V8_LINE,
      ...LEGACY_ERRORS.VJS8_LEGACY_PLUGIN,
    });
  });
});

describe('getLegacyErrorRecords', () => {
  it('enumerates every code in registry order', () => {
    const records = getLegacyErrorRecords();

    expect(records.map((record) => record.code)).toEqual([...LEGACY_ERROR_CODES]);

    for (const record of records) {
      expect(record.stayOnV8, record.code).toBe(LEGACY_V8_LINE);
      expect(record.url, record.code).toBe(`https://videojs.org/docs/reference/api/${record.slug}`);
    }
  });
});
