import { describe, expect, it } from 'vite-plus/test';

import {
  BROWSERSLIST_QUERY,
  CSS_REQUIREMENTS,
  cssRequirementSupport,
  featureSupport,
  resolveSupportedBrowsers,
  SUPPORT_BROWSERS,
  supportedCoverage,
  versionNumber,
} from '../browser-support';

describe('versionNumber', () => {
  it('reads the first version of a caniuse range', () => {
    expect(versionNumber('150')).toBe(150);
    expect(versionNumber('17.4')).toBe(17.4);
    expect(versionNumber('15.0-15.1')).toBe(15);
  });
});

describe('resolveSupportedBrowsers', () => {
  it('returns one row per policy browser with a version range', () => {
    const rows = resolveSupportedBrowsers(['last 2 chrome versions', 'last 1 safari version']);
    const chrome = rows.find((row) => row.id === 'chrome')!;
    const safari = rows.find((row) => row.id === 'safari')!;

    expect(rows.map((row) => row.id)).toEqual(SUPPORT_BROWSERS.map((browser) => browser.id));
    expect(chrome.versions).toHaveLength(2);
    expect(versionNumber(chrome.versions[1]!)).toBeGreaterThan(versionNumber(chrome.versions[0]!));
    expect(chrome.range).toBe(`${chrome.versions[0]}–${chrome.versions[1]}`);
    expect(chrome.minimum).toBe(chrome.versions[0]);
    expect(safari.versions).toHaveLength(1);
    expect(safari.range).toBe(safari.versions[0]);
    expect(rows.find((row) => row.id === 'firefox')).toMatchObject({ versions: [], range: '—', minimum: null });
  });

  it('resolves the repository query to a minimum for every policy browser', () => {
    for (const row of resolveSupportedBrowsers(BROWSERSLIST_QUERY)) {
      expect(row.minimum, row.id).not.toBeNull();
    }
  });
});

describe('featureSupport', () => {
  it('reads @scope support, which only the registry CSS skins need', () => {
    const scope = featureSupport(CSS_REQUIREMENTS.find((requirement) => requirement.id === 'css-cascade-scope')!);

    expect(scope.firstVersion.chrome).toBe('118');
    expect(scope.firstVersion.safari).toBe('17.4');
    expect(versionNumber(scope.firstVersion.firefox!)).toBeGreaterThanOrEqual(146);
    expect(scope.caniuseUrl).toBe('https://caniuse.com/css-cascade-scope');
  });

  it('reads the first fully supporting version per browser from caniuse-lite', () => {
    const has = featureSupport(CSS_REQUIREMENTS.find((requirement) => requirement.id === 'css-has')!);

    expect(has.firstVersion.chrome).toBe('105');
    expect(has.firstVersion.firefox).toBe('121');
    expect(has.firstVersion.safari).toBe('15.4');
    expect(has.globalSupport).toBeGreaterThan(50);
    expect(has.caniuseUrl).toBe('https://caniuse.com/css-has');
  });

  it('rejects unknown feature ids', () => {
    expect(() => featureSupport({ id: 'not-a-feature', label: 'x', kind: 'required', effect: '' })).toThrow(
      /Unknown caniuse feature/
    );
  });
});

describe('cssRequirementSupport', () => {
  it('resolves every listed requirement', () => {
    const support = cssRequirementSupport();

    expect(support).toHaveLength(CSS_REQUIREMENTS.length);

    for (const entry of support) {
      for (const browser of SUPPORT_BROWSERS) {
        expect(entry.firstVersion[browser.id], `${entry.requirement.id} ${browser.id}`).not.toBeUndefined();
      }
    }
  });
});

describe('supportedCoverage', () => {
  it('covers more usage than the repository query minus its oldest browsers', () => {
    const coverage = supportedCoverage();

    expect(coverage).toBeGreaterThan(supportedCoverage(['last 1 chrome version']));
    expect(coverage).toBeLessThanOrEqual(100);
  });
});
