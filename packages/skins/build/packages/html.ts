import type { Graph, GraphModule } from 'vjsc/graph';
import { bundleStyles, renderHtml } from 'vjsc/graph';

import type { SkinModuleMeta } from '../../src/meta.ts';
import { skinCatalogEntry } from '../catalog.ts';
import { skinBaseStylesheet } from '../skin.ts';
import { iconImports } from '../target/html-render.ts';
import { htmlComponentTarget } from '../target/html.tsx';
import { type SkinRoot, skinRoots } from '../variants.ts';
import type { GeneratedPackageFile } from './files.ts';
import { propertyStyles } from './properties.ts';
import { addCopiedFiles, addGenerated, generatedFiles, pascalCase } from './utils.ts';

const packageRoot = 'packages/html/src';
const internalRoot = `${packageRoot}/internal/skins`;

export interface CreateHtmlPackageSkinsOptions {
  readonly workspaceDir: string;
  readonly baseStyles?: readonly string[] | undefined;
}

export interface RenderedHtmlSkin extends SkinRoot {
  readonly template: string;
}

/** Generate package-local HTML Skin templates, registrations, and styles from one finalized VJSC module graph. */
export async function createHtmlPackageSkins(
  graph: Graph<SkinModuleMeta>,
  options: CreateHtmlPackageSkinsOptions
): Promise<GeneratedPackageFile[]> {
  const skins = await renderHtmlSkins(graph, { styling: 'css' });
  const generated = new Map<string, string>();

  for (const skin of skins) {
    const name = skin.root.meta.name;
    const root = `${internalRoot}/${name}`;

    addGenerated(generated, `${root}/template.ts`, htmlTemplateModule(skin.template));
    addGenerated(generated, `${root}/register.ts`, createHtmlSkinRegistration(skin.template, skin.modules, 'package'));
    addGenerated(
      generated,
      `${root}/skin.css`,
      await bundleStyles(graph, skin.modules, {
        label: name,
        files: options.baseStyles ?? [`./styles/${skinBaseStylesheet(skin.preset, skin.theme)}`],
        // Packaged skins reach browsers without `@scope`; the registry keeps it.
        flattenScopes: true,
      })
    );
  }

  // Shadow-root @property rules do not register with the host document.
  const properties = [...generated]
    .filter(([path]) => path.endsWith('/skin.css'))
    .map(([, css]) => propertyStyles(css));

  addGenerated(generated, `${internalRoot}/properties.css`, [...new Set(properties)].join('\n'));

  await addCopiedFiles(generated, options.workspaceDir, [
    ['packages/skins/src/presets/background/html/skin.ts', `${packageRoot}/presets/background/skin.ts`],
    ['packages/skins/src/presets/background/html/skin.css', `${packageRoot}/define/background/skin.css`],
  ]);

  return generatedFiles(generated);
}

export interface RenderHtmlSkinsOptions {
  readonly styling: 'css' | 'tailwind';
}

/** Renders per finalized module set, so package generation and the registry share one render per build. */
const renders = new WeakMap<
  ReadonlyMap<string, GraphModule<SkinModuleMeta>>,
  Map<string, Promise<RenderedHtmlSkin[]>>
>();

/** Render the complete static markup for every HTML Skin in one styling catalog, once per build. */
export function renderHtmlSkins(
  graph: Graph<SkinModuleMeta>,
  options: RenderHtmlSkinsOptions
): Promise<RenderedHtmlSkin[]> {
  const byStyling = renders.get(graph.modules) ?? new Map<string, Promise<RenderedHtmlSkin[]>>();
  let rendered = byStyling.get(options.styling);

  if (!rendered) {
    rendered = renderHtmlSkinsUncached(graph, options);
    byStyling.set(options.styling, rendered);
  }

  renders.set(graph.modules, byStyling);
  return rendered;
}

async function renderHtmlSkinsUncached(
  graph: Graph<SkinModuleMeta>,
  options: RenderHtmlSkinsOptions
): Promise<RenderedHtmlSkin[]> {
  const skins = skinRoots(graph, { target: 'html', style: options.styling });
  const render = htmlComponentTarget.render ?? {};

  const templates = await renderHtml(
    graph,
    skins.map((skin) => ({
      name: skin.root.meta.name,
      moduleId: skin.root.id,
      exportName: skinCatalogEntry(skin.root.meta.name).exportName,
    })),
    {
      aliases: render.aliases,
      empty: render.empty,
      modules: render.modules?.(uniqueModules(skins.flatMap((skin) => skin.modules))),
    }
  );

  return skins.map((skin) => {
    const template = templates.get(skin.root.meta.name);
    if (template === undefined) throw new Error(`HTML Skin \`${skin.root.meta.name}\` did not render a template.`);

    return { ...skin, template };
  });
}

export function htmlPackageSkinOwnedPaths(): string[] {
  return [internalRoot, `${packageRoot}/presets/background/skin.ts`, `${packageRoot}/define/background/skin.css`];
}

function htmlTemplateModule(html: string): string {
  const template = html.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');

  return `import { createTemplate } from '@videojs/utils/dom';

/** Static template rendered from the finalized VJSC module graph. */
export const template = createTemplate(/* html */ \`${template}\`);
`;
}

/** Create the exact custom-element and icon registration closure used by one rendered HTML Skin. */
export function createHtmlSkinRegistration(
  html: string,
  modules: readonly GraphModule<SkinModuleMeta>[],
  destination: 'package' | 'registry'
): string {
  const output: string[] = [];
  const tags = new Set<string>();
  const define = (tag: string): string =>
    destination === 'package' ? `../../../define/ui/${tag}` : `@videojs/html/ui/${tag}`;
  const i18n = destination === 'package' ? '../../../define/i18n' : '@videojs/html/i18n';
  const iconsRoot = destination === 'package' ? '../../../icons' : '@videojs/html/icons';

  for (const match of html.matchAll(/<media-([a-z0-9-]+)\b/g)) tags.add(match[1]!);

  if (tags.delete('text')) output.push(`import ${quote(i18n)};`);

  tags.delete('icon');
  output.push(...[...tags].map((tag) => `import ${quote(define(tag))};`));

  const families = iconRegistrations(modules);

  if (families.size > 0) output.push(`import { registerIcons } from ${quote(iconsRoot)};`);

  for (const [family, icons] of sortedEntries(families)) {
    const bindings = [...new Set(icons.values())].sort();
    const source = family === 'default' ? iconsRoot : `${iconsRoot}/${family}`;

    output.push(
      `import {\n${bindings
        .map((binding) => {
          const local = iconLocalBinding(family, binding);

          return `  ${binding}${local === binding ? '' : ` as ${local}`},`;
        })
        .join('\n')}\n} from '${source}';`
    );
  }

  if (families.size > 0) output.push('');

  for (const [family, icons] of sortedEntries(families)) {
    const entries = sortedEntries(icons)
      .map(([name, binding]) => `  ${quote(name)}: ${iconLocalBinding(family, binding)},`)
      .join('\n');

    output.push(`registerIcons(${quote(family)}, {\n${entries}\n});`);
  }

  return `${output.join('\n')}\n`;
}

/** Replace runtime slots with the editable light-DOM markers installed by the registry. */
export function createSourceOwnedHtml(template: string): string {
  const mediaSlot = /<slot>\s*<\/slot>/;
  if (!mediaSlot.test(template)) throw new Error('Rendered HTML Skin has no default media slot.');

  return template
    .replace(mediaSlot, '<!-- Add a compatible media element here. -->')
    .replace(/<slot name="[^"]+">\s*([\s\S]*?)\s*<\/slot>/g, '$1')
    .replaceAll('&amp;', '&')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<');
}

function iconRegistrations(
  modules: readonly GraphModule<SkinModuleMeta>[]
): ReadonlyMap<string, ReadonlyMap<string, string>> {
  const families = new Map<string, Map<string, string>>();

  for (const module of modules) {
    const imports = iconImports(module);

    for (const match of module.source.matchAll(/registerIcons\(['"]([^'"]+)['"],\s*\{([\s\S]*?)\}\);/g)) {
      const icons = families.get(match[1]!) ?? new Map<string, string>();

      for (const pair of match[2]!.matchAll(/(?:['"]([^'"]+)['"]|([A-Za-z_$][\w$]*))\s*:\s*([A-Za-z_$][\w$]*)/g)) {
        const local = pair[3]!;

        icons.set(pair[1] ?? pair[2]!, imports.get(local) ?? local);
      }

      families.set(match[1]!, icons);
    }
  }

  return families;
}

function uniqueModules(modules: readonly GraphModule<SkinModuleMeta>[]): GraphModule<SkinModuleMeta>[] {
  return [...new Map(modules.map((module) => [module.id, module])).values()];
}

function sortedEntries<Key extends string, Value>(map: ReadonlyMap<Key, Value>): [Key, Value][] {
  return [...map].sort(([left], [right]) => left.localeCompare(right));
}

function quote(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

function iconLocalBinding(family: string, binding: string): string {
  return family === 'default' ? binding : `${binding}${pascalCase(family)}`;
}
