import type { Program } from '@oxc-project/types';
import { isFunction, isNumber, isString } from '@videojs/utils/predicate';
import MagicString from 'magic-string';
import type { ModuleType, Plugin, RolldownMagicString, TransformPluginContext, TransformResult } from 'rolldown';

import { moduleFilename, SCRIPT_MODULE_ID, scriptModuleType } from '../utils/module-id';

/** Module types the parser reads; a stylesheet or asset reaches a transform without an AST. */
const SCRIPT_MODULE_TYPES: ReadonlySet<ModuleType> = new Set(['js', 'jsx', 'ts', 'tsx']);

interface RolldownTransformOptions {
  readonly moduleType: ModuleType;
  readonly ssr?: boolean | undefined;
  /** Present for script modules only. */
  readonly ast: Program | undefined;
  readonly magicString: RolldownMagicString;
}

interface ViteTransformOptions {
  readonly moduleType: ModuleType;
  readonly ssr?: boolean | undefined;
}

interface PositionedError extends Error {
  readonly pos: number;
}

type RolldownTransformHandler = (
  this: TransformPluginContext,
  code: string,
  id: string,
  options: RolldownTransformOptions
) => TransformResult | Promise<TransformResult>;

export type VitePlugin = Plugin & { readonly enforce?: 'pre' | 'post' | undefined };

/**
 * The AST of each module's latest source. Vite gives every plugin source text only, and most VJSC passes leave a given
 * module unchanged, so the next pass reuses the tree instead of parsing identical code again. Passes read the tree and
 * edit through `magicString`, so a shared tree stays accurate for its source. Bounded because a development server
 * never says when it is done with a module.
 */
const parsedModules = new Map<string, { readonly code: string; readonly ast: Program }>();
const PARSED_MODULE_LIMIT = 64;

export type ViteOxcPlugin = VitePlugin & { readonly enforce: 'pre' };

/** Adapt a transform that consumes Rolldown's AST metadata to Vite's transform contract. */
export function viteOxcPlugin(plugin: Plugin): ViteOxcPlugin {
  const transform = plugin.transform;
  if (!transform) return { ...plugin, enforce: 'pre' };

  const handler = (isFunction(transform) ? transform : transform.handler) as RolldownTransformHandler;

  const wrapped = async function (
    this: TransformPluginContext,
    code: string,
    id: string,
    options?: ViteTransformOptions
  ): Promise<TransformResult> {
    const filename = moduleFilename(id);
    const moduleType = options?.moduleType ?? scriptModuleType(filename);
    const magicString = new MagicString(code, { filename });
    // A transform filtered to stylesheets, as the graph plugin's is for its virtual styles, receives CSS here; parsing
    // that as a script fails the build. The id check covers hosts that pass no module type and would fall back to `js`.
    const ast =
      SCRIPT_MODULE_TYPES.has(moduleType) && SCRIPT_MODULE_ID.test(id)
        ? parseModule(this, id, code, parserLanguage(moduleType, filename))
        : undefined;

    let result: TransformResult;

    try {
      result = await handler.call(this, code, id, {
        ...options,
        moduleType,
        ast,
        magicString: magicString as unknown as RolldownMagicString,
      });
    } catch (error) {
      if (isPositionedError(error)) this.error(error, error.pos);

      throw error;
    }

    if (!result || isString(result) || result.code === undefined || isString(result.code)) {
      return result;
    }

    return {
      ...result,
      code: result.code.toString(),
      map:
        result.map ??
        magicString
          .generateMap({
            hires: true,
            includeContent: true,
            source: filename,
          })
          .toString(),
    };
  };

  return {
    ...plugin,
    enforce: 'pre',
    transform: isFunction(transform) ? wrapped : { ...transform, handler: wrapped },
  };
}

function parseModule(
  context: TransformPluginContext,
  id: string,
  code: string,
  lang: ReturnType<typeof parserLanguage>
): Program {
  const key = `${lang}\0${id}`;
  const cached = parsedModules.get(key);
  if (cached?.code === code) return cached.ast;

  const ast = context.parse(code, { lang });

  parsedModules.delete(key);
  parsedModules.set(key, { code, ast });

  for (const oldest of parsedModules.keys()) {
    if (parsedModules.size <= PARSED_MODULE_LIMIT) break;

    parsedModules.delete(oldest);
  }

  return ast;
}

function isPositionedError(error: unknown): error is PositionedError {
  return error instanceof Error && 'pos' in error && isNumber(error.pos);
}

function parserLanguage(moduleType: ModuleType, filename: string): 'js' | 'jsx' | 'ts' | 'tsx' | 'dts' {
  if (/\.d\.(?:ts|mts|cts)$/.test(filename)) return 'dts';

  if (moduleType === 'jsx') return 'jsx';

  if (moduleType === 'ts') return 'ts';

  if (moduleType === 'tsx') return 'tsx';

  return scriptModuleType(filename);
}
