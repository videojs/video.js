import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

import type { TaskCheck } from '../../src/grade/browser.ts';
import { analyzeProject, SKIN_SOURCE_PARTS } from '../../src/grade/static.ts';
import { assertion } from '../../src/grade/task-checks.ts';

/** A stylesheet with this many of the skin's own `.media-*` classes is a copy of the skin's styles, not a theme. */
const COPIED_SKIN_CLASSES = 20;

/**
 * The user put automatic upgrades first, so the skin stays in the package, where upgrades reach it. Neither its source
 * nor a copy of its stylesheet may land in the project; restyling goes through the skin's custom properties.
 */
export const project: TaskCheck['project'] = ({ appDir, files }) => {
  const read = (file: string) => {
    try {
      return readFileSync(join(appDir, file), 'utf8');
    } catch {
      return '';
    }
  };
  const registry = files.includes('components.json') && /videojs/i.test(read('components.json'));
  const skinFiles = files.filter((file) => /(?:^|\/)videojs\/.*skin\.(?:tsx|jsx|ts|js|css|html)$/.test(file));
  const parts = analyzeProject(appDir, files).skinSource?.parts ?? 0;
  const copiedStyles = files.filter(
    (file) => extname(file) === '.css' && new Set(read(file).match(/\.media-[\w-]+/g) ?? []).size >= COPIED_SKIN_CLASSES
  );
  const source = [
    ...(registry ? ['components.json'] : []),
    ...skinFiles.slice(0, 3),
    ...(parts >= SKIN_SOURCE_PARTS ? [`${parts} UI parts composed`] : []),
  ];

  return [
    assertion('no skin source in the project', source.length === 0, source.join(', ') || undefined),
    assertion('no copied skin stylesheet', copiedStyles.length === 0, copiedStyles.slice(0, 3).join(', ') || undefined),
  ];
};
