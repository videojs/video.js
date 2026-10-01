// @vitest-environment node
// Sätteri's native binding builds typed-array buffers that fail against jsdom's
// patched ArrayBuffer/DataView globals; run these against the real node realm.
import { mdxToJs } from 'satteri';
import { describe, expect, it } from 'vite-plus/test';

import { VJS10_CDN_ARCHIVE_VERSION, VJS10_CDN_BASE, VJS10_UTILS_CDN_BASE } from '@/consts';

import { satteriCdnVersion } from '../satteriCdnVersion';

function compile(source: string): string {
  const data = {
    astro: {
      frontmatter: {},
      headings: [],
      localImagePaths: new Set<string>(),
      remoteImagePaths: new Set<string>(),
    },
  };
  const { code } = mdxToJs(source, { mdastPlugins: [satteriCdnVersion()], data });

  return code;
}

describe('satteriCdnVersion', () => {
  it('uses the current @videojs/cdn version in fenced code', () => {
    const code = compile(`\`\`\`html
<script src="{{VJS10_CDN_BASE}}/video.js"></script>
\`\`\``);

    expect(code).toContain(`${VJS10_CDN_BASE}/video.js`);
    expect(code).not.toContain('{{VJS10_CDN_BASE}}');
  });

  it('uses the current @videojs/cdn version in inline code', () => {
    const code = compile(`Use \`{{VJS10_CDN_BASE}}/video.js\`.`);

    expect(code).toContain(`${VJS10_CDN_BASE}/video.js`);
    expect(code).not.toContain('{{VJS10_CDN_BASE}}');
  });

  it('uses the current @videojs/utils version in fenced code', () => {
    const code = compile(`\`\`\`html
<script type="module">
  import { formatTime } from '{{VJS10_UTILS_CDN_BASE}}/dist/time.js';
</script>
\`\`\``);

    expect(code).toContain(`${VJS10_UTILS_CDN_BASE}/dist/time.js`);
    expect(code).not.toContain('{{VJS10_UTILS_CDN_BASE}}');
  });

  it('replaces archive version placeholders', () => {
    const code = compile(`\`@videojs/cdn@{{VJS10_CDN_ARCHIVE_VERSION}}\`

\`\`\`bash
VIDEOJS_VERSION={{VJS10_CDN_ARCHIVE_VERSION}}
\`\`\``);

    expect(code).toContain(`@videojs/cdn@${VJS10_CDN_ARCHIVE_VERSION}`);
    expect(code).toContain(`VIDEOJS_VERSION=${VJS10_CDN_ARCHIVE_VERSION}`);
    expect(code).not.toContain('{{VJS10_CDN_ARCHIVE_VERSION}}');
  });
});
