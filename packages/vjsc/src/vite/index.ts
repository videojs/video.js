import type { ModuleMeta } from '../components/meta';
import { createPluginPipeline, type VjscPluginOptions as BaseVjscPluginOptions } from '../plugins/vjsc';
import type { StyleDiagnosticsOptions } from '../styles/diagnostics';
import { type ViteOxcPlugin, viteOxcPlugin } from './oxc';
import { createViteStyleHmr } from './style-hmr';

export type { EntriesOptions, MetaOptions, TransformOptions } from '../plugins/vjsc';
export type { SourceEntry } from '../plugins/variants';
export { defineVariants, type VariantCodec, type VariantModule } from '../plugins/variants';
export type { TransformModule } from '../utils/module-id';
export type { ComplexSelectorDiagnosticLevel, StyleDiagnosticsOptions } from '../styles/diagnostics';

interface ViteDiagnosticsPlugin extends ViteOxcPlugin {
  readonly apply: 'serve';
  configResolved(): void;
}

export interface VjscPluginOptions<Variant = never, Meta extends ModuleMeta = ModuleMeta> extends BaseVjscPluginOptions<
  Variant,
  Meta
> {
  /**
   * Controls the complex-selector warnings the Vite development server reports. Production builds skip those warnings;
   * style isolation errors fail every build.
   */
  readonly diagnostics?: StyleDiagnosticsOptions | undefined;
}

/** Create the Vite-adapted VJSC compiler pipeline. */
export function vjscPlugin<Node extends ModuleMeta = ModuleMeta, Variant = never>(
  options: VjscPluginOptions<Variant, Node>
): ViteOxcPlugin[] {
  const styleHmr = createViteStyleHmr();
  let dev = false;
  const devDiagnostics: ViteDiagnosticsPlugin = {
    name: 'vjsc:dev-diagnostics',
    apply: 'serve',
    enforce: 'pre',
    configResolved() {
      dev = true;
    },
  };

  return [
    devDiagnostics,
    ...createPluginPipeline<Node, Variant>(options, styleHmr.lifecycle, () =>
      dev ? (options.diagnostics ?? {}) : false
    ).map(viteOxcPlugin),
    styleHmr.plugin,
  ];
}
