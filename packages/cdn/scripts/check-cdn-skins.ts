/** Verify that every generated skin survives the public CDN build as a browser-ready entry. */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveClosure } from './cdn-graph.ts';

const CDN_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The bundles are built from `@videojs/html`'s published output, so that is where the generated skins are read from.
const HTML_DIST_DIR = resolve(
  dirname(createRequire(import.meta.url).resolve('@videojs/html/package.json')),
  'dist/default'
);
const PREFIX = '\x1b[35m[check-cdn-skins]\x1b[0m';
const forbiddenRuntime = /(?:virtual:vjsc|vjsc\/components|vjsc\/target|@videojs\/core\/vjsc)/;
const skins = [
  {
    entry: 'video',
    generated: 'default-video',
    skinTag: 'video-skin',
    playerTag: 'video-player',
    scope: '.media-skin[data-theme=default][data-preset=video]',
  },
  {
    entry: 'video-neutral',
    generated: 'neutral-video',
    skinTag: 'video-neutral-skin',
    playerTag: 'video-player',
    scope: '.media-skin[data-theme=neutral][data-preset=video]',
  },
  {
    entry: 'audio',
    generated: 'default-audio',
    skinTag: 'audio-skin',
    playerTag: 'audio-player',
    scope: '.media-skin[data-theme=default][data-preset=audio]',
  },
  {
    entry: 'audio-neutral',
    generated: 'neutral-audio',
    skinTag: 'audio-neutral-skin',
    playerTag: 'audio-player',
    scope: '.media-skin[data-theme=neutral][data-preset=audio]',
  },
  {
    entry: 'live-video',
    generated: 'default-live-video',
    skinTag: 'live-video-skin',
    playerTag: 'live-video-player',
    scope: '.media-skin[data-theme=default][data-preset=live-video]',
  },
  {
    entry: 'live-video-neutral',
    generated: 'neutral-live-video',
    skinTag: 'live-video-neutral-skin',
    playerTag: 'live-video-player',
    scope: '.media-skin[data-theme=neutral][data-preset=live-video]',
  },
  {
    entry: 'live-audio',
    generated: 'default-live-audio',
    skinTag: 'live-audio-skin',
    playerTag: 'live-audio-player',
    scope: '.media-skin[data-theme=default][data-preset=live-audio]',
  },
  {
    entry: 'live-audio-neutral',
    generated: 'neutral-live-audio',
    skinTag: 'live-audio-neutral-skin',
    playerTag: 'live-audio-player',
    scope: '.media-skin[data-theme=neutral][data-preset=live-audio]',
  },
] as const;

function main(): void {
  if (!existsSync(CDN_DIR)) fail(`CDN build not found at ${CDN_DIR}. Run \`pnpm build:cdn\` first.`);

  for (const skin of skins) {
    const stylesheet = readCdn(`${skin.entry}.css`);

    assert(stylesheet.length > 10_000, `${skin.entry}.css is unexpectedly incomplete`);
    assert(stylesheet.includes(skin.scope), `${skin.entry}.css is missing its skin scope`);

    const registration = readSource(`internal/skins/${skin.generated}/register.js`);
    const expectedSources = registrationImports(registration);

    for (const mode of ['dev', 'prod'] as const) {
      const entry = `${skin.entry}${mode === 'dev' ? '.dev' : ''}.js`;
      const closure = resolveClosure(CDN_DIR, [entry]);
      const source = [...closure].map(readCdn).join('\n');

      assert(source.includes(skin.skinTag), `${entry} does not register ${skin.skinTag}`);
      assert(source.includes(skin.playerTag), `${entry} does not register ${skin.playerTag}`);
      assert(source.includes('<media-container'), `${entry} does not contain its static skin template`);
      assert(!forbiddenRuntime.test(source), `${entry} retains a VJSC compiler runtime reference`);
      assert(existsSync(resolve(CDN_DIR, `${entry}.map`)), `${entry} is missing its source map`);
      assert(readCdn(entry).includes(`sourceMappingURL=${entry}.map`), `${entry} does not reference its source map`);

      const sources = mappedSources(closure);
      const generatedRegister = `internal/skins/${skin.generated}/register.js`;

      assert(
        sources.some((value) => value.endsWith(generatedRegister)),
        `${entry} dropped ${generatedRegister}`
      );

      for (const expected of expectedSources) {
        assert(
          sources.some((value) => value.endsWith(expected)),
          `${entry} dropped ${expected}`
        );
      }
    }
  }

  console.log(PREFIX, `✅ ${skins.length} skins have dev/prod bundles, complete CSS, and source maps`);
}

function readCdn(file: string): string {
  const path = resolve(CDN_DIR, file);

  if (!existsSync(path)) fail(`Expected CDN skin artifact is missing: ${file}`);

  return readFileSync(path, 'utf8');
}

function readSource(file: string): string {
  const path = resolve(HTML_DIST_DIR, file);

  if (!existsSync(path)) fail(`Expected generated skin source is missing: ${file}`);

  return readFileSync(path, 'utf8');
}

function mappedSources(files: Iterable<string>): string[] {
  const sources = new Set<string>();

  for (const file of files) {
    const map = resolve(CDN_DIR, `${file}.map`);
    if (!existsSync(map)) continue;

    const parsed: unknown = JSON.parse(readFileSync(map, 'utf8'));
    if (Object.prototype.toString.call(parsed) !== '[object Object]') continue;

    // SAFETY: The parsed source map was checked to be an object before reading its optional sources field.
    const sourceMap = parsed as { sources?: unknown };
    if (!Array.isArray(sourceMap.sources)) continue;

    for (const source of sourceMap.sources) {
      if (Object.prototype.toString.call(source) !== '[object String]') continue;

      sources.add(String(source));
    }
  }

  return [...sources];
}

function registrationImports(registration: string): string[] {
  return [...registration.matchAll(/^import ['"]([^'"]+)['"];$/gm)].map((match) => {
    const source = resolve(HTML_DIST_DIR, 'internal/skins/default-video', match[1]!);

    return relative(HTML_DIST_DIR, source).replaceAll('\\', '/');
  });
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) fail(message);
}

function fail(message: string): never {
  console.error(PREFIX, '\x1b[31merror:\x1b[0m', message);
  process.exit(1);
}

main();
