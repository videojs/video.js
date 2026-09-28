// @vitest-environment node
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vite-plus/test';

import { CSS_REQUIREMENTS, SUPPORT_BROWSERS } from '@/utils/browser-support';

import BrowserSupportTable from '../BrowserSupportTable.astro';

async function render(kind: 'browsers' | 'coverage' | 'requirements'): Promise<string> {
  const container = await AstroContainer.create();

  return container.renderToString(BrowserSupportTable, { props: { kind } });
}

describe('BrowserSupportTable', () => {
  it('renders the supported browsers with a caption and header semantics', async () => {
    const html = await render('browsers');

    expect(html).toContain('<caption class="sr-only">');
    expect(html.match(/<th[^>]*scope="col"/g)).toHaveLength(2);
    expect(html.match(/<th[^>]*scope="row"/g)).toHaveLength(SUPPORT_BROWSERS.length);

    for (const browser of SUPPORT_BROWSERS) expect(html).toContain(browser.name);

    expect(html).toMatch(/\d+ and \d+/);
  });

  it('renders the coverage paragraph with percentages and the data version', async () => {
    const html = await render('coverage');

    expect(html.match(/\d+\.\d%/g)).toHaveLength(1);
    expect(html).toMatch(/Chrome \d+, Edge \d+, Firefox \d+, Safari [\d.]+, and Safari on iOS [\d.]+ and later/);
    expect(html).toContain('https://github.com/browserslist/caniuse-lite');
    expect(html).toMatch(/caniuse-lite<\/a> 1\.0\.\d+/);
  });

  it('renders one row per requirement, a footer floor row, and same-tab caniuse links', async () => {
    const html = await render('requirements');

    expect(html).toContain('<caption class="sr-only">');
    expect(html.match(/<th[^>]*scope="col"/g)).toHaveLength(5);
    expect(html).toContain('Chrome and Edge');
    expect(html).toContain('Safari and iOS');
    expect(html.match(/<th[^>]*scope="row"/g)).toHaveLength(CSS_REQUIREMENTS.length + 1);
    expect(html).toContain('<tfoot');
    expect(html).toContain('Effective floor');
    expect(html).not.toContain('target="_blank"');

    for (const requirement of CSS_REQUIREMENTS) {
      expect(html).toContain(`https://caniuse.com/${requirement.id}`);
    }
  });
});
