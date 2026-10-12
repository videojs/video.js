import { describe, expect, it } from 'vite-plus/test';

import { resolveHtmlRuntime } from '../../html-runtime/resolve';
import { htmlRuntimePlugin } from '../html-runtime';

describe('htmlRuntimePlugin', () => {
  it('serves the HTML runtime entries and leaves other ids to later resolvers', () => {
    const plugin = htmlRuntimePlugin();
    const hook = plugin.resolveId as { readonly order: string; handler(id: string): string | null };

    expect(hook.order).toBe('pre');
    expect(hook.handler('vjsc/html-runtime/jsx-runtime')).toBe(resolveHtmlRuntime('vjsc/html-runtime/jsx-runtime'));
    expect(hook.handler('vjsc/html-runtime/jsx-runtime')).toMatch(/jsx-runtime\.ts$/);
    expect(hook.handler('react/jsx-runtime')).toBeNull();
  });
});
