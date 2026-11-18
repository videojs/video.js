import { existsSync, rmSync, watch } from 'node:fs';

import { emitElementBase, emitElementFamily } from './build/element.js';
import { emitHtmlFamily } from './build/html.js';
import { loadIconFamilies } from './build/model.js';
import { emitReactFamily, emitReactNativeFamily } from './build/react.js';
import { emitRenderFamily } from './build/render.js';
import { emitVjscFamily } from './build/vjsc.js';
import { ASSETS_DIR, DIST_DIR } from './internal/paths.js';

const isWatch = process.argv.includes('--watch');
let hasBuilt = false;

async function build(): Promise<void> {
  // Keep the previous output available while sibling package watchers start.
  // Later watch rebuilds still clean stale files after icon removals.
  if ((!isWatch || hasBuilt) && existsSync(DIST_DIR)) rmSync(DIST_DIR, { recursive: true, force: true });

  const families = loadIconFamilies();

  console.log(`Building ${families.length} icon families: ${families.map(({ name }) => name).join(', ')}`);

  emitElementBase(families);

  for (const family of families) {
    console.log(`Building ${family.name} (${family.icons.length} icons)`);
    emitVjscFamily(family);
    emitHtmlFamily(family);
    await emitReactFamily(family);
    await emitReactNativeFamily(family);
    emitRenderFamily(family);
    emitElementFamily(family);
  }

  hasBuilt = true;
}

function watchAssets(): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let building = false;
  let pending = false;

  const rebuild = async (): Promise<void> => {
    if (building) {
      pending = true;
      return;
    }

    building = true;

    do {
      pending = false;

      try {
        await build();
        console.log('Rebuild complete.');
      } catch (error) {
        console.error(error);
      }
    } while (pending);

    building = false;
  };

  watch(ASSETS_DIR, { recursive: true }, (_event, filename) => {
    if (!filename?.endsWith('.svg')) return;

    console.log(`Changed: ${filename}`);
    clearTimeout(timer);
    timer = setTimeout(() => void rebuild(), 200);
  });
}

async function main(): Promise<void> {
  await build();
  console.log('Build complete.');

  if (isWatch) {
    console.log('Watching icon assets for changes.');
    watchAssets();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
