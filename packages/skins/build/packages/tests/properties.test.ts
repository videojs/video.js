import { describe, expect, it } from 'vite-plus/test';

import { propertyStyles } from '../properties.ts';

describe('propertyStyles', () => {
  it('extracts registrations without copying component styles', () => {
    const css = propertyStyles(`
      @layer theme { @media (hover: hover) { .player { color: red; } } }
      @property --progress { syntax: '<percentage>'; inherits: true; initial-value: 0%; }
      @property --other { syntax: '<number>'; inherits: false; initial-value: 1; }
    `);

    expect(css).toContain('@property --progress');
    expect(css).toContain('@property --other');
    expect(css).not.toContain('.player');
    expect(css).not.toContain('@layer');
  });

  it('preserves conditions around registrations', () => {
    const css = propertyStyles(`
      @media (prefers-reduced-motion: no-preference) {
        @property --progress { syntax: '<percentage>'; inherits: true; initial-value: 0%; }
        .player { color: red; }
      }
    `);

    expect(css).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(css).toContain('@property --progress');
    expect(css).not.toContain('.player');
  });
});
