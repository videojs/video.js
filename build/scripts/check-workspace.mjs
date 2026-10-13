/**
 * Workspace consistency checker.
 *
 * Validates that manually-maintained lists across config files stay in sync with the actual package structure. Run via
 * `pnpm check:workspace`.
 *
 * Checks CI test coverage, commitlint scopes, root tsconfig references, package metadata, release configuration,
 * bundled docs, relative side-effect imports, i18n locales, agent context, internal records, and optional mise tool
 * pins.
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  discoverWorkspacePackages,
  isMainCiTestPackage,
  SPECIAL_TEST_PACKAGES,
} from '../../.github/scripts/package-test-matrix.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PACKAGES_DIR = join(ROOT, 'packages');

// ── Helpers ─────────────────────────────────────────────────────────────────

function readText(path) {
  return readFileSync(path, 'utf8');
}

function readJson(path) {
  const text = readText(path);
  // Strip single-line // comments (for tsconfig files).
  const stripped = text.replace(/^\s*\/\/.*$/gm, '');

  return JSON.parse(stripped);
}

/**
 * Lists package directories relative to `packages/`, e.g. `core` or `adapters/mux-video`. A direct child without a
 * package.json is treated as a bucket and its children are listed instead.
 */
function getPackageDirs() {
  const dirs = [];

  for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    if (existsSync(join(PACKAGES_DIR, entry.name, 'package.json'))) {
      dirs.push(entry.name);
      continue;
    }

    for (const child of readdirSync(join(PACKAGES_DIR, entry.name), { withFileTypes: true })) {
      if (child.isDirectory() && existsSync(join(PACKAGES_DIR, entry.name, child.name, 'package.json'))) {
        dirs.push(`${entry.name}/${child.name}`);
      }
    }
  }

  return dirs;
}

/** The package's own directory name, without any bucket prefix. */
function packageDirName(dir) {
  return dir.slice(dir.lastIndexOf('/') + 1);
}

function readPackageJson(dir) {
  return readJson(join(PACKAGES_DIR, dir, 'package.json'));
}

// ── Check 1: CI test coverage ───────────────────────────────────────────────

function checkCiTestCoverage() {
  const warnings = [];
  const ciText = readText(join(ROOT, '.github/workflows/ci.yml'));
  const testedInCi = new Set();
  const hasDynamicPackageTests =
    ciText.includes('node .github/scripts/package-test-matrix.js') &&
    ciText.includes('matrix.packages') &&
    ciText.includes('test:ci');

  if (hasDynamicPackageTests) {
    for (const pkg of discoverWorkspacePackages(ROOT)) {
      if (isMainCiTestPackage(pkg) && !SPECIAL_TEST_PACKAGES.has(pkg.name)) testedInCi.add(pkg.name);
    }
  }

  // Collect package names from standalone test jobs (e.g. test-spf).
  // Match: `vp run @videojs/xxx#test` commands.
  for (const m of ciText.matchAll(/vp run (@videojs\/[^#\s]+)#test/g)) {
    testedInCi.add(m[1]);
  }

  // Find packages that have a "test" script but aren't tested in CI.
  for (const dir of getPackageDirs()) {
    const pkg = readPackageJson(dir);
    if (!pkg.scripts?.test) continue;

    if (!testedInCi.has(pkg.name)) {
      warnings.push(`${pkg.name} has a "test" script but is not tested in CI`);
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 2: Commitlint scope-enum ──────────────────────────────────────────

/** Known aliases where the commit scope differs from the directory name. Key: directory name, Value: expected scope. */
const SCOPE_ALIASES = new Map([['skins', 'skin']]);

function checkCommitlintScopes() {
  const warnings = [];
  const text = readText(join(ROOT, 'commitlint.config.js'));

  // Extract the array from scope-enum rule.
  const match = text.match(/scope-enum[^[]*\[([^\]]+)\]/s);
  if (!match) return { ok: false, warnings: ['Could not parse scope-enum from commitlint.config.js'] };

  const scopes = new Set([...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));

  for (const dir of getPackageDirs()) {
    const name = packageDirName(dir);
    const scope = SCOPE_ALIASES.get(name) ?? name;

    if (!scopes.has(scope)) {
      warnings.push(`Package dir "${dir}" missing from commitlint scope-enum (expected scope: "${scope}")`);
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 3: Root tsconfig references ───────────────────────────────────────

/**
 * Intentionally excluded from root references. packages/icons: private, custom build script, uses outDir/rootDir
 * instead of declarationDir.
 */
const TSCONFIG_EXCLUDE = new Set(['packages/icons']);

function checkTsconfigReferences() {
  const warnings = [];
  const rootTsconfig = readJson(join(ROOT, 'tsconfig.json'));
  const baseTsconfig = readJson(join(ROOT, 'tsconfig.base.json'));

  const referenced = new Set(rootTsconfig.references.map((r) => r.path));

  // Base config sets composite: true, so all extending configs inherit it.
  const baseComposite = baseTsconfig.compilerOptions?.composite === true;

  // Find all tsconfig.json files under packages/ recursively.
  function findTsconfigs(dir, results = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'types') {
        continue;
      }

      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        findTsconfigs(full, results);
      } else if (entry.name === 'tsconfig.json') {
        results.push(full);
      }
    }

    return results;
  }

  for (const tsconfigPath of findTsconfigs(PACKAGES_DIR)) {
    const relative = tsconfigPath.slice(ROOT.length + 1).replace(/\/tsconfig\.json$/, '');
    if (TSCONFIG_EXCLUDE.has(relative)) continue;

    const tsconfig = readJson(tsconfigPath);
    const explicitComposite = tsconfig.compilerOptions?.composite;

    // Composite if explicitly true, or inherited from base and not overridden.
    const isComposite = explicitComposite === true || (explicitComposite === undefined && baseComposite);
    if (!isComposite) continue;

    if (!referenced.has(relative)) {
      warnings.push(`Missing reference: ${relative}`);
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 4: Package metadata ───────────────────────────────────────────────

/** Required on all non-private packages. */
const REQUIRED_FIELDS = ['sideEffects', 'files', 'exports'];

/** Required only when the package has a root "." export. */
const ROOT_EXPORT_FIELDS = ['main', 'module', 'types'];

/** The only package that publishes an executable. It is bin-only, so library fields don't apply. */
const CLI_PACKAGE_DIR = 'cli';

/**
 * `npx @videojs/cli` runs the package's only bin, which installs globally as `videojs`, and every cold run downloads
 * its dependencies, so the CLI stays one bundled file with no runtime dependencies.
 */
function cliMetadataWarnings(pkg) {
  const warnings = [];

  if (
    JSON.stringify(Object.keys(pkg.bin ?? {})) !== JSON.stringify(['videojs']) ||
    typeof pkg.bin.videojs !== 'string'
  ) {
    warnings.push(`${pkg.name}: "bin" should be { "videojs": "<path>" } so \`npx ${pkg.name}\` runs its only command`);
  }

  if (JSON.stringify(pkg.files) !== JSON.stringify(['dist'])) {
    warnings.push(`${pkg.name}: "files" should be ["dist"]`);
  }

  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    if (Object.keys(pkg[field] ?? {}).length > 0) {
      warnings.push(`${pkg.name}: "${field}" should be empty; bundle workspace code into the bin instead`);
    }
  }

  return warnings;
}

function checkPackageMetadata() {
  const warnings = [];

  for (const dir of getPackageDirs()) {
    const pkg = readPackageJson(dir);
    // Skip private packages — they're internal.
    if (pkg.private) continue;

    if (pkg.publishConfig?.access !== 'public') {
      warnings.push(`${pkg.name}: missing publishConfig.access = "public"`);
    }

    if (dir === CLI_PACKAGE_DIR) {
      warnings.push(...cliMetadataWarnings(pkg));
      continue;
    }

    if (pkg.bin !== undefined) {
      warnings.push(`${pkg.name}: remove "bin"; command line tools ship in @videojs/cli`);
    }

    for (const field of REQUIRED_FIELDS) {
      if (pkg[field] === undefined) {
        warnings.push(`${pkg.name}: missing "${field}"`);
      }
    }

    // main/module/types only required when there's a root "." export.
    const hasRootExport = pkg.exports?.['.'] !== undefined;

    if (hasRootExport) {
      for (const field of ROOT_EXPORT_FIELDS) {
        if (pkg[field] === undefined) {
          warnings.push(`${pkg.name}: missing "${field}" (has "." export)`);
        }
      }
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 5: Release-please config ──────────────────────────────────────────

function checkReleasePleaseConfig() {
  const warnings = [];
  const config = readJson(join(ROOT, '.github/release-please/release-please-config.json'));

  const configPackages = new Set(Object.keys(config.packages));
  const linkedVersions = config.plugins.find((p) => p.type === 'linked-versions');
  const components = new Set(linkedVersions?.components ?? []);

  // Every publishable package with a version field should be registered.
  for (const dir of getPackageDirs()) {
    const pkg = readPackageJson(dir);
    if (pkg.private || !pkg.version) continue;

    const pkgPath = `packages/${dir}`;

    if (!configPackages.has(pkgPath)) {
      warnings.push(`${pkg.name}: missing from release-please packages`);
    }

    if (!components.has(pkg.name)) {
      warnings.push(`${pkg.name}: missing from release-please linked-versions components`);
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 6: Bundled docs publishing ─────────────────────────────────────────

/**
 * `@videojs/html` and `@videojs/react` ship the per-framework markdown docs subtree inside their tarballs (see
 * `site/scripts/copy-package-docs.ts`). Both wires (the `files[]` entry and the `prepack` script) must stay in sync —
 * without one, publishing silently drops the docs.
 */
function checkBundledDocs() {
  const warnings = [];

  for (const dir of ['html', 'react']) {
    const pkg = readPackageJson(dir);

    if (!pkg.files?.includes('docs')) {
      warnings.push(`${pkg.name}: missing "docs" entry in "files" — bundled docs would not ship`);
    }

    const prepack = pkg.scripts?.prepack;
    const expected = `node --import tsx ../../site/scripts/copy-package-docs.ts ${dir}`;

    if (prepack !== expected) {
      warnings.push(`${pkg.name}: prepack script should be \`${expected}\` (got: ${prepack ?? 'missing'})`);
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 8: Define imports ──────────────────────────────────────────────────

/**
 * Preset and UI define modules are side-effect-only registration entrypoints. Media and extension define modules retain
 * their existing element exports for compatibility. Bare side-effect imports from relative paths can cause
 * non-deterministic registration order when loaded as native ESM in the browser, so registration must go through
 * explicit safeDefine() calls.
 */
function checkDefineImports() {
  const warnings = [];
  const defineDir = join(PACKAGES_DIR, 'html/src/define');
  if (!existsSync(defineDir)) return { ok: true, warnings: [] };

  // Matches: import './foo';  import "../bar";  import './foo/bar';
  // Ignores value imports: import { X } from './foo';  import X from './foo';
  // Ignores CSS imports: import './foo.css';  import './foo.css?inline';
  const sideEffectImportRe = /^import\s+['"](\.[^'"]+)['"]\s*;/gm;
  const cssSpecifierRe = /\.css(?:\?|$)/;

  function findTsFiles(dir, results = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'tests') continue;

      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        findTsFiles(full, results);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        results.push(full);
      }
    }

    return results;
  }

  for (const filePath of findTsFiles(defineDir)) {
    const content = readText(filePath);
    const relative = filePath.slice(ROOT.length + 1);

    const exportsElement =
      relative.startsWith('packages/html/src/define/media/') ||
      relative.startsWith('packages/html/src/define/extensions/');

    if (!exportsElement && /^\s*export\b/m.test(content)) {
      warnings.push(`${relative}: define modules are registration-only and must not export values or types`);
    }

    const sideEffects = [];

    for (const match of content.matchAll(sideEffectImportRe)) {
      const specifier = match[1];
      if (cssSpecifierRe.test(specifier)) continue;

      sideEffects.push(specifier);
    }

    // A single side-effect import (e.g. skin importing its ui module) is safe
    // because ESM evaluates it synchronously before the importing module's body.
    // Multiple side-effect imports are the problem — they race in the browser.
    if (sideEffects.length > 1) {
      for (const specifier of sideEffects) {
        warnings.push(`${relative}: bare side-effect import "${specifier}" — use safeDefine() instead`);
      }
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 8: i18n locale consistency ─────────────────────────────────────────

const GENERATED_I18N_HEADER = '/** Generated by packages/core/scripts/generate-i18n-locales.ts — do not edit. */';

function parseLocaleTagArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return undefined;

  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function localeAliases(tags) {
  const counts = new Map();

  for (const tag of tags) {
    if (!tag.includes('-')) continue;

    const lang = tag.split('-')[0];

    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }

  return [...counts].filter(([, count]) => count > 1).map(([lang]) => lang);
}

function checkI18nLocales() {
  const warnings = [];
  const builtInPath = join(PACKAGES_DIR, 'core/src/core/i18n/locales.ts');
  const builtInSource = readText(builtInPath);
  const locales = parseLocaleTagArray(builtInSource, 'LOCALES');

  if (locales === undefined) {
    warnings.push('Could not parse LOCALES from packages/core/src/core/i18n/locales.ts');
    return { ok: false, warnings };
  }

  const localeFiles = [...locales, ...localeAliases(locales)];

  const coreLocalesDir = join(PACKAGES_DIR, 'core/src/core/i18n/locales');

  if (!existsSync(coreLocalesDir)) {
    warnings.push('Missing generated locale directory packages/core/src/core/i18n/locales');
    return { ok: false, warnings };
  }

  const coreFiles = readdirSync(coreLocalesDir)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.slice(0, -3));

  const expectedCore = new Set(['all', 'en', ...localeFiles]);

  for (const tag of localeFiles) {
    if (!coreFiles.includes(tag)) {
      warnings.push(`LOCALES tag "${tag}" has no packages/core/src/core/i18n/locales/${tag}.ts`);
    }
  }

  for (const file of coreFiles) {
    if (!expectedCore.has(file)) {
      warnings.push(`Unexpected locale file packages/core/src/core/i18n/locales/${file}.ts (not in locales.ts)`);
    }
  }

  const allPath = join(coreLocalesDir, 'all.ts');

  if (!existsSync(allPath)) {
    warnings.push('Missing generated locale bundle packages/core/src/core/i18n/locales/all.ts');
  } else if (!readText(allPath).startsWith(GENERATED_I18N_HEADER)) {
    warnings.push(
      'packages/core/src/core/i18n/locales/all.ts is not generated — run pnpm -F @videojs/core generate:locales'
    );
  }

  const loadLocalePath = join(PACKAGES_DIR, 'core/src/core/i18n/load-locale.ts');

  if (!existsSync(loadLocalePath)) {
    warnings.push('Missing generated locale loader packages/core/src/core/i18n/load-locale.ts');
  } else {
    const loadLocaleSource = readText(loadLocalePath);

    if (!loadLocaleSource.startsWith(GENERATED_I18N_HEADER)) {
      warnings.push(
        'packages/core/src/core/i18n/load-locale.ts is not generated — run pnpm -F @videojs/core generate:locales'
      );
    } else {
      const loaderTags = new Set(
        [...loadLocaleSource.matchAll(/import\('\.\/locales\/([^']+)'\)/g)].map((match) => match[1])
      );

      for (const tag of localeFiles) {
        if (!loaderTags.delete(tag)) {
          warnings.push(`LOCALES tag "${tag}" has no lazy importer in packages/core/src/core/i18n/load-locale.ts`);
        }
      }

      for (const tag of loaderTags) {
        warnings.push(`Unexpected lazy importer packages/core/src/core/i18n/load-locale.ts for "${tag}"`);
      }
    }
  }

  for (const pkg of ['html', 'react']) {
    const localesDir = join(PACKAGES_DIR, `${pkg}/src/i18n/locales`);
    const expectedPlatform = new Set(['all', 'en', ...localeFiles]);

    if (!existsSync(localesDir)) {
      warnings.push(`Missing generated re-export directory packages/${pkg}/src/i18n/locales`);
      continue;
    }

    for (const tag of expectedPlatform) {
      const filePath = join(localesDir, `${tag}.ts`);

      if (!existsSync(filePath)) {
        warnings.push(`Missing generated re-export packages/${pkg}/src/i18n/locales/${tag}.ts`);
        continue;
      }

      if (!readText(filePath).startsWith(GENERATED_I18N_HEADER)) {
        warnings.push(
          `packages/${pkg}/src/i18n/locales/${tag}.ts is not generated — run pnpm -F @videojs/core generate:locales`
        );
      }
    }

    for (const file of readdirSync(localesDir)) {
      if (!file.endsWith('.ts')) continue;

      const tag = file.slice(0, -3);

      if (!expectedPlatform.has(tag)) {
        warnings.push(`Unexpected locale re-export packages/${pkg}/src/i18n/locales/${file}`);
      }
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 9: Agent context consistency ─────────────────────────────────────

// These are conservative repository budgets, below the host-level ceilings.
// Token counts are estimates using four UTF-8 bytes per token; the byte limit
// is the enforceable value and avoids adding a tokenizer dependency.
const AGENT_DOC_MAX_LINES = 200;
const AGENT_DOC_MAX_BYTES = 12_000;
const AGENT_CHAIN_MAX_BYTES = 24_000;

const SKILL_MAX_LINES = 200;
const SKILL_MAX_BYTES = 10_000;

const SKILL_RESOURCE_MAX_LINES = 500;
const SKILL_RESOURCE_MAX_BYTES = 20_000;

const RESTORED_SPF_RESOURCE_MAX_LINES = 1_200;
const RESTORED_SPF_RESOURCE_MAX_BYTES = 60_000;

const SKILL_METADATA_MAX_BYTES = 6_000;

const RESTORED_SPF_SKILLS = new Set([
  'change-spf-behavior',
  'create-spf-behavior',
  'document-spf-feature',
  'document-spf-use-case',
  'implement-spf-feature',
  'implement-spf-use-case',
]);
const PORTABLE_SKILL_FIELDS = new Set(['name', 'description']);
const SKILL_ACTIONS = new Set([
  'build',
  'change',
  'commit',
  'configure',
  'create',
  'design',
  'document',
  'implement',
  'investigate',
  'maintain',
  'migrate',
  'review',
  'transform',
  'write',
]);

function lineCount(text) {
  return text === '' ? 0 : text.split(/\r?\n/).length;
}

function estimatedTokens(bytes) {
  return Math.ceil(bytes / 4);
}

function relativePath(path) {
  return path.slice(ROOT.length + 1);
}

function listFiles(dir, predicate, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.agents', '.opencode', 'node_modules', 'dist', 'coverage'].includes(entry.name)) {
      continue;
    }

    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      listFiles(full, predicate, results);
    } else if (predicate(full)) {
      results.push(full);
    }
  }

  return results;
}

function checkFileBudget(path, maxLines, maxBytes, warnings) {
  const source = readText(path);
  const lines = lineCount(source);
  const bytes = Buffer.byteLength(source);
  const relative = relativePath(path);

  if (lines > maxLines) {
    warnings.push(`${relative}: ${lines} lines exceeds ${maxLines}`);
  }

  if (bytes > maxBytes) {
    warnings.push(
      `${relative}: ~${estimatedTokens(bytes)} tokens (${bytes} bytes) exceeds ~${estimatedTokens(maxBytes)} tokens`
    );
  }
}

function checkAgentContext() {
  const warnings = [];
  const agentDocs = listFiles(ROOT, (path) => path.endsWith('/AGENTS.md'));
  const claudeDocs = listFiles(ROOT, (path) => path.endsWith('/CLAUDE.md'));
  const gitignoreRules = new Set(
    readText(join(ROOT, '.gitignore'))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
  );

  for (const rule of ['/.claude/skills', '/.claude/plans', '/.opencode']) {
    if (!gitignoreRules.has(rule)) {
      warnings.push(`.gitignore: missing generated agent path ${rule}`);
    }
  }

  for (const rule of ['/.agents/skills', '/.agents/skills/', '.agents/skills', '.agents/skills/']) {
    if (gitignoreRules.has(rule)) {
      warnings.push(`.gitignore: canonical .agents/skills catalog must not be ignored by ${rule}`);
    }
  }

  if (!agentDocs.includes(join(ROOT, 'AGENTS.md'))) {
    warnings.push('Missing canonical root AGENTS.md');
  }

  for (const path of agentDocs) {
    checkFileBudget(path, AGENT_DOC_MAX_LINES, AGENT_DOC_MAX_BYTES, warnings);

    const directory = dirname(path);
    const chainBytes = agentDocs
      .filter((candidate) => {
        const candidateDirectory = dirname(candidate);

        return directory === candidateDirectory || directory.startsWith(`${candidateDirectory}${sep}`);
      })
      .reduce((total, candidate) => total + Buffer.byteLength(readText(candidate)), 0);

    if (chainBytes > AGENT_CHAIN_MAX_BYTES) {
      warnings.push(
        `${relativePath(path)} chain: ~${estimatedTokens(chainBytes)} tokens (${chainBytes} bytes) exceeds ` +
          `~${estimatedTokens(AGENT_CHAIN_MAX_BYTES)} tokens`
      );
    }
  }

  for (const path of claudeDocs) {
    const siblingAgents = join(dirname(path), 'AGENTS.md');
    const relative = relativePath(path);

    if (!existsSync(siblingAgents)) {
      warnings.push(`${relative}: missing sibling AGENTS.md`);
    }

    if (readText(path).trim() !== '@AGENTS.md') {
      warnings.push(`${relative}: must contain only \`@AGENTS.md\` to avoid duplicated instructions`);
    }
  }

  const agentsDir = join(ROOT, '.agents');
  const skillsDir = join(agentsDir, 'skills');

  for (const alias of [join(ROOT, '.claude/skills'), join(ROOT, '.opencode/skills')]) {
    if (!existsSync(alias)) {
      warnings.push(`${relativePath(alias)}: missing compatibility alias to skills`);
    } else if (realpathSync(alias) !== realpathSync(skillsDir)) {
      warnings.push(`${relativePath(alias)}: must resolve to skills`);
    }
  }

  const plansDir = join(agentsDir, 'plans');
  const claudePlans = join(ROOT, '.claude/plans');

  if (!existsSync(claudePlans)) {
    warnings.push('.claude/plans: missing compatibility alias to .agents/plans');
  } else if (realpathSync(claudePlans) !== realpathSync(plansDir)) {
    warnings.push('.claude/plans: must resolve to .agents/plans');
  }

  const canonicalSkillDirs = [];
  const skillNames = new Set();

  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      warnings.push(`.agents/skills/${entry.name}: only skill directories are allowed at the catalog root`);
      continue;
    }

    const skillDir = join(skillsDir, entry.name);

    if (!existsSync(join(skillDir, 'SKILL.md'))) {
      warnings.push(`.agents/skills/${entry.name}: missing SKILL.md`);
      continue;
    }

    skillNames.add(entry.name);
    canonicalSkillDirs.push(skillDir);
  }

  const canonicalSkillFiles = new Set(canonicalSkillDirs.map((dir) => join(dir, 'SKILL.md')));

  for (const path of listFiles(skillsDir, (path) => path.endsWith('/SKILL.md'))) {
    if (!canonicalSkillFiles.has(path)) {
      warnings.push(`${relativePath(path)}: skills must be direct children of .agents/skills/`);
    }
  }

  const skillFiles = canonicalSkillDirs.map((dir) => join(dir, 'SKILL.md'));
  let metadataBytes = 0;

  for (const path of skillFiles) {
    checkFileBudget(path, SKILL_MAX_LINES, SKILL_MAX_BYTES, warnings);
    const source = readText(path);
    const relative = relativePath(path);
    const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

    if (!frontmatterMatch) {
      warnings.push(`${relative}: missing YAML frontmatter`);
      continue;
    }

    const frontmatter = frontmatterMatch[1];

    metadataBytes += Buffer.byteLength(frontmatter);
    const fields = [...frontmatter.matchAll(/^([A-Za-z][A-Za-z0-9-]*):/gm)].map((match) => match[1]);

    for (const field of fields) {
      if (!PORTABLE_SKILL_FIELDS.has(field)) {
        warnings.push(`${relative}: non-portable frontmatter field "${field}"`);
      }
    }

    const name = frontmatter
      .match(/^name:\s*([^\r\n]+)$/m)?.[1]
      .trim()
      .replace(/^['"]|['"]$/g, '');
    const directoryName = relative.split('/').at(-2);

    if (!name) {
      warnings.push(`${relative}: missing skill name`);
    } else if (name !== directoryName) {
      warnings.push(`${relative}: name "${name}" must match directory "${directoryName}"`);
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
      warnings.push(`${relative}: invalid Agent Skills name "${name}"`);
    } else if (!SKILL_ACTIONS.has(name.split('-')[0])) {
      warnings.push(`${relative}: skill name "${name}" must start with a clear action verb`);
    }

    const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1].trim();

    if (!description) {
      warnings.push(`${relative}: missing skill description`);
    } else if (description.length > 1024 || !/\bUse (?:for|when)\b/.test(description)) {
      warnings.push(`${relative}: description must concisely say what the skill does and when to use it`);
    }

    if (!/^## Example\r?$/m.test(source) || !/^Input: /m.test(source) || !/^Output: /m.test(source)) {
      warnings.push(`${relative}: include one compact Example with Input and Output`);
    }
  }

  if (metadataBytes > SKILL_METADATA_MAX_BYTES) {
    warnings.push(
      `.agents/skills metadata: ~${estimatedTokens(metadataBytes)} tokens (${metadataBytes} bytes) exceeds ` +
        `~${estimatedTokens(SKILL_METADATA_MAX_BYTES)} tokens`
    );
  }

  for (const skillDir of canonicalSkillDirs) {
    const owner = relativePath(skillDir).split('/').at(-1);
    const restoredSpfWorkflow = RESTORED_SPF_SKILLS.has(owner);
    const resourceMaxLines = restoredSpfWorkflow ? RESTORED_SPF_RESOURCE_MAX_LINES : SKILL_RESOURCE_MAX_LINES;
    const resourceMaxBytes = restoredSpfWorkflow ? RESTORED_SPF_RESOURCE_MAX_BYTES : SKILL_RESOURCE_MAX_BYTES;

    for (const path of listFiles(skillDir, (path) => path.endsWith('.md') && !path.endsWith('/SKILL.md'))) {
      checkFileBudget(path, resourceMaxLines, resourceMaxBytes, warnings);
    }

    for (const path of listFiles(skillDir, (path) => path.endsWith('.md'))) {
      const source = readText(path);

      for (const name of skillNames) {
        if (name !== owner && source.includes(`\`${name}\``)) {
          warnings.push(`${relativePath(path)}: must not explicitly load or route to sibling skill "${name}"`);
        }
      }
    }
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 10: Internal record consistency ──────────────────────────────────

const DESIGN_STATUSES = new Set(['draft', 'decided', 'active', 'partial', 'implemented', 'superseded', 'reference']);
const INTERNAL_RECORD_MAX_LINES = 160;
const RESTORED_SPF_RECORD_MAX_LINES = 1_000;

function recordFrontmatter(path, warnings) {
  const relative = relativePath(path);
  const match = readText(path).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) {
    warnings.push(`${relative}: missing YAML frontmatter`);
    return undefined;
  }

  return Object.fromEntries(
    [...match[1].matchAll(/^([A-Za-z][A-Za-z0-9-]*):\s*(.*?)\s*$/gm)].map((field) => [field[1], field[2]])
  );
}

function checkLocalMarkdownLinks(path, warnings) {
  const source = readText(path);

  for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();

    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);

    if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;

    target = target
      .split(/\s+["']/)[0]
      .split('#')[0]
      .split('?')[0];

    if (!target) continue;

    try {
      target = decodeURIComponent(target);
    } catch {
      warnings.push(`${relativePath(path)}: invalid encoded Markdown link "${match[1]}"`);
      continue;
    }

    const resolved = target.startsWith('/') ? join(ROOT, target.slice(1)) : resolve(dirname(path), target);

    if (!existsSync(resolved)) {
      warnings.push(`${relativePath(path)}: broken local Markdown link "${match[1]}"`);
    }
  }
}

function checkInternalRecords() {
  const warnings = [];
  const designDir = join(ROOT, 'internal/design');
  const designReadme = join(designDir, 'README.md');

  for (const entry of readdirSync(designDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md') && join(designDir, entry.name) !== designReadme) {
      warnings.push(`internal/design/${entry.name}: place design records in an area directory`);
    }
  }

  for (const path of listFiles(designDir, (path) => path.endsWith('.md'))) {
    if (path === designReadme) continue;

    const recordMaxLines = path.startsWith(`${join(designDir, 'spf')}${sep}`)
      ? RESTORED_SPF_RECORD_MAX_LINES
      : INTERNAL_RECORD_MAX_LINES;

    checkFileBudget(path, recordMaxLines, Number.POSITIVE_INFINITY, warnings);
    checkLocalMarkdownLinks(path, warnings);
    const frontmatter = recordFrontmatter(path, warnings);
    if (!frontmatter) continue;

    if (!DESIGN_STATUSES.has(frontmatter.status)) {
      warnings.push(`${relativePath(path)}: unknown design status "${frontmatter.status ?? 'missing'}"`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.date ?? '')) {
      warnings.push(`${relativePath(path)}: date must use YYYY-MM-DD`);
    }
  }

  const decisionsDir = join(ROOT, 'internal/decisions');
  const decisionsReadme = join(decisionsDir, 'README.md');

  for (const entry of readdirSync(decisionsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md') && join(decisionsDir, entry.name) !== decisionsReadme) {
      warnings.push(`internal/decisions/${entry.name}: place decision records in an area directory`);
    }
  }

  for (const path of listFiles(decisionsDir, (path) => path.endsWith('.md') && !path.endsWith('/README.md'))) {
    const recordMaxLines = path.startsWith(`${join(decisionsDir, 'spf')}${sep}`)
      ? RESTORED_SPF_RECORD_MAX_LINES
      : INTERNAL_RECORD_MAX_LINES;

    checkFileBudget(path, recordMaxLines, Number.POSITIVE_INFINITY, warnings);
    checkLocalMarkdownLinks(path, warnings);
    const frontmatter = recordFrontmatter(path, warnings);
    if (!frontmatter) continue;

    if (frontmatter.status !== 'decided') {
      warnings.push(`${relativePath(path)}: tactical decisions must use status "decided"`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(frontmatter.date ?? '')) {
      warnings.push(`${relativePath(path)}: date must use YYYY-MM-DD`);
    }
  }

  for (const path of listFiles(join(ROOT, 'rfc'), (path) => path.endsWith('.md'))) {
    checkFileBudget(path, INTERNAL_RECORD_MAX_LINES, Number.POSITIVE_INFINITY, warnings);
    checkLocalMarkdownLinks(path, warnings);
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Check 11: mise tool pins ────────────────────────────────────────────────

/** Returns the body of a top-level TOML table, or null when it is absent. */
function tomlTable(text, name) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `[${name}]`);
  if (start === -1) return null;

  const body = lines.slice(start + 1);
  const end = body.findIndex((line) => /^\s*\[/.test(line));

  return (end === -1 ? body : body.slice(0, end)).join('\n');
}

/**
 * `mise.toml` is optional contributor convenience, so this check is a no-op without it. When present, its pnpm pin must
 * match `packageManager` — mise users would otherwise silently run a different pnpm than CI. Node stays out of
 * `[tools]` on purpose: mise reads `.nvmrc`/`.node-version`, keeping one Node pin shared with nvm, Volta, and
 * `actions/setup-node`.
 */
function checkMiseToolPins() {
  const warnings = [];
  const misePath = join(ROOT, 'mise.toml');
  if (!existsSync(misePath)) return { ok: true, warnings };

  const miseText = readText(misePath);
  const tools = tomlTable(miseText, 'tools');
  const settings = tomlTable(miseText, 'settings');

  const expected = readJson(join(ROOT, 'package.json')).packageManager?.match(/^pnpm@(.+)$/)?.[1];
  const pinned = tools?.match(/^\s*pnpm\s*=\s*["']([^"']+)["']/m)?.[1];

  if (!expected) {
    warnings.push('package.json: "packageManager" must pin a pnpm version');
  } else if (pinned !== expected) {
    warnings.push(
      `mise.toml: [tools] pnpm should be "${expected}" to match packageManager (got: ${pinned ?? 'missing'})`
    );
  }

  if (tools && /^\s*node\s*=/m.test(tools)) {
    warnings.push(
      'mise.toml: drop the [tools] node pin — .nvmrc/.node-version is the single Node pin shared with nvm, Volta, and CI'
    );
  }

  // Without the opt-in, mise ignores the Node version files and pins no Node.
  if (!/^\s*idiomatic_version_file_enable_tools\s*=\s*\[[^\]]*["']node["']/m.test(settings ?? '')) {
    warnings.push('mise.toml: [settings] idiomatic_version_file_enable_tools must include "node" so .nvmrc is honored');
  }

  return { ok: warnings.length === 0, warnings };
}

// ── Main ────────────────────────────────────────────────────────────────────

const checks = [
  { name: 'CI test coverage', fn: checkCiTestCoverage },
  { name: 'Commitlint scopes', fn: checkCommitlintScopes },
  { name: 'Root tsconfig references', fn: checkTsconfigReferences },
  { name: 'Package metadata', fn: checkPackageMetadata },
  { name: 'Release-please config', fn: checkReleasePleaseConfig },
  { name: 'Bundled docs publishing', fn: checkBundledDocs },
  { name: 'Define imports', fn: checkDefineImports },
  { name: 'i18n locales', fn: checkI18nLocales },
  { name: 'Agent context', fn: checkAgentContext },
  { name: 'Internal records', fn: checkInternalRecords },
  { name: 'mise tool pins', fn: checkMiseToolPins },
];

let failed = 0;

for (const check of checks) {
  const result = check.fn();

  if (result.ok) {
    console.log(`\x1b[32m✓\x1b[0m ${check.name}`);
  } else {
    failed++;
    console.log(`\x1b[31m✗\x1b[0m ${check.name}`);

    for (const w of result.warnings) {
      console.log(`    ${w}`);
    }
  }
}

console.log();
console.log(`${checks.length - failed} passed, ${failed} failed`);

process.exit(failed > 0 ? 1 : 0);
