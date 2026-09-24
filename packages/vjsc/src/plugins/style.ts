import { resolve } from 'node:path';

import { isFunction } from '@videojs/utils/predicate';
import type { Plugin } from 'rolldown';

import { insertModuleImports } from '../ast/imports';
import { mergeModuleBuildMeta } from '../graph/build-meta';
import {
  CANDIDATES_ALIAS,
  type CandidateManifest,
  type CandidateManifestOptions,
  candidateManifestOptions,
  createCandidateManifest,
  discoverStyleModules,
  resolveCandidateManifestPath,
} from '../styles/candidates';
import { compileStyles } from '../styles/compile';
import { loadDesignSystem } from '../styles/design-system';
import {
  diagnoseCompiledStyles,
  diagnoseStyles,
  reportStyleDiagnostics,
  type StyleDiagnosticsOptions,
} from '../styles/diagnostics';
import type { StyleTransformOptions } from '../styles/options';
import { assertCompositionOrder } from '../styles/precedence';
import { importedStyleFiles, transformStyleReferences } from '../styles/references';
import { createResolvedStyles, type LoadedStyleModule, loadStyleModule, type ResolvedStyles } from '../styles/resolved';
import {
  createVirtualCssId,
  createVirtualCssRegistry,
  VIRTUAL_CSS_ID,
  type VirtualCssLifecycle,
} from '../styles/virtual-css';
import { createFileCache } from '../utils/file-cache';
import { moduleFilename, parseModuleId, SCRIPT_MODULE_ID, type TransformModule } from '../utils/module-id';
import { toPosixPath } from '../utils/path';

export type StylePluginConfig =
  | StyleTransformOptions
  | ((module: TransformModule) => StyleTransformOptions | null | Promise<StyleTransformOptions | null>);

export interface StylePluginLifecycle extends VirtualCssLifecycle {
  /** An owner was transformed and now depends on these style modules and design files. */
  onOwnerTransform(id: string, watchFiles: readonly string[]): void;
}

export type StylePluginDiagnostics = StyleDiagnosticsOptions | false | (() => StyleDiagnosticsOptions | false);

export interface StylePluginOptions {
  /** Style options for each module, or `null` to leave its style references alone. */
  readonly transform: StylePluginConfig;
  /** Complex-selector warnings; isolation errors fail every build regardless. @default {} */
  readonly diagnostics?: StylePluginDiagnostics | undefined;
  readonly lifecycle?: StylePluginLifecycle | undefined;
  /** Write every resolved utility to a Tailwind candidate manifest. */
  readonly candidates?: string | boolean | CandidateManifestOptions | undefined;
  /**
   * Leave generated stylesheet imports unresolved, for builds whose output is assets derived from the graph rather than
   * bundled CSS. The graph reads their source through `cssSource`.
   */
  readonly external?: boolean | undefined;
}

/** Vite configuration fields the style plugin reads while registering the candidate manifest alias. */
interface ViteUserConfig {
  readonly root?: string | undefined;
  readonly cacheDir?: string | undefined;
}

/** Vite configuration that lets Tailwind entries import the candidate manifest and recompile when it changes. */
interface CandidateManifestViteConfig {
  readonly resolve: { readonly alias: Array<{ find: string; replacement: string }> };
  readonly server: { readonly watch: { readonly ignored: string[] } };
}

type StylePluginHooks = Plugin & {
  config?(config: ViteUserConfig): CandidateManifestViteConfig | null;
};

/** The style plugin, which also serves the source of the stylesheets it generated. */
export type StylePlugin = StylePluginHooks & { cssSource(id: string): string | undefined };

interface CachedStyleSet {
  readonly modules: readonly LoadedStyleModule[];
  readonly styles: ResolvedStyles;
}

export function stylePlugin(options: StylePluginOptions): StylePlugin {
  const { diagnostics = {}, lifecycle } = options;
  const styleModules = createFileCache(loadStyleModule, (module) => module.watchFiles);
  const designs = createFileCache(loadDesignSystem, (design) => design.watchFiles);
  const styleSets = new Map<string, CachedStyleSet>();
  const css = createVirtualCssRegistry(lifecycle);
  const reportedWarnings = new Set<string>();
  const manifestOptions = candidateManifestOptions(options.candidates);
  let manifest: CandidateManifest | undefined;
  let manifestRoot = process.cwd();
  let cwd = process.cwd();

  const useManifest = (root: string, cacheDir?: string): CandidateManifest | undefined => {
    if (!manifestOptions) return undefined;

    if (!manifest) {
      manifestRoot = root;
      manifest = createCandidateManifest(
        manifestOptions.path ? resolve(root, manifestOptions.path) : resolveCandidateManifestPath(root, cacheDir),
        { persist: !manifestOptions.include }
      );
    }

    return manifest;
  };

  // Owners importing the same style modules share one resolved set, so its validation and diagnostics run once.
  const styleSet = async (files: readonly string[]): Promise<ResolvedStyles> => {
    const paths = [...new Set(files.map((file) => resolve(file)))].sort();
    const modules = await Promise.all(paths.map((file) => styleModules.get(file)));
    const key = paths.join('\0');
    const cached = styleSets.get(key);
    if (cached?.modules.every((module, index) => module === modules[index])) return cached.styles;

    const styles = createResolvedStyles(modules);

    styleSets.set(key, { modules, styles });
    return styles;
  };

  const plugin: StylePluginHooks = {
    name: 'vjsc:styles',
    config(userConfig) {
      const current = useManifest(resolve(userConfig.root ?? process.cwd()), userConfig.cacheDir);
      if (!current) return null;

      // Vite's watcher skips node_modules and its cache directory, so re-include the manifest; otherwise Tailwind
      // keeps the CSS it compiled before style modules recorded their utilities.
      return {
        resolve: { alias: [{ find: CANDIDATES_ALIAS, replacement: current.path }] },
        server: { watch: { ignored: [`!${escapeGlobPath(toPosixPath(current.path))}`] } },
      };
    },
    options(inputOptions) {
      cwd = resolve(inputOptions.cwd ?? process.cwd());
      useManifest(cwd);
      return null;
    },
    async buildStart() {
      reportedWarnings.clear();
      await manifest?.ensure();

      if (manifest && manifestOptions?.include) {
        const files = discoverStyleModules(manifestRoot, manifestOptions.include);
        const loaded = await Promise.all(files.map((file) => styleModules.get(file)));

        for (const module of loaded) this.addWatchFile(module.modulePath);

        await manifest.record({ modules: new Map(loaded.map((module) => [module.modulePath, module.rules])) });
      }
    },
    resolveId: {
      filter: { id: VIRTUAL_CSS_ID },
      handler(id) {
        if (css.source(id) === undefined) return null;

        return options.external ? { id, external: true } : `\0${id}`;
      },
    },
    load: {
      filter: { id: VIRTUAL_CSS_ID },
      handler(id) {
        return css.source(id) ?? null;
      },
    },
    transform: {
      filter: { id: SCRIPT_MODULE_ID, code: '.styles' },
      async handler(_code, id, transform) {
        const config = options.transform;
        const styleOptions = isFunction(config) ? await config(parseModuleId(id)) : config;
        const { ast, magicString } = transform;

        if (!styleOptions || !ast || !magicString) {
          css.replace(id, []);
          return null;
        }

        const filename = moduleFilename(id);
        const files = importedStyleFiles(filename, ast);
        const styles = files.length > 0 ? await styleSet(files) : undefined;

        // Only Tailwind output needs Tailwind to generate the utilities; CSS output compiles its own.
        if (styles && styleOptions.mode === 'tailwind') await manifest?.record(styles);

        if (!styles || styles.rules.length === 0) {
          lifecycle?.onOwnerTransform(id, styles?.watchFiles ?? []);
          css.replace(id, []);
          return null;
        }

        const stylesheet = styleOptions.stylesheet;
        const design = stylesheet ? await designs.get(resolve(cwd, stylesheet.input)) : undefined;
        const watch = (): void => {
          const watchFiles = [...new Set([...styles.watchFiles, ...(design?.watchFiles ?? [])])];

          lifecycle?.onOwnerTransform(id, watchFiles);

          for (const file of watchFiles) this.addWatchFile(file);
        };

        watch();

        const found = [...diagnoseStyles(styles, styleOptions.variants, design?.merge)];
        const references = transformStyleReferences(filename, ast, magicString, styles, styleOptions, design?.merge);
        const compiled =
          styleOptions.mode === 'css' && references.referencedRules.size > 0 ? styleOptions.stylesheet : undefined;

        if (compiled && design) {
          found.push(...diagnoseCompiledStyles(styles, design, references.referencedRules, styleOptions.variants));
        }

        const diagnosticOptions = isFunction(diagnostics) ? diagnostics() : diagnostics;

        reportStyleDiagnostics(found, diagnosticOptions, reportedWarnings, (message) => this.warn(message));

        if (!compiled || !design) {
          css.replace(id, []);
          return magicString.hasChanged() ? { code: magicString } : null;
        }

        assertCompositionOrder({
          compositions: references.compositions,
          rules: styles.rules,
          design,
          variants: styleOptions.variants,
          order: compiled.order,
        });

        const watchedDesignFiles = design.watchFiles.size;
        const assets = await compileStyles({
          design,
          styles,
          scope: compiled.scope,
          order: compiled.order,
          shadowHosts: compiled.shadowHosts,
          variants: styleOptions.variants,
          ruleClassNames: references.referencedRules,
        });

        // Compiling can resolve design imports the loader never saw.
        if (design.watchFiles.size !== watchedDesignFiles) watch();

        const base = compiled.base ? resolve(cwd, compiled.base) : undefined;
        const modules = cssModules(assets, base);

        if (base) this.addWatchFile(base);

        css.replace(id, modules);
        insertModuleImports(
          ast,
          magicString,
          modules.map(([publicId]) => `import ${JSON.stringify(publicId)};`)
        );

        return {
          code: magicString,
          ...(compiled.order
            ? { meta: mergeModuleBuildMeta(this.getModuleInfo(id)?.meta, { styleOrder: compiled.order }) }
            : {}),
        };
      },
    },
  };

  return Object.assign(plugin, { cssSource: css.source });
}

/** The stylesheets one owner imports: its runtime base stylesheet first, then each compiled output file. */
function cssModules(
  assets: ReadonlyMap<string, string>,
  base: string | undefined
): Array<readonly [id: string, source: string]> {
  const modules: Array<readonly [string, string]> = [];

  if (base) {
    const source = `@import ${JSON.stringify(toPosixPath(base))};`;

    modules.push([createVirtualCssId('base', 'base.css', source), source]);
  }

  for (const [fileName, source] of assets) modules.push([createVirtualCssId('asset', fileName, source), source]);

  return modules;
}

function escapeGlobPath(path: string): string {
  return path.replace(/[[\]{}()*?!]/g, '\\$&');
}
