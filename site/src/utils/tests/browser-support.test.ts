import { describe, expect, it } from 'vite-plus/test';

import {
  BROWSERSLIST_QUERY,
  CSS_REQUIREMENTS,
  cssRequirementSupport,
  effectiveCoverage,
  effectiveFloor,
  featureSupport,
  resolveSupportedBrowsers,
  SUPPORT_BROWSERS,
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
    expect(safari.versions).toHaveLength(1);
    expect(safari.range).toBe(safari.versions[0]);
    expect(rows.find((row) => row.id === 'firefox')).toMatchObject({ versions: [], range: '—' });
  });

  it('resolves the repository query to two versions of every policy browser', () => {
    for (const row of resolveSupportedBrowsers(BROWSERSLIST_QUERY)) {
      expect(row.versions, row.id).toHaveLength(2);
    }
  });
});

describe('featureSupport', () => {
  it('reads the first fully supporting version per browser from caniuse-lite', () => {
    const scope = featureSupport(CSS_REQUIREMENTS.find((requirement) => requirement.id === 'css-cascade-scope')!);

    expect(scope.firstVersion.chrome).toBe('118');
    expect(scope.firstVersion.safari).toBe('17.4');
    expect(versionNumber(scope.firstVersion.firefox!)).toBeGreaterThanOrEqual(146);
    expect(scope.globalSupport).toBeGreaterThan(50);
    expect(scope.caniuseUrl).toBe('https://caniuse.com/css-cascade-scope');
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

describe('effectiveFloor', () => {
  it('takes the newest first-supporting version across required features only', () => {
    const support = cssRequirementSupport();
    const floor = effectiveFloor(support);
    const required = support.filter((entry) => entry.requirement.kind === 'required');

    for (const browser of SUPPORT_BROWSERS) {
      const value = floor[browser.id];

      expect(value, browser.id).not.toBeNull();

      for (const entry of required) {
        expect(versionNumber(value!)).toBeGreaterThanOrEqual(versionNumber(entry.firstVersion[browser.id]!));
      }
    }

    expect(versionNumber(floor.safari!)).toBe(17.4);
  });
});

describe('effectiveCoverage', () => {
  it('is no higher than any single required feature and stays a percentage', () => {
    const support = cssRequirementSupport();
    const coverage = effectiveCoverage(support);

    expect(coverage).toBeGreaterThan(0);

    for (const entry of support.filter((item) => item.requirement.kind === 'required')) {
      expect(coverage).toBeLessThanOrEqual(entry.globalSupport + 1e-9);
    }
  });
});
