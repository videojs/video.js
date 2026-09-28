import { describe, expect, it } from 'vite-plus/test';

import { flattenScopes } from '../scope';

function flatten(css: string): string {
  return flattenScopes(css).replace(/\s+/g, ' ').trim();
}

describe('flattenScopes', () => {
  it('prefixes scoped descendants with the root at zero specificity', () => {
    expect(flatten('@scope (.root) { .a { color: red; } }')).toBe(':where(.root) .a { color: red; }');
  });

  it('matches the root itself for `:scope` and a scope-level `&`', () => {
    expect(flatten('@scope (.root) { :scope.a { color: red; } &[data-b] .c { opacity: 0; } }')).toBe(
      ':where(.root).a { color: red; } :where(.root)[data-b] .c { opacity: 0; }'
    );
  });

  it('resolves a nested scope inside its outer root', () => {
    expect(flatten('@scope (.root) { @scope (.owner, :scope.owner) { &[data-x] .a { color: red; } } }')).toBe(
      ':where(:where(.root) .owner, :where(.root).owner)[data-x] .a { color: red; }'
    );
  });

  it('keeps conditions and leaves rules nested in a style rule relative to it', () => {
    expect(flatten('@layer l { @scope (.root) { @media (width > 1px) { .a { & .b { color: red; } } } } }')).toBe(
      '@layer l { @media (width > 1px) { :where(.root) .a { & .b { color: red; } } } }'
    );
  });

  it('rejects scope limits, which have no selector equivalent', () => {
    expect(() => flattenScopes('@scope (.root) to (.limit) { .a { color: red; } }')).toThrow('limits');
  });
});
