import type { Program } from '@oxc-project/types';
import { walk } from 'oxc-walker';
import type { Plugin } from 'rolldown';

import { sourceError } from '../ast/errors';
import { commitTargetImports, createTargetModule } from '../target/module';
import { SCRIPT_MODULE_ID } from '../utils/module-id';
import { type ComponentTargetPluginOptions, lowerComponents, selectComponentTargets } from './component-target';

export interface TargetLowerPluginOptions extends ComponentTargetPluginOptions {
  /**
   * Directory generated identifiers are keyed against, so the same source compiles to the same identifiers in every
   * checkout. Defaults to the working directory.
   */
  readonly root?: string | undefined;
}

/**
 * The second target stage, which lowers JSX: it rejects compiler directives no source step consumed, then lowers the
 * module's canonical components and primitives in one bottom-up walk.
 */
export function targetLowerPlugin(options: TargetLowerPluginOptions): Plugin {
  return {
    name: 'vjsc:target-lower',
    transform: {
      filter: { id: SCRIPT_MODULE_ID, code: '<' },
      handler(code, id, transform) {
        const targets = selectComponentTargets(options.targets, id);
        const { ast, magicString } = transform;
        if (targets.length === 0 || !ast || !magicString) return null;

        assertNoCompilerDirectives(ast);

        const module = createTargetModule({ id, code, ast, magicString }, targets);

        lowerComponents(module, options.root ?? process.cwd());
        commitTargetImports(module);

        return magicString.hasChanged() ? { code: magicString } : null;
      },
    },
  };
}

/** Reject compile-time props that no step of the source stage consumed; they would otherwise reach the output. */
function assertNoCompilerDirectives(ast: Program): void {
  walk(ast, {
    enter(node) {
      if (node.type !== 'JSXAttribute' || node.name.type !== 'JSXIdentifier' || !node.name.name.startsWith('$')) return;

      throw sourceError(
        `Unhandled VJSC compiler directive \`${node.name.name}\`.\n` +
          'Reason: none of the selected target transforms consumed this compile-time prop.\n' +
          'Recommendation: remove the directive or implement it in the target that owns its behavior.',
        node.start
      );
    },
  });
}
