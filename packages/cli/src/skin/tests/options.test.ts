import { homedir } from 'node:os';

import { describe, expect, it } from 'vite-plus/test';

import {
  detectPackageManager,
  expandHome,
  missingChoices,
  parseFlags,
  reproduceCommand,
  resolveDefaults,
  slugify,
  UsageError,
  validateName,
} from '../options';

describe('parseFlags', () => {
  it('reads the directory and every choice', () => {
    const flags = parseFlags([
      'skins/my-skin',
      '--framework',
      'html',
      '--styling',
      'css',
      '--base',
      'neutral',
      '--preset',
      'live-video',
      '--no-install',
    ]);

    expect(flags).toMatchObject({
      directory: 'skins/my-skin',
      framework: 'html',
      styling: 'css',
      base: 'neutral',
      preset: 'live-video',
      install: false,
    });
  });

  it('splits scoped overrides after the package name', () => {
    const flags = parseFlags(['--override', '@videojs/react=file:/tmp/a=b.tgz', '--override', 'cn=0.4.0']);

    expect(flags.overrides).toEqual({ '@videojs/react': 'file:/tmp/a=b.tgz', cn: '0.4.0' });
  });

  it('rejects styling a framework does not publish', () => {
    expect(() => parseFlags(['--framework', 'html', '--styling', 'tailwind'])).toThrow(UsageError);
  });

  it('rejects unknown values', () => {
    expect(() => parseFlags(['--base', 'fancy'])).toThrow(/--base must be one of/);
  });
});

describe('resolveDefaults', () => {
  it('puts the skin in a folder named after it and starts React skins from Scaffold with Tailwind', () => {
    expect(resolveDefaults(parseFlags(['--name', 'Neon Glow']))).toMatchObject({
      directory: 'neon-glow',
      name: 'Neon Glow',
      framework: 'react',
      styling: 'tailwind',
      base: 'scaffold',
      preset: 'video',
    });
    expect(resolveDefaults(parseFlags(['--framework', 'html'])).styling).toBe('css');
  });
});

describe('detectPackageManager', () => {
  it('reads the package manager that ran `create`', () => {
    expect(detectPackageManager('pnpm/12.6.0 npm/? node/v22.19.0 darwin arm64')).toBe('pnpm');
    expect(detectPackageManager('bun/1.3.0')).toBe('bun');
    expect(detectPackageManager('')).toBe('npm');
  });
});

describe('slugify', () => {
  it('makes an npm-safe name from a skin name or the last path segment', () => {
    expect(slugify('Neon Glow!')).toBe('neon-glow');
    expect(slugify('/tmp/My Cool Skin')).toBe('my-cool-skin');
  });
});

describe('validateName', () => {
  it('requires a name with at least one letter or number', () => {
    expect(validateName(undefined)).toBe('Give the skin a name.');
    expect(validateName('  ')).toBe('Give the skin a name.');
    expect(validateName('!!!')).toBe('Use at least one letter or number in the name.');
    expect(validateName('Neon')).toBeUndefined();
  });
});

describe('missingChoices', () => {
  it('lists each skin-shaping choice the flags leave out, with its default', () => {
    expect(missingChoices(parseFlags(['neon', '--base', 'neutral']))).toEqual([
      { flag: '--name' },
      { flag: '--framework', default: 'react' },
      { flag: '--styling', default: 'tailwind' },
      { flag: '--preset', default: 'video' },
    ]);
  });

  it('skips styling when the framework publishes one', () => {
    expect(
      missingChoices(parseFlags(['--name', 'Neon', '--framework', 'html', '--base', 'default', '--preset', 'audio']))
    ).toEqual([]);
  });
});

describe('reproduceCommand', () => {
  it('spells out every choice for the package manager that ran it', () => {
    const options = resolveDefaults(parseFlags(['--name', 'Neon', '--package-manager', 'npm']));

    expect(reproduceCommand(options)).toBe(
      'npx @videojs/cli@latest skin create neon --name Neon --framework react --styling tailwind --base scaffold --preset video'
    );
  });

  it('passes flags straight through for other package managers, and quotes what the shell would split', () => {
    const options = resolveDefaults(
      parseFlags(['my skins/neon', '--name', "Neon's Glow", '--package-manager', 'pnpm', '--no-install'])
    );

    expect(reproduceCommand(options)).toBe(
      "pnpm dlx @videojs/cli@latest skin create 'my skins/neon' --name 'Neon'\\''s Glow' --framework react --styling tailwind --base scaffold --preset video --no-install"
    );
  });
});

describe('expandHome', () => {
  it('expands a leading ~, which a prompt or quoted argument leaves literal', () => {
    expect(expandHome('~/skins/neon')).toBe(`${homedir()}/skins/neon`);
    expect(expandHome('~')).toBe(homedir());
    expect(expandHome('./~/neon')).toBe('./~/neon');
    expect(expandHome('~neon')).toBe('~neon');
  });

  it('applies to the directory argument', () => {
    expect(parseFlags(['~/skins/neon']).directory).toBe(`${homedir()}/skins/neon`);
  });
});
