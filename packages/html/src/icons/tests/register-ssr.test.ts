// @vitest-environment node

import { describe, expect, it } from 'vite-plus/test';

import { registerIcons } from '..';

describe('registerIcons', () => {
  it('does not throw without browser globals', () => {
    expect(() => registerIcons('test-ssr-icons', { play: '<svg></svg>' })).not.toThrow();
  });
});
