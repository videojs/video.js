import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { resolveHtmlRuntime } from '../resolve';

describe('resolveHtmlRuntime', () => {
  it('resolves both runtime entries to the sibling source modules', () => {
    const directory = resolve(import.meta.dirname, '..');

    expect(resolveHtmlRuntime('vjsc/html-runtime/jsx-runtime')).toBe(resolve(directory, 'jsx-runtime.ts'));
    expect(resolveHtmlRuntime('vjsc/html-runtime/jsx-dev-runtime')).toBe(resolve(directory, 'jsx-dev-runtime.ts'));
  });

  it('leaves every other specifier to the host resolver', () => {
    expect(resolveHtmlRuntime('vjsc/html-runtime')).toBeNull();
    expect(resolveHtmlRuntime('vjsc/components/jsx-runtime')).toBeNull();
  });
});
