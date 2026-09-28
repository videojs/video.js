import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const workspaceDir = resolve(import.meta.dirname, '../../../../..');
const outputRoot = resolve(workspaceDir, 'packages/html/src/internal/skins');
const skins = [
  'default-video',
  'minimal-video',
  'default-audio',
  'minimal-audio',
  'default-live-video',
  'minimal-live-video',
  'default-live-audio',
  'minimal-live-audio',
] as const;

describe('generated HTML package skins', () => {
  it.each(skins)('%s has a complete template, exact registration, and stylesheet', (skin) => {
    const root = resolve(outputRoot, skin);
    const template = readFileSync(resolve(root, 'template.ts'), 'utf8');
    const registration = readFileSync(resolve(root, 'register.ts'), 'utf8');
    const stylesheet = readFileSync(resolve(root, 'skin.css'), 'utf8');
    const tags = uniqueMatches(template, /<media-([a-z0-9-]+)\b/g).filter((tag) => tag !== 'icon' && tag !== 'text');
    const registeredTags = uniqueMatches(registration, /^import '\.\.\/\.\.\/\.\.\/define\/ui\/([a-z0-9-]+)';$/gm);
    const iconNames = uniqueMatches(template, /<media-icon\b[^>]*\bname="([^"]+)"/g).sort();
    const registeredIcons = uniqueMatches(
      registration,
      /^  (?:'([^']+)'|([A-Za-z_$][\w$]*)): [A-Za-z_$][\w$]*,$/gm
    ).sort();

    expect(template).toContain('createTemplate');
    expect(template).toContain('<media-container');
    expect(template).not.toMatch(/(?:virtual:vjsc|vjsc\/components|vjsc\/target)/);
    expect(registeredTags).toEqual(tags);
    expect(registeredIcons).toEqual(iconNames);
    expect(stylesheet.length).toBeGreaterThan(10_000);

    if (skin.endsWith('video')) {
      expect(template).toMatch(/<media-title class="media-title">\s*<\/media-title>/);
      expect(template).not.toContain('media-metadata');
      expect(tags).toContain('title');
      expect(stylesheet).toContain('.media-title:not([data-visible])');
    } else {
      expect(tags).not.toContain('title');
    }

    for (const tag of registeredTags) {
      expect(existsSync(resolve(workspaceDir, `packages/html/src/define/ui/${tag}.ts`))).toBe(true);
    }
  });

  it('keeps every generated package artifact out of git', () => {
    const paths = skins.flatMap((skin) =>
      ['template.ts', 'register.ts', 'skin.css'].map((file) => `packages/html/src/internal/skins/${skin}/${file}`)
    );
    const ignored = execFileSync('git', ['check-ignore', ...paths], {
      cwd: workspaceDir,
      encoding: 'utf8',
    })
      .trim()
      .split('\n');

    expect(ignored).toEqual(paths);
  });
});

function uniqueMatches(source: string, pattern: RegExp): string[] {
  return [...new Set([...source.matchAll(pattern)].map((match) => match[1] ?? match[2]!))];
}
