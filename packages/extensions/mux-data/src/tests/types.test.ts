// @vitest-environment node
/// <reference types="node" />

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

const packageDir = resolve(import.meta.dirname, '../..');
const tsgo = join(
  dirname(createRequire(import.meta.url).resolve('@typescript/native-preview/package.json')),
  'bin/tsgo.js'
);

const assignments = `
import type { MuxDataSdk } from '@videojs/mux-data';

export const monitor: MuxDataSdk['monitor'] = 1;
export const sdk: MuxDataSdk = 'not the SDK';
`;

const loadsMuxEmbed = '/// <reference path="./node_modules/mux-embed/dist/types/mux-embed.d.ts" />\n';

let consumerDir: string;

/** Type-checks `file` in a project that installs the built package, as the issue's reproduction does. */
function typecheck(file: string, skipLibCheck: boolean) {
  const args = ['--noEmit', '--strict', '--target', 'es2022', '--module', 'esnext', '--moduleResolution', 'bundler'];
  const { stdout, stderr } = spawnSync(
    process.execPath,
    [tsgo, ...args, '--lib', 'es2022,dom', '--skipLibCheck', String(skipLibCheck), file],
    { cwd: consumerDir, encoding: 'utf8' }
  );

  return `${stdout}${stderr}`.match(/^\S+\(\d+,\d+\): error TS\d+/gm) ?? [];
}

beforeAll(() => {
  if (!existsSync(join(packageDir, 'dist/dev/index.d.ts'))) {
    throw new Error('Missing dist: run `pnpm exec vp run @videojs/mux-data#build` first.');
  }

  consumerDir = mkdtempSync(join(tmpdir(), 'mux-data-consumer-'));
  mkdirSync(join(consumerDir, 'node_modules/@videojs'), { recursive: true });
  symlinkSync(packageDir, join(consumerDir, 'node_modules/@videojs/mux-data'), 'junction');
  symlinkSync(join(packageDir, 'node_modules/mux-embed'), join(consumerDir, 'node_modules/mux-embed'), 'junction');
  writeFileSync(join(consumerDir, 'package.json'), '{ "type": "module" }');
  writeFileSync(join(consumerDir, 'index.ts'), assignments);
  writeFileSync(join(consumerDir, 'ambient.ts'), `${loadsMuxEmbed}${assignments}`);
  writeFileSync(
    join(consumerDir, 'media-mux.ts'),
    `${assignments}
declare global {
  interface HTMLMediaElement {
    mux?: boolean;
  }
}
`
  );
  writeFileSync(
    join(consumerDir, 'augmented.ts'),
    `${loadsMuxEmbed}${assignments}
declare module 'mux-embed' {
  interface Mux {
    extensionToken: string;
  }
}

export const token = (sdk: MuxDataSdk): string => sdk.extensionToken;
`
  );
});

afterAll(() => {
  if (consumerDir) rmSync(consumerDir, { recursive: true, force: true });
});

describe('MuxDataSdk', () => {
  it.each([true, false])('resolves to the mux-embed SDK type for consumers (skipLibCheck: %s)', (skipLibCheck) => {
    expect(typecheck('index.ts', skipLibCheck)).toEqual([
      'index.ts(4,14): error TS2322',
      'index.ts(5,14): error TS2322',
    ]);
  });

  it.each([true, false])(
    'resolves to the mux-embed SDK type when the consumer declares HTMLMediaElement.mux (skipLibCheck: %s)',
    (skipLibCheck) => {
      expect(typecheck('media-mux.ts', skipLibCheck)).toEqual([
        'media-mux.ts(4,14): error TS2322',
        'media-mux.ts(5,14): error TS2322',
      ]);
    }
  );

  it.each([true, false])(
    'does not conflict with mux-embed declarations the consumer loads itself (skipLibCheck: %s)',
    (skipLibCheck) => {
      expect(typecheck('ambient.ts', skipLibCheck)).toEqual([
        'ambient.ts(5,14): error TS2322',
        'ambient.ts(6,14): error TS2322',
      ]);
    }
  );

  it.each([true, false])('keeps consumer augmentations of the mux-embed Mux (skipLibCheck: %s)', (skipLibCheck) => {
    expect(typecheck('augmented.ts', skipLibCheck)).toEqual([
      'augmented.ts(5,14): error TS2322',
      'augmented.ts(6,14): error TS2322',
    ]);
  });
});
