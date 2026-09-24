import { pascalCase } from '@videojs/utils/string';
import { bundleStyles, generateStaticHtml } from 'vjsc/graph';

import { htmlElementModule, htmlI18nModule, htmlPackageModule } from '../../../html/vjsc/elements.ts';
import { htmlIconSource, readIconRegistration } from '../../../icons/vjsc/target.ts';
import { skinCatalogEntry } from '../catalog.ts';
import { skinBaseStylesheet } from '../skin.ts';
import { staticHtmlOptions } from '../target/static-html.ts';
import { type SkinGraph, type SkinGraphModule, type SkinRoot, skinRoots } from '../variants.ts';
import type { GeneratedFile } from './files.ts';
import { backgroundPresetCopies, packageInternalRoot } from './outputs.ts';
import { propertyStyles } from './properties.ts';
import { addCopiedFiles, addGenerated, generatedFiles } from './utils.ts';

const internalRoot = packageInternalRoot.html;

export interface CreateHtmlPackageSkinsOptions {
  readonly workspaceDir: string;
  readonly baseStyles?: readonly string[] | undefined;
}

export interface GeneratedHtmlSkin extends SkinRoot {
  readonly template: string;
  /** Element types the template renders, in document order. */
  readonly elements: ReadonlySet<string>;
}

/** Generate package-local HTML Skin templates, registrations, and styles from one finalized VJSC module graph. */
export async function createHtmlPackageSkins(
  graph: SkinGraph,
  options: CreateHtmlPackageSkinsOptions
): Promise<GeneratedFile[]> {
  const skins = await generateHtmlSkins(graph, { styling: 'css' });
  const generated = new Map<string, string>();

  for (const skin of skins) {
    const name = skin.root.meta.name;
    const root = `${internalRoot}/${name}`;

    addGenerated(generated, `${root}/template.ts`, htmlTemplateModule(skin.template));
    addGenerated(generated, `${root}/register.ts`, createHtmlSkinRegistration(skin.elements, skin.modules, 'package'));
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

  await addCopiedFiles(generated, options.workspaceDir, backgroundPresetCopies.html);

  return generatedFiles(generated);
}

export interface HtmlSkinsOptions {
  readonly styling: 'css' | 'tailwind';
}

/** Renders per finalized module set, so package generation and the registry share one render per build. */
const renders = new WeakMap<ReadonlyMap<string, SkinGraphModule>, Map<string, Promise<GeneratedHtmlSkin[]>>>();

/** Render the complete static markup for every HTML Skin in one styling catalog, once per build. */
export function generateHtmlSkins(graph: SkinGraph, options: HtmlSkinsOptions): Promise<GeneratedHtmlSkin[]> {
  const byStyling = renders.get(graph.modules) ?? new Map<string, Promise<GeneratedHtmlSkin[]>>();
  let rendered = byStyling.get(options.styling);

  if (!rendered) {
    rendered = generateHtmlSkinsUncached(graph, options);
    byStyling.set(options.styling, rendered);
  }

  renders.set(graph.modules, byStyling);
  return rendered;
}

async function generateHtmlSkinsUncached(graph: SkinGraph, options: HtmlSkinsOptions): Promise<GeneratedHtmlSkin[]> {
  const skins = skinRoots(graph, { target: 'html', style: options.styling });
  const templates = await generateStaticHtml(
    graph,
    skins.map((skin) => ({
      name: skin.root.meta.name,
      moduleId: skin.root.id,
      exportName: skinCatalogEntry(skin.root.meta.name).exportName,
    })),
    staticHtmlOptions(uniqueModules(skins.flatMap((skin) => skin.modules)))
  );

  return skins.map((skin) => {
    const rendered = templates.get(skin.root.meta.name);
    if (!rendered) throw new Error(`HTML Skin \`${skin.root.meta.name}\` did not render a template.`);

    return { ...skin, template: rendered.html, elements: rendered.elements };
  });
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
  elements: ReadonlySet<string>,
  modules: readonly SkinGraphModule[],
  destination: 'package' | 'registry'
): string {
  const output: string[] = [];
  const tags = new Set([...elements].flatMap((element) => (element.startsWith('media-') ? [element.slice(6)] : [])));
  // A package registration sits at `internal/skins/<skin>/register.ts` and imports the package's own sources.
  const module = (specifier: string): string =>
    destination === 'package' ? `../../../${htmlPackageModule(specifier)}` : specifier;

  if (tags.delete('text')) output.push(`import ${quote(module(htmlI18nModule))};`);

  tags.delete('icon');
  output.push(...[...tags].map((tag) => `import ${quote(module(htmlElementModule(tag)))};`));

  const families = iconRegistrations(modules);

  if (families.size > 0) output.push(`import { registerIcons } from ${quote(module(htmlIconSource('default')))};`);

  for (const [family, icons] of sortedEntries(families)) {
    const bindings = [...new Set(icons.values())].sort();
    const source = module(htmlIconSource(family));

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
    .replace(mediaSlot, '<!-- Add a compatible media component here. -->')
    .replace(/<slot name="[^"]+">\s*([\s\S]*?)\s*<\/slot>/g, '$1')
    .replaceAll('&amp;', '&')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<');
}

/** Fold the icon registrations the icon target recorded on each compiled module, by family. */
function iconRegistrations(modules: readonly SkinGraphModule[]): ReadonlyMap<string, ReadonlyMap<string, string>> {
  const families = new Map<string, Map<string, string>>();

  for (const module of modules) {
    const registration = readIconRegistration(module.annotations);
    if (!registration) continue;

    const icons = families.get(registration.family) ?? new Map<string, string>();

    for (const [name, exportName] of Object.entries(registration.icons)) icons.set(name, exportName);

    families.set(registration.family, icons);
  }

  return families;
}

function uniqueModules(modules: readonly SkinGraphModule[]): SkinGraphModule[] {
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
