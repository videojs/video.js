import type { Plugin } from 'rolldown';

import { sourceError } from '../ast/errors';
import { mergeModuleBuildMeta, readModuleBuildMeta } from '../graph/build-meta';
import type { ComponentTarget, TargetTransform } from '../target/definition';
import { commitTargetImports, createTargetModule, type TargetModule } from '../target/module';
import { SCRIPT_MODULE_ID } from '../utils/module-id';
import { type ComponentTargetPluginOptions, selectComponentTargets } from './component-target';
import { lowerRenderTargets } from './render-target';
import { lowerSourceTypes } from './target-type';

const JSX_IMPORT_SOURCE = /@jsxImportSource\s+([^\s*]+)/;

/**
 * The first target stage, which rewrites authored source before any JSX is lowered: it declares the targets' JSX
 * runtime, runs their own transforms, and lowers render targets and source types. The steps edit disjoint ranges of one
 * parse, so they share its bindings and add their imports together.
 */
export function targetSourcePlugin(options: ComponentTargetPluginOptions): Plugin {
  return {
    name: 'vjsc:target-source',
    transform: {
      filter: { id: SCRIPT_MODULE_ID },
      handler(code, id, transform) {
        const targets = selectComponentTargets(options.targets, id);
        const { ast, magicString } = transform;
        if (targets.length === 0 || !ast || !magicString) return null;

        const module = createTargetModule({ id, code, ast, magicString }, targets);
        const annotations: Record<string, unknown> = {};

        declareJsxImportSource(module);
        runTargetTransforms(module, annotations);
        lowerRenderTargets(module);
        lowerSourceTypes(module);
        commitTargetImports(module);

        const changed = magicString.hasChanged();

        if (Object.keys(annotations).length === 0) return changed ? { code: magicString } : null;

        const meta = this.getModuleInfo(id)?.meta;

        return {
          ...(changed ? { code: magicString } : {}),
          meta: mergeModuleBuildMeta(meta, {
            annotations: { ...readModuleBuildMeta(meta)?.annotations, ...annotations },
          }),
        };
      },
    },
  };
}

/** Declare the JSX runtime the lowered module compiles against, which every selected target must share. */
function declareJsxImportSource(module: TargetModule): void {
  if (!module.code.includes('<')) return;

  const sources = new Set(module.targets.map((target) => target.jsx.importSource));
  if (sources.size !== 1) throw new Error('Component targets for one module must use the same JSX import source.');

  const [source] = sources;
  const declared = JSX_IMPORT_SOURCE.exec(module.code);
  if (declared?.[1] === source) return;

  if (declared) {
    throw sourceError(`Module declares JSX import source \`${declared[1]}\`, expected \`${source}\`.`, declared.index);
  }

  module.magicString.prepend(`/** @jsxImportSource ${source} */\n`);
}

/** Run each compile-time transform the selected targets own, once, with the target that owns it. */
function runTargetTransforms(module: TargetModule, annotations: Record<string, unknown>): void {
  const owners = new Map<TargetTransform, ComponentTarget>();

  for (const target of module.targets) {
    for (const transform of target.transforms) if (!owners.has(transform)) owners.set(transform, target);
  }

  for (const [transform, target] of owners) {
    transform.transform({
      code: module.code,
      id: module.id,
      ast: module.ast,
      magicString: module.magicString,
      target,
      imports: module.imports,
      annotate(key, value) {
        annotations[key] = value;
      },
    });
  }
}
