import * as path from 'node:path';

import { generateFeatureReferences } from './feature-handler.js';
import { generateMediaElementReferences } from './media-element-handler.js';
import { type ReferenceGroup, validateReferenceGroup, writeReferenceGroup } from './output.js';
import { generateComponentReferences } from './pipeline.js';
import { generatePresetReferences } from './preset-handler.js';
import {
  ComponentReferenceSchema,
  FeatureReferenceSchema,
  MediaReferenceSchema,
  PresetReferenceSchema,
  UtilReferenceSchema,
} from './types.js';
import { getUtilEntries } from './util-handler.js';
import { log } from './utils.js';

const MONOREPO_ROOT = path.resolve(import.meta.dirname, '../../../../');
const CONTENT_ROOT = path.join(MONOREPO_ROOT, 'site/src/content');

/** Suppress known extractor gaps without hiding warnings from the builder itself. */
function suppressExtractorWarnings(): () => void {
  const originalWarn = console.warn;

  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('Unable to handle a type with flag')) return;

    originalWarn.apply(console, args);
  };
  return () => {
    console.warn = originalWarn;
  };
}

function createReferenceGroups(): {
  groups: ReferenceGroup[];
  presetResults: ReturnType<typeof generatePresetReferences>;
} {
  const componentResults = generateComponentReferences(MONOREPO_ROOT);
  const utilEntries = getUtilEntries(MONOREPO_ROOT);
  const featureResults = generateFeatureReferences(MONOREPO_ROOT);
  const mediaResults = generateMediaElementReferences(MONOREPO_ROOT);
  const presetResults = generatePresetReferences(MONOREPO_ROOT);

  const groups: ReferenceGroup[] = [
    {
      name: 'component',
      outputPath: path.join(CONTENT_ROOT, 'generated-component-reference'),
      schema: ComponentReferenceSchema,
      minimumDocs: 1,
      docs: componentResults.map((result) => ({
        fileName: `${result.kebab}.json`,
        label: result.name,
        data: result.reference,
      })),
    },
    {
      name: 'util',
      outputPath: path.join(CONTENT_ROOT, 'generated-util-reference'),
      schema: UtilReferenceSchema,
      minimumDocs: 1,
      docs: utilEntries.map((entry) => ({
        fileName: `${entry.slug}.json`,
        label: entry.data.name,
        data: entry.framework === null ? entry.data : { ...entry.data, frameworks: [entry.framework] },
        detail: entry.framework ?? 'all',
      })),
    },
    {
      name: 'feature',
      outputPath: path.join(CONTENT_ROOT, 'generated-feature-reference'),
      schema: FeatureReferenceSchema,
      minimumDocs: 1,
      docs: featureResults.map((result) => ({
        fileName: `${result.slug}.json`,
        label: result.name,
        data: result.reference,
      })),
    },
    {
      name: 'media component',
      outputPath: path.join(CONTENT_ROOT, 'generated-media-reference'),
      schema: MediaReferenceSchema,
      minimumDocs: 1,
      docs: mediaResults.map((result) => ({
        fileName: `${result.reference.tagName}.json`,
        label: result.name,
        data: result.reference,
      })),
    },
    {
      name: 'preset',
      outputPath: path.join(CONTENT_ROOT, 'generated-preset-reference'),
      schema: PresetReferenceSchema,
      minimumDocs: 1,
      docs: presetResults.map((result) => ({
        fileName: `${result.name}.json`,
        label: result.name,
        data: result.reference,
      })),
    },
  ];

  return { groups, presetResults };
}

function reportUnlinkedPresetFeatures(presetResults: ReturnType<typeof generatePresetReferences>): void {
  const unlinked = new Map<string, string>();

  for (const { reference } of presetResults) {
    for (const feature of reference.features) {
      if (!feature.hasReference) unlinked.set(feature.name, feature.slug);
    }
  }

  if (unlinked.size === 0) return;

  log.warn(`${unlinked.size} preset feature(s) have no reference page:`);

  for (const [name, slug] of unlinked) {
    log.warn(`  - ${name} → site/src/content/docs/${slug}.mdx (missing)`);
  }
}

function main(): void {
  const restoreWarnings = suppressExtractorWarnings();

  try {
    const { groups, presetResults } = createReferenceGroups();

    for (const group of groups) {
      if (group.docs.length === 0) {
        log.info(`No ${group.name}s found.`);
      } else {
        log.info(`Found ${group.docs.length} ${group.name}s. Validating...`);
      }
    }

    // Validate every group before changing any generated output.
    const validations = groups.map((group) => validateReferenceGroup(group));
    const failures = validations.filter((result) => !result.success);

    if (failures.length > 0) {
      let errorCount = 0;

      for (const failure of failures) {
        for (const error of failure.errors) {
          log.error(`Schema validation failed for ${failure.name} ${error.label}:`);

          for (const issue of error.issues) {
            log.error(`  - ${issue.path.map(String).join('.')}: ${issue.message}`);
          }

          errorCount++;
        }
      }

      log.error(`${errorCount} errors occurred. Generated files were not changed.`);
      process.exitCode = 1;
      return;
    }

    for (const validation of validations) {
      if (!validation.success) continue;

      const result = writeReferenceGroup(validation.group);

      for (const doc of validation.group.docs) {
        const detail = doc.detail ? ` (${doc.detail})` : '';

        log.success(`✅ Generated ${doc.fileName}${detail}`);
      }

      if (result.removed.length > 0) {
        log.info(`Removed ${result.removed.length} stale ${validation.group.name} file(s).`);
      }

      log.info(`Done! Generated ${result.written} ${validation.group.name} files.`);
    }

    reportUnlinkedPresetFeatures(presetResults);
  } finally {
    restoreWarnings();
  }
}

main();
