import { defineMdastPlugin } from 'satteri';

import { VJS10_CDN_ARCHIVE_VERSION, VJS10_CDN_BASE, VJS10_UTILS_CDN_BASE } from '../consts';

const VJS10_CDN_PLACEHOLDER = '{{VJS10_CDN_BASE}}';
const VJS10_UTILS_CDN_PLACEHOLDER = '{{VJS10_UTILS_CDN_BASE}}';
const VJS10_CDN_ARCHIVE_VERSION_PLACEHOLDER = '{{VJS10_CDN_ARCHIVE_VERSION}}';

const replacements = new Map([
  [VJS10_CDN_PLACEHOLDER, VJS10_CDN_BASE],
  [VJS10_UTILS_CDN_PLACEHOLDER, VJS10_UTILS_CDN_BASE],
  [VJS10_CDN_ARCHIVE_VERSION_PLACEHOLDER, VJS10_CDN_ARCHIVE_VERSION],
]);

function replaceVersionPlaceholders(value: string): string {
  let result = value;

  for (const [placeholder, replacement] of replacements) {
    result = result.replaceAll(placeholder, replacement);
  }

  return result;
}

/** Replace Video.js placeholders in documentation code with package-derived versions. */
export function satteriCdnVersion() {
  return defineMdastPlugin({
    name: 'videojs-cdn-version',
    code: (node, ctx) => {
      const value = replaceVersionPlaceholders(node.value);
      if (value === node.value) return;

      ctx.replaceNode(node, {
        ...node,
        value,
      });
    },
    inlineCode: (node, ctx) => {
      const value = replaceVersionPlaceholders(node.value);
      if (value === node.value) return;

      ctx.replaceNode(node, {
        ...node,
        value,
      });
    },
  });
}
