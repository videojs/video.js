import type { Plugin } from 'rolldown';

import type { SourceEdit } from '../ast';
import { commitTargetImports, createTargetModule } from '../target/module';
import { SCRIPT_MODULE_ID } from '../utils/module-id';
import { scopeKey, selectComponentTargets } from './component-target';
import { lowerClassNames } from './react-target-props';
import { assertLowered, pruneImports } from './target-import-cleanup';
import type { TargetLowerPluginOptions } from './target-lower';
import { lowerTemplates } from './template-target';

/**
 * The last target stage, which runs on lowered JSX: it lowers `className` arrays and templates, whose output depends on
 * the elements lowering chose, then checks that nothing canonical survived and prunes the imports lowering left
 * unused.
 */
export function targetFinalizePlugin(options: TargetLowerPluginOptions): Plugin {
  return {
    name: 'vjsc:target-finalize',
    transform: {
      filter: { id: SCRIPT_MODULE_ID },
      handler(code, id, transform) {
        const targets = selectComponentTargets(options.targets, id);
        const { ast, magicString } = transform;
        if (targets.length === 0 || !ast || !magicString) return null;

        const module = createTargetModule({ id, code, ast, magicString }, targets);
        const classNames = lowerClassNames(module);
        const templates = lowerTemplates(module, classNames, scopeKey(id, options.root ?? process.cwd()));

        // A template renders the edits inside it into its own output, so only the rest apply directly. Insertions go
        // last: an overwrite ending where one is inserted would otherwise discard it.
        for (const edit of [...outside(classNames, templates.edits), ...templates.edits]) {
          if (edit.content) magicString.overwrite(edit.start, edit.end, edit.content);
          else magicString.remove(edit.start, edit.end);
        }

        for (const insertion of templates.insertions) magicString.appendLeft(insertion.start, insertion.content);

        assertLowered(module, templates.edits);
        pruneImports(module);
        commitTargetImports(module);

        return magicString.hasChanged() ? { code: magicString } : null;
      },
    },
  };
}

function outside(edits: readonly SourceEdit[], ranges: readonly SourceEdit[]): SourceEdit[] {
  return edits.filter((edit) => !ranges.some((range) => edit.start >= range.start && edit.end <= range.end));
}
