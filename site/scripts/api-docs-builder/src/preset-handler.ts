/**
 * Preset reference extraction.
 *
 * Discovers presets from package.json exports in packages/{html,react}/ and extracts feature bundles, skins, and media
 * elements.
 *
 * Discovery:
 *
 * - Reads package.json exports to find preset names and their source paths
 * - Barrel file (./X export) → feature bundle name + file-level description
 * - Source directory (./X/* export) → skins + media elements via directory scan
 *
 * Classification (positive detection only):
 *
 * - HTML: classes with `static readonly tagName`
 *
 *   - _Skin_Element → skin
 *   - _Player_ → skip
 *   - Remaining → media element
 * - React: exported functions/classes/consts
 *
 *   - *Skin → skin
 *   - Remaining → media element
 * - .tailwind in filename → excluded (both frameworks)
 * - No HTML media element found → derived from the React media element when it wraps a native tag (Video → `video`, Audio
 *   → `audio`), so every preset framework pair reports the same default media
 *
 * Feature resolution: packages/core/src/dom/store/features/presets.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { parseSync } from 'oxc-parser';

import { featureDocsSlug } from './feature-handler.js';
import type { SourceFile } from './oxc-project.js';
import { getJSDocDescription, staticName, unwrapExpression } from './oxc-project.js';
import type { PresetFeatureRef, PresetReference, PresetSkinDef } from './types.js';

// ─── Types ──────────────────────────────────────────────────────────

interface PresetInfo {
  name: string;
  html?: {
    barrelPath: string;
    scanDir: string;
  };
  react?: {
    barrelPath: string;
    scanDir: string;
  };
}

export interface PresetResult {
  name: string;
  reference: PresetReference;
}

// ─── Package.json Discovery ─────────────────────────────────────────

/**
 * Resolve a dist output path back to its source path. Handles both real packages (dist/dev/... → src/...) and test
 * fixtures (src/... → src/..., already source paths).
 */
function distToSrc(distPath: string): string {
  // Real packages: dist/(dev|default)/foo/bar.js → src/foo/bar.ts
  const distMatch = distPath.match(/^\.\/dist\/(?:dev|default)\/(.+?)(?:\.d\.ts|\.js)$/);
  if (distMatch) return `./src/${distMatch[1]}.ts`;

  // Already a source path (test fixtures)
  return distPath;
}

/**
 * Extract the source file path from a package.json export value. Handles both conditional exports ({ types, default })
 * and string exports.
 */
function resolveExportPath(exportValue: unknown): string | undefined {
  if (typeof exportValue === 'string') return exportValue;

  if (typeof exportValue === 'object' && exportValue !== null) {
    const obj = exportValue as Record<string, unknown>;
    // Prefer types (points to source in some configs), fall back to default
    const raw = (obj.types ?? obj.default) as string | undefined;

    return raw;
  }

  return undefined;
}

/**
 * Discover presets from package.json exports for a single package. Returns a map of preset name → { barrelPath, scanDir
 * }.
 */
function discoverPresetsFromPackage(packageDir: string): Map<string, { barrelPath: string; scanDir: string }> {
  const pkgJsonPath = path.join(packageDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return new Map();

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  const exports: Record<string, unknown> = pkgJson.exports ?? {};

  const result = new Map<string, { barrelPath: string; scanDir: string }>();

  for (const key of Object.keys(exports)) {
    // Match ./name (not ./, not ./name/*, not ./name/*.css)
    const match = key.match(/^\.\/([a-z][a-z0-9-]*)$/);
    if (!match) continue;

    const name = match[1]!;

    // Must have a corresponding wildcard export
    const wildcardKey = `./${name}/*`;
    if (!(wildcardKey in exports)) continue;

    const barrelRaw = resolveExportPath(exports[key]);
    const wildcardRaw = resolveExportPath(exports[wildcardKey]);
    if (!barrelRaw || !wildcardRaw) continue;

    const barrelSrc = distToSrc(barrelRaw);
    const wildcardSrc = distToSrc(wildcardRaw);

    // Resolve barrel to absolute path
    const barrelPath = path.resolve(packageDir, barrelSrc);

    // Wildcard path ends with /*.ts — strip the wildcard to get the directory
    const scanDir = path.resolve(packageDir, wildcardSrc.replace(/\/\*\.ts$/, '').replace(/\/\*$/, ''));

    if (fs.existsSync(barrelPath) && fs.existsSync(scanDir)) {
      result.set(name, { barrelPath, scanDir });
    }
  }

  return result;
}

/** Discover all presets from both HTML and React packages. */
function discoverPresets(monorepoRoot: string): PresetInfo[] {
  const htmlPkgDir = path.join(monorepoRoot, 'packages/html');
  const reactPkgDir = path.join(monorepoRoot, 'packages/react');

  const htmlPresets = discoverPresetsFromPackage(htmlPkgDir);
  const reactPresets = discoverPresetsFromPackage(reactPkgDir);

  const allNames = new Set([...htmlPresets.keys(), ...reactPresets.keys()]);

  return [...allNames].sort().map((name) => {
    const info: PresetInfo = { name };
    const html = htmlPresets.get(name);
    const react = reactPresets.get(name);

    if (html) info.html = html;

    if (react) info.react = react;

    return info;
  });
}

// ─── Classification Helpers ─────────────────────────────────────────

function isFeatureBundle(name: string): boolean {
  return name.endsWith('Features');
}

function isTailwindFile(filePath: string): boolean {
  return path.basename(filePath).includes('.tailwind');
}

function isSkinClass(name: string): boolean {
  return /Skin.*Element/.test(name) || /Skin(Element)?$/.test(name);
}

function isPlayerClass(name: string): boolean {
  return /Player/.test(name);
}

function isReactSkin(name: string): boolean {
  return /Skin$/.test(name);
}

// ─── Tag Name Extraction ────────────────────────────────────────────

interface ClassWithTagName {
  className: string;
  tagName: string;
}

function extractClassesWithTagName(filePath: string, visited = new Set<string>()): ClassWithTagName[] {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute) || visited.has(absolute)) return [];

  visited.add(absolute);

  const content = fs.readFileSync(absolute, 'utf-8');
  const sourceFile = parseSource(absolute, content);
  const results: ClassWithTagName[] = [];
  const importedModules = new Map<string, string>();
  const sideEffectImports: string[] = [];
  const reexports: string[] = [];
  const registeredNames = new Set<string>();

  for (const node of sourceFile.program.body) {
    if (node.type === 'ImportDeclaration' && node.source.value.startsWith('.')) {
      const resolved = resolveModulePath(path.dirname(absolute), node.source.value);
      if (!resolved) continue;

      if (node.specifiers.length === 0) sideEffectImports.push(resolved);

      for (const specifier of node.specifiers) {
        importedModules.set(specifier.local.name, resolved);
      }

      continue;
    }

    if (node.type === 'ExportAllDeclaration' && !node.exported) {
      const specifier = node.source.value;
      const resolved = resolveModulePath(path.dirname(absolute), specifier);

      if (resolved) reexports.push(resolved);

      continue;
    }

    if (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression' &&
      node.expression.callee.type === 'Identifier' &&
      node.expression.callee.name === 'safeDefine' &&
      node.expression.arguments[0]?.type === 'Identifier'
    ) {
      registeredNames.add(node.expression.arguments[0].name);
      continue;
    }

    if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'ClassDeclaration') continue;

    const declaration = node.declaration;
    if (!declaration.id) continue;

    for (const member of declaration.body.body) {
      if (
        member.type === 'PropertyDefinition' &&
        staticName(member.key) === 'tagName' &&
        member.static &&
        member.value?.type === 'Literal' &&
        typeof member.value.value === 'string'
      ) {
        results.push({
          className: declaration.id.name,
          tagName: member.value.value,
        });
      }
    }
  }

  for (const name of registeredNames) {
    const imported = importedModules.get(name);

    if (imported) results.push(...extractClassesWithTagName(imported, visited));
  }

  for (const reexport of reexports) {
    results.push(...extractClassesWithTagName(reexport, visited));
  }

  if (registeredNames.size === 0) {
    for (const sideEffectImport of sideEffectImports) {
      results.push(...extractClassesWithTagName(sideEffectImport, visited));
    }
  }

  return results;
}

function resolveModulePath(dir: string, specifier: string): string | undefined {
  for (const ext of ['.ts', '.tsx']) {
    const candidate = path.join(dir, `${specifier}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }

  // Try index file in directory
  for (const ext of ['.ts', '.tsx']) {
    const candidate = path.join(dir, specifier, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }

  return undefined;
}

// ─── React Export Extraction ────────────────────────────────────────

function extractValueExports(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = parseSource(filePath, content);
  const names: string[] = [];

  for (const node of sourceFile.program.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.declaration) continue;

    if (node.declaration.type === 'VariableDeclaration') {
      for (const declaration of node.declaration.declarations) {
        const name = staticName(declaration.id);

        if (name) names.push(name);
      }
    } else if (node.declaration.type === 'FunctionDeclaration' || node.declaration.type === 'ClassDeclaration') {
      if (node.declaration.id) names.push(node.declaration.id.name);
    }
  }

  return names;
}

// ─── Barrel Parsing (feature bundle only) ───────────────────────────

/**
 * Parse named value export names from a barrel file. Only reads `export { X } from '...'` syntax — skips `export *`
 * since skins are discovered via directory scanning.
 */
function parseBarrelExportNames(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = parseSource(filePath, content);
  const names: string[] = [];

  for (const node of sourceFile.program.body) {
    if (node.type !== 'ExportNamedDeclaration' || !node.source || node.exportKind === 'type') continue;

    for (const element of node.specifiers) {
      if (element.exportKind === 'type') continue;

      names.push(element.exported.type === 'Literal' ? String(element.exported.value) : element.exported.name);
    }
  }

  return names;
}

function findFeatureBundleExport(filePath: string): string | undefined {
  return parseBarrelExportNames(filePath).find(isFeatureBundle);
}

/**
 * Find the media element from a React barrel's named exports. The media element is a named re-export that isn't a
 * feature bundle or skin.
 */
function findReactMediaElement(filePath: string): string | undefined {
  const names = parseBarrelExportNames(filePath);

  for (const name of names) {
    if (isFeatureBundle(name)) continue;

    if (isReactSkin(name)) continue;

    if (/Tailwind$/.test(name)) continue;

    return name;
  }

  return undefined;
}

// ─── Feature Bundle Resolution ──────────────────────────────────────

function featureReferenceExists(monorepoRoot: string, slug: string): boolean {
  const mdxPath = path.join(monorepoRoot, 'site/src/content/docs', `${slug}.mdx`);

  return fs.existsSync(mdxPath);
}

function resolveFeatureRef(name: string, monorepoRoot: string): PresetFeatureRef {
  const slug = featureDocsSlug(name);

  return { name, slug, hasReference: featureReferenceExists(monorepoRoot, slug) };
}

function parseFeatureBundles(presetsFilePath: string): Map<string, string[]> {
  const map = new Map<string, string[]>();

  if (!fs.existsSync(presetsFilePath)) return map;

  const content = fs.readFileSync(presetsFilePath, 'utf-8');
  const sourceFile = parseSource(presetsFilePath, content);

  for (const node of sourceFile.program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.declaration?.type !== 'VariableDeclaration') continue;

    for (const decl of node.declaration.declarations) {
      const name = staticName(decl.id);
      if (!name?.endsWith('Features') || !decl.init) continue;

      const initializer = unwrapExpression(decl.init);

      if (initializer.type === 'ArrayExpression') {
        const features: string[] = [];

        for (const element of initializer.elements) {
          if (element?.type === 'Identifier') {
            const featureName = element.name.replace(/Feature$/, '');

            features.push(featureName);
          }
        }

        map.set(name, features);
      }
    }
  }

  return map;
}

// ─── Description Extraction ─────────────────────────────────────────

function extractFileDescription(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;

  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = parseSource(filePath, content);

  const firstStatement = sourceFile.program.body[0];
  if (!firstStatement) return undefined;

  return getJSDocDescription(sourceFile, firstStatement);
}

function parseSource(filePath: string, source: string): SourceFile {
  const parsed = parseSync(filePath, source);

  return { filePath, source, program: parsed.program, comments: parsed.comments };
}

// ─── Directory Scanning ─────────────────────────────────────────────

function scanHtmlDirectory(scanDir: string): { skins: PresetSkinDef[]; mediaElement?: string } {
  const skins: PresetSkinDef[] = [];
  let mediaElement: string | undefined;

  if (!fs.existsSync(scanDir)) return { skins };

  const files = fs
    .readdirSync(scanDir)
    .filter((f) => f.endsWith('.ts') && !isTailwindFile(f) && f !== 'ui.ts' && f !== 'neutral-ui.ts');

  for (const file of files) {
    const filePath = path.join(scanDir, file);
    const classes = extractClassesWithTagName(filePath);

    for (const cls of classes) {
      if (isSkinClass(cls.className)) {
        skins.push({ name: cls.className, tagName: cls.tagName });
      } else if (!isPlayerClass(cls.className)) {
        mediaElement = cls.tagName;
      }
    }
  }

  return { skins, mediaElement };
}

function scanReactDirectory(scanDir: string, barrelPath: string, presetName: string): PresetSkinDef[] {
  const skins: PresetSkinDef[] = [];

  if (!fs.existsSync(scanDir)) return skins;

  const barrelBasename = path.basename(barrelPath);
  const files = fs
    .readdirSync(scanDir)
    .filter((f) => (f.endsWith('.ts') || f.endsWith('.tsx')) && !isTailwindFile(f) && f !== barrelBasename);

  for (const file of files) {
    const filePath = path.join(scanDir, file);
    const exports = extractValueExports(filePath);
    const basename = path.basename(file, path.extname(file));
    const cssFile = path.join(scanDir, `${basename}.css`);
    const cssImport = fs.existsSync(cssFile) ? `@videojs/react/${presetName}/${basename}.css` : undefined;

    for (const name of exports) {
      if (isFeatureBundle(name)) continue;

      if (isReactSkin(name)) {
        const skin: PresetSkinDef = { name };

        if (cssImport) skin.cssImport = cssImport;

        skins.push(skin);
      }
    }
  }

  return skins;
}

// ─── Preset Reference Building ──────────────────────────────────────

/**
 * React media components that render a native element rather than a custom element. The HTML directory scan can't see
 * these — there is no class with a `static tagName` for a plain `<video>` — so the native tag is derived from the React
 * barrel's media re-export instead.
 */
const NATIVE_MEDIA_TAGS: Record<string, string> = {
  Audio: 'audio',
  Video: 'video',
};

function buildPresetReference(
  preset: PresetInfo,
  featureBundleMap: Map<string, string[]>,
  monorepoRoot: string
): PresetResult | null {
  // Find feature bundle name from barrel files (try both frameworks)
  const bundleName =
    (preset.html && findFeatureBundleExport(preset.html.barrelPath)) ??
    (preset.react && findFeatureBundleExport(preset.react.barrelPath));
  if (!bundleName) return null;

  const featureNames = featureBundleMap.get(bundleName) ?? [];
  const features = featureNames.map((name) => resolveFeatureRef(name, monorepoRoot));

  // Scan HTML directory
  const htmlResult = preset.html ? scanHtmlDirectory(preset.html.scanDir) : { skins: [] as PresetSkinDef[] };

  // Scan React directory for skins, read barrel for media element
  const reactSkins = preset.react
    ? scanReactDirectory(preset.react.scanDir, preset.react.barrelPath, preset.name)
    : ([] as PresetSkinDef[]);
  const reactMediaElement = preset.react ? findReactMediaElement(preset.react.barrelPath) : undefined;

  // Extract description from barrel JSDoc (try React first, fall back to HTML)
  const description =
    (preset.react && extractFileDescription(preset.react.barrelPath)) ??
    (preset.html && extractFileDescription(preset.html.barrelPath));

  const ref: PresetReference = {
    name: preset.name,
    featureBundle: bundleName,
    features,
    html: { skins: htmlResult.skins },
    react: { skins: reactSkins, mediaElement: reactMediaElement ?? '' },
  };

  const htmlMediaElement = htmlResult.mediaElement ?? (reactMediaElement && NATIVE_MEDIA_TAGS[reactMediaElement]);

  if (preset.html && htmlMediaElement) ref.html.mediaElement = htmlMediaElement;

  if (description) ref.description = description;

  return { name: preset.name, reference: ref };
}

// ─── Pipeline ───────────────────────────────────────────────────────

export function generatePresetReferences(monorepoRoot: string): PresetResult[] {
  const presetsFilePath = path.join(monorepoRoot, 'packages/core/src/dom/store/features/presets.ts');
  const featureBundleMap = parseFeatureBundles(presetsFilePath);

  const presets = discoverPresets(monorepoRoot);
  if (presets.length === 0) return [];

  const results: PresetResult[] = [];

  for (const preset of presets) {
    const result = buildPresetReference(preset, featureBundleMap, monorepoRoot);

    if (result) results.push(result);
  }

  return results;
}
