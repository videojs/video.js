import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { registryItemSchema, registrySchema, type RegistryItem } from 'shadcn/schema';

import { registryTargets } from './targets.ts';

const packageDir = resolve(import.meta.dirname, '../..');
const hostedDir = resolve(packageDir, 'dist/shadcn/r');
const catalogs = registryTargets.map((target) => target.output.replace(/^r\//, ''));

// Package pins are enforced while the registry is emitted; this checks the hosted catalogs are complete.
const items = (await Promise.all(catalogs.map(validateCatalog))).flat();

console.log(`Validated Video.js policy for ${items.length} hosted registry items.`);

async function validateCatalog(path: (typeof catalogs)[number]): Promise<RegistryItem[]> {
  const directory = resolve(hostedDir, path);
  const registry = registrySchema.parse(JSON.parse(await readFile(resolve(directory, 'registry.json'), 'utf8')));

  const files = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();

  const expected = ['catalog.json', 'registry.json', ...registry.items.map((item) => `${item.name}.json`)].sort();

  if (files.join('\n') !== expected.join('\n')) {
    throw new Error(
      `Hosted ${path} files do not match its catalog. Expected ${expected.length}; received ${files.length}.`
    );
  }

  return Promise.all(
    registry.items.map(async ({ name }) => {
      const source = await readFile(resolve(directory, `${name}.json`), 'utf8');

      return registryItemSchema.parse(JSON.parse(source));
    })
  );
}
