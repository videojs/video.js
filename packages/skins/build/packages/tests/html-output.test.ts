import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const workspaceDir = resolve(import.meta.dirname, '../../../../..');
const outputRoot = resolve(workspaceDir, 'packages/html/src/internal/skins');
const skins = [
  'compat-video',
  'compat-audio',
  'compat-live-video',
  'compat-live-audio',
  'scaffold-video',
  'scaffold-audio',
  'scaffold-live-video',
  'scaffold-live-audio',
  'default-video',
  'neutral-video',
  'default-audio',
  'neutral-audio',
  'default-live-video',
  'neutral-live-video',
  'default-live-audio',
  'neutral-live-audio',
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
    expect(stylesheet).toContain('.media-container');

    if (skin.endsWith('video')) {
      expect(template).not.toContain('media-metadata');
      expect(template).toMatch(/<media-title class="media-title">\s*<\/media-title>/);
      expect(tags).toContain('title');
      expect(stylesheet).toContain('.media-title:not([data-visible])');
    } else {
      expect(tags).not.toContain('title');
    }

    if (skin.startsWith('compat-') || skin.startsWith('scaffold-')) {
      const family = skin.split('-')[0];

      expect(template).toContain(`family="${family}"`);
      expect(registration).toContain(`from '../../../icons/${family}';`);
      expect(tags).toEqual(
        expect.arrayContaining(['play-button', 'mute-button', 'volume-popover', 'volume-slider', 'captions-button'])
      );

      if (!skin.endsWith('live-audio')) expect(tags).toContain('menu');
    }

    if (['compat-video', 'compat-audio', 'scaffold-video', 'scaffold-audio'].includes(skin)) {
      expect(tags).toContain('time-slider');
      expect(tags).toContain('time-slider-chapters');
    }

    if (['compat-live-video', 'compat-live-audio', 'scaffold-live-video', 'scaffold-live-audio'].includes(skin)) {
      expect(tags).not.toContain('time-slider');
      expect(tags).not.toContain('time');
      expect(tags).not.toContain('quality-radio-group');
      expect(tags).not.toContain('audio-track-radio-group');
      expect(tags).not.toContain('playback-rate-radio-group');
    }

    if (skin.startsWith('scaffold-')) {
      expect(tags).toContain('buffering-indicator');

      if (skin.endsWith('video')) {
        expect(template).toContain('<media-status-indicator actions="togglePaused"');
      }
    }

    if (skin === 'compat-live-video' || skin === 'scaffold-live-video') {
      expect(tags).toContain('captions-radio-group');
      expect(template.match(/<media-captions-button\b/g)).toHaveLength(1);
      expect(template).not.toContain('media-settings-button');
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
