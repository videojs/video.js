import { isObject } from '@videojs/utils/predicate';
import type { Plugin, PluginContext } from 'rolldown';

import type { ModuleMeta } from '../components/meta';
import type { Graph } from './types';

/** Locate the graph capability exposed by `vjscPlugin` in normalized Rolldown plugins. */
export function findGraph<Node extends ModuleMeta = ModuleMeta, Variant = unknown>(
  plugins: readonly unknown[]
): Graph<Node, Variant> | undefined {
  for (const plugin of plugins) {
    if (!isObject(plugin) || !('name' in plugin) || plugin.name !== 'vjsc' || !('api' in plugin)) {
      continue;
    }

    return plugin.api as Graph<Node, Variant> | undefined;
  }

  return undefined;
}

export interface GraphPluginOptions<Node extends ModuleMeta = ModuleMeta, Variant = unknown> {
  readonly name: string;
  /** Called at build start, before the graph is finalized, to register watch files. */
  watch?(this: PluginContext): readonly string[];
  /** Emit output from the finalized graph. Runs while the bundle is generated, after every module is transformed. */
  generate(this: PluginContext, graph: Graph<Node, Variant>): void | Promise<void>;
}

/** A plugin that consumes the finalized graph of the `vjscPlugin` in the same build. */
export function defineGraphPlugin<Node extends ModuleMeta = ModuleMeta, Variant = unknown>(
  options: GraphPluginOptions<Node, Variant>
): Plugin {
  let graph: Graph<Node, Variant> | undefined;
  const missing = `\`${options.name}\` requires vjscPlugin in the same build.`;

  return {
    name: options.name,
    buildStart(inputOptions) {
      graph = findGraph<Node, Variant>(inputOptions.plugins);

      if (!graph) this.error(missing);

      for (const file of options.watch?.call(this) ?? []) this.addWatchFile(file);
    },
    async generateBundle() {
      if (!graph) this.error(missing);

      await options.generate.call(this, graph);
    },
  };
}
