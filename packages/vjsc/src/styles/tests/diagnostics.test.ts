import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { loadDesignSystem } from '../design-system';
import { diagnoseCompiledCandidate, diagnoseStyles, formatStyleDiagnostic } from '../diagnostics';
import type { ResolvedStyles, ResolvedStyleRule } from '../resolved';

const designPath = resolve(import.meta.dirname, 'fixtures/diagnostics.css');

describe('style diagnostics', () => {
  it('rejects peers, implicit ancestors, and unowned groups with actionable messages', () => {
    const diagnostics = diagnoseStyles(
      resolvedStyles([
        rule('peer', ['peer/dialog', 'peer-data-open/dialog:hidden']),
        rule('ancestor', ['in-data-open:hidden']),
        rule('group', ['group-data-open/menu:block']),
      ])
    );

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'VJSC_STYLE_PEER_RELATIONSHIP',
      'VJSC_STYLE_IMPLICIT_ANCESTOR',
      'VJSC_STYLE_UNOWNED_GROUP',
    ]);
    expect(formatStyleDiagnostic(diagnostics[0]!)).toBe(
      '[VJSC_STYLE_PEER_RELATIONSHIP] Style rule `peer` in `test.styles.ts` uses peer relationship utilities: `peer/dialog`, `peer-data-open/dialog:hidden`.\n' +
        'Reason: Peer relationships depend on sibling ownership that an isolated module cannot discover safely.\n' +
        'Recommendation: Expose an explicit component part or backdrop, or put the relevant state on the styled component.'
    );
  });

  it('allows named groups whose owners and consumers are local', () => {
    const diagnostics = diagnoseStyles(
      resolvedStyles([rule('owner', ['group/menu']), rule('consumer', ['group-data-open/menu:block'])])
    );

    expect(diagnostics).toEqual([]);
  });

  it('ignores delimiters inside arbitrary group variant values', () => {
    const diagnostics = diagnoseStyles(
      resolvedStyles([
        rule('unnamed-owner', ['group']),
        rule('unnamed-consumer', ['group-data-[url=https://example.com/video]:block']),
        rule('named-owner', ['group/menu']),
        rule('named-consumer', ['group-data-[url=https://example.com/video]/menu:block']),
      ])
    );

    expect(diagnostics).toEqual([]);
  });

  it('warns for structural selectors but not self state selectors', () => {
    const diagnostics = diagnoseStyles(
      resolvedStyles([
        rule('safe', ['data-open:block', '[&:fullscreen]:block', 'before:block']),
        rule('complex', [
          'has-[img]:hidden',
          '[&_img]:block',
          '[&>*]:flex-1',
          '[&:fullscreen_video]:block',
          '[.external_&]:block',
          '[&+*]:block',
          '*:block',
          '**:hidden',
        ]),
      ])
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: 'VJSC_STYLE_COMPLEX_SELECTOR',
      kind: 'complex-selector',
      utilities: [
        'has-[img]:hidden',
        '[&_img]:block',
        '[&>*]:flex-1',
        '[&:fullscreen_video]:block',
        '[.external_&]:block',
        '[&+*]:block',
        '*:block',
        '**:hidden',
      ],
    });
    expect(formatStyleDiagnostic(diagnostics[0]!)).toContain('\nReason: ');
    expect(formatStyleDiagnostic(diagnostics[0]!)).toContain('\nRecommendation: ');
  });

  it('warns for :has() even when its named group owner is local', () => {
    const diagnostics = diagnoseStyles(
      resolvedStyles([rule('owner', ['group/thumbnail']), rule('spinner', ['group-has-[img]/thumbnail:block'])])
    );

    expect(diagnostics).toMatchObject([{ code: 'VJSC_STYLE_COMPLEX_SELECTOR', kind: 'complex-selector' }]);
  });

  it('detects structural selectors concealed by a custom Tailwind utility', async () => {
    const design = await loadDesignSystem(designPath);
    const styleRule = rule('custom', ['child-target']);
    const css = design.candidateCss('child-target');

    expect(css).toBeDefined();
    expect(diagnoseCompiledCandidate(styleRule, 'child-target', css!, new Set())).toMatchObject([
      { code: 'VJSC_STYLE_COMPLEX_SELECTOR', utilities: ['child-target'] },
    ]);
  });

  it('rejects compiled selectors that escape the candidate scope', () => {
    const diagnostics = diagnoseCompiledCandidate(
      rule('escape', ['escape']),
      'escape',
      '.escape { display: block; } .external { display: none; }',
      new Set()
    );

    expect(diagnostics).toMatchObject([{ code: 'VJSC_STYLE_SCOPE_ESCAPE', kind: 'error' }]);
  });

  it('accepts variants Tailwind flattens onto the candidate instead of nesting under it', () => {
    expect(
      diagnoseCompiledCandidate(rule('flat', ['flat']), 'flat', '.flat[data-open] { display: block; }', new Set())
    ).toEqual([]);
  });
});

function rule(token: string, utilities: readonly string[]): ResolvedStyleRule {
  return {
    modulePath: 'test.styles.ts',
    tokenPath: token.split('.'),
    className: `media-${token}`,
    file: 'test.css',
    layer: 'videojs.components',
    scopeRoot: false,
    shadowHost: false,
    utilityGroups: utilities,
    utilities,
    variantGroups: {},
    variants: {},
  };
}

function resolvedStyles(rules: readonly ResolvedStyleRule[]): ResolvedStyles {
  return { modules: new Map(), rules, watchFiles: [] };
}
