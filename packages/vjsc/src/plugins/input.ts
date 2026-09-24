import { isString } from '@videojs/utils/predicate';
import type { InputOption } from 'rolldown';

/** Add named entries without replacing existing Rolldown inputs. */
export function addInputEntries(
  input: InputOption | undefined,
  entries: Readonly<Record<string, string>>
): InputOption {
  if (!input) return { ...entries };

  const ids = Object.values(entries);

  if (isString(input)) return [input, ...ids];

  if (Array.isArray(input)) return [...new Set([...input, ...ids])];

  for (const name of Object.keys(entries)) {
    if (Object.hasOwn(input, name)) throw new Error(`Input entry already exists: \`${name}\`.`);
  }

  return { ...input, ...entries };
}
