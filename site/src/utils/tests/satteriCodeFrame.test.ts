// @vitest-environment node
// Sätteri's native binding builds typed-array buffers that fail against jsdom's
// patched ArrayBuffer/DataView globals; run these against the real node realm.
import { mdxToJs } from 'satteri';
import { describe, expect, it } from 'vite-plus/test';

import { satteriCodeFrame } from '../satteriCodeFrame';

function compile(source: string): string {
  const data = {
    astro: {
      frontmatter: {},
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  };
  const { code } = mdxToJs(source, { mdastPlugins: [satteriCodeFrame()], data });

  return code;
}

describe('satteriCodeFrame', () => {
  it('wraps a standalone code block in CodeFrame', () => {
    const code = compile('```ts\nconst a = 1;\n```');

    expect(code).toContain('CodeFrame');
  });

  it('passes the fence title and language as props', () => {
    const code = compile('```ts title="App.ts"\nconst a = 1;\n```');

    const frameProps = code.match(/_jsx\(CodeFrame,\s*\{([\s\S]*?)children:/)?.[1];

    expect(frameProps).toBeDefined();
    expect(frameProps).toMatch(/\btitle: "App\.ts"/);
    expect(frameProps).toMatch(/\blang: "ts"/);
  });

  it('does not wrap a code block already inside a TabsPanel', () => {
    const code = compile('<TabsPanel value="npm">\n\n```bash\nnpm i\n```\n\n</TabsPanel>');

    expect(code).not.toContain('CodeFrame');
    expect(code).toMatch(/_jsx\(TabsPanel,/);
    expect(code).toContain('npm i\\n');
  });
});
