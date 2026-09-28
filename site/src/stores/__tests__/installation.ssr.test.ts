// @vitest-environment node

import { describe, expect, it } from 'vite-plus/test';

import { syncInstallationSelectionFromUrl } from '../installation';

describe('installation stores during server rendering', () => {
  it('does not require a browser location', () => {
    expect(() => syncInstallationSelectionFromUrl()).not.toThrow();
  });
});
