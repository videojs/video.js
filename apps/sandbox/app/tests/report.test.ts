import version from '@app/version';
import { describe, expect, it } from 'vite-plus/test';

import { buildReport, describeError, PREFERENCE_QUERIES, type Preferences } from '../shell/report';

const preferences = Object.fromEntries(PREFERENCE_QUERIES.map(([name]) => [name, name === 'hover'])) as Preferences;

const input = {
  url: 'http://localhost:5173/?platform=react&media=video',
  build: { branch: 'feat/sandbox-playground', commit: 'abc1234' },
  summary: 'React · Video · Default · CSS · from the package · 896px · MP4 - Dancing Dude',
  panels: [],
  userAgent: 'Probe/1.0',
  viewport: { width: 1280, height: 720, scale: 2 },
  preferences,
  errors: [],
};

describe('buildReport', () => {
  it('lists the selection, environment, and preferences with no errors', () => {
    expect(buildReport(input)).toBe(
      [
        '## Video.js sandbox preview',
        '- URL: http://localhost:5173/?platform=react&media=video',
        `- Version: ${version}`,
        '- Build: feat/sandbox-playground @ abc1234',
        '- Selection: React · Video · Default · CSS · from the package · 896px · MP4 - Dancing Dude',
        '- Browser: Probe/1.0',
        '- Viewport: 1280x720 @ 2x',
        '- Preferences: reduced motion off, reduced transparency off, more contrast off, forced colors off, hover on, coarse pointer off, dark scheme off',
        '- Errors: none',
      ].join('\n')
    );
  });

  it('adds the panels while comparing and the errors the frames relayed', () => {
    const report = buildReport({
      ...input,
      panels: [
        { label: 'CSS', url: '/react-video/?styling=css' },
        { label: 'Tailwind', url: '/react-video/?styling=tailwind' },
      ],
      errors: [{ panel: 'css', time: '12:00:00', message: 'TypeError: boom' }],
    });

    expect(report).toContain(
      '- Panels:\n  - CSS: /react-video/?styling=css\n  - Tailwind: /react-video/?styling=tailwind'
    );
    expect(report).toContain('- Errors:\n  - 12:00:00 css: TypeError: boom');
  });
});

describe('describeError', () => {
  it('names errors and passes strings through', () => {
    expect(describeError(new RangeError('out of range'))).toBe('RangeError: out of range');
    expect(describeError('plain')).toBe('plain');
    expect(describeError(42)).toBe('42');
  });
});
