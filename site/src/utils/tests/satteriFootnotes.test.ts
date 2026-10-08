// @vitest-environment node
// Sätteri's native binding builds typed-array buffers that fail against jsdom's
// patched ArrayBuffer/DataView globals; run these against the real node realm.
import { markdownToHtml, mdxToJs } from 'satteri';
import { describe, expect, it } from 'vite-plus/test';

import { satteriFootnotes } from '../satteriFootnotes';

const SOURCE = 'Claim[^a] and again[^a].\n\n[^a]: A *note*.\n';

function compile(source: string): string {
  return mdxToJs(source, { hastPlugins: [satteriFootnotes()], data: {} }).code;
}

describe('satteriFootnotes', () => {
  it('renders each reference as FootnoteRef with its link target and id', () => {
    const code = compile(SOURCE);

    expect(code).toMatch(/_jsx\(FootnoteRef, \{\s*href: "#user-content-fn-a",\s*id: "user-content-fnref-a",/);
    expect(code).toMatch(/id: "user-content-fnref-a-2"/);
    expect(code).not.toMatch(/_components\.sup, \{\s*children: _jsx\(FootnoteRef/);
  });

  it('renders the definitions inside Footnotes without the generated heading', () => {
    const code = compile(SOURCE);

    expect(code).toMatch(/_jsxs?\(Footnotes,/);
    expect(code).toContain('id: "user-content-fn-a"');
    expect(code).not.toContain('_components.section');
    expect(code).not.toContain('footnote-label');
  });

  it('renders backrefs as FootnoteBackref with their accessible labels', () => {
    const code = compile(SOURCE);

    expect(code).toMatch(/FootnoteBackref, \{\s*href: "#user-content-fnref-a",\s*label: "Back to reference 1",/);
    expect(code).toMatch(/label: "Back to reference 1-2"/);
  });

  it('leaves plain Markdown footnotes untouched', () => {
    const { html } = markdownToHtml(SOURCE, { hastPlugins: [satteriFootnotes()] });

    expect(html).toContain('<section data-footnotes');
    expect(html).toContain('data-footnote-ref');
  });
});
