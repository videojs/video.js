import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import GithubSlugger from 'github-slugger';
import type { MdastPluginInput, MdxJsxFlowElement } from 'satteri';
import { defineMdastPlugin } from 'satteri';

// Astro evaluates this module while Vite+ is still loading the task graph, so
// the built workspace package is not available yet.
import { resolveReferenceSlug } from './api-reference-overrides';
import { buildComponentReferenceTocHeadings, createComponentReferenceModel } from './componentReferenceModel';
import { buildFeatureReferenceTocHeadings, createFeatureReferenceModel } from './featureReferenceModel';
import { buildMediaReferenceTocHeadings, createMediaReferenceModel } from './mediaReferenceModel';
import { buildPlayerStoreReferenceTocHeadings, createPlayerStoreReferenceModel } from './playerStoreReferenceModel';
import { getAstroFrontmatter, type MdastVisitorContext } from './satteriAstroData';
import { buildUtilReferenceTocHeadings, createUtilReferenceModel } from './utilReferenceModel';
import { utilReferenceSlug } from './utilReferenceSlug';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPONENT_REF_DIR = path.resolve(__dirname, '../content/generated-component-reference');
const FEATURE_REF_DIR = path.resolve(__dirname, '../content/generated-feature-reference');
const UTIL_REF_DIR = path.resolve(__dirname, '../content/generated-util-reference');
const MEDIA_REF_DIR = path.resolve(__dirname, '../content/generated-media-reference');
const PRESET_REF_DIR = path.resolve(__dirname, '../content/generated-preset-reference');

interface ConditionalHeading {
  depth: number;
  text: string;
  slug: string;
  frameworks?: string[];
  styles?: string[];
  tocKind?: string;
}

/**
 * Builds the conditional-heading list used for the docs table of contents.
 *
 * - Tracks which `<FrameworkCase>` / `<StyleCase>` a heading lives in (walking ancestors) and attaches that context.
 * - Reads `<ComponentReference>` / `<FeatureReference>` / `<UtilReference>` / `<MediaReference>` props (and
 *   `<PlayerStoreReference>`, which reads every feature and preset), loads the generated JSON, and injects heading
 *   entries so API-reference sections appear in the TOC.
 *
 * Markdown headings are slugged with a plain GithubSlugger in document order so the slugs match the element ids the
 * markdown-satteri `heading-ids` plugin generates (otherwise TOC anchors would not resolve). API-reference headings
 * keep their model-generated slugs, which match the ids their components render.
 *
 * A factory resets the per-document slugger and heading list. Sätteri has no end hook, so we publish the
 * (mutated-in-place) array reference onto the frontmatter once and keep pushing to it.
 */
export function satteriConditionalHeadings(): MdastPluginInput {
  return () => {
    const headings: ConditionalHeading[] = [];
    const slugger = new GithubSlugger();
    let published = false;

    const publish = (ctx: MdastVisitorContext) => {
      if (published) return;

      const frontmatter = getAstroFrontmatter(ctx);
      if (!frontmatter) return;

      frontmatter.conditionalHeadings = headings;
      published = true;
    };

    return defineMdastPlugin({
      name: 'astro-conditional-headings',

      heading: (node, ctx) => {
        publish(ctx);

        const text = ctx.textContent(node);
        const heading: ConditionalHeading = {
          depth: node.depth,
          text,
          slug: slugger.slug(text),
        };

        const { frameworks, styles } = resolveCaseContext(node, ctx);

        if (frameworks) heading.frameworks = frameworks;

        if (styles) heading.styles = styles;

        headings.push(heading);
      },

      mdxJsxFlowElement: (node, ctx) => {
        switch (node.name) {
          case 'ComponentReference':
            publish(ctx);
            injectComponentReferenceHeadings(node, headings);
            break;
          case 'FeatureReference':
            publish(ctx);
            injectFeatureReferenceHeadings(node, headings);
            break;
          case 'UtilReference':
            publish(ctx);
            injectUtilReferenceHeadings(node, headings);
            break;
          case 'MediaReference':
            publish(ctx);
            injectMediaReferenceHeadings(node, headings);
            break;
          case 'PlayerStoreReference':
            publish(ctx);
            injectPlayerStoreReferenceHeadings(headings);
            break;
          case 'SkinPickerSection':
            publish(ctx);
            headings.push({ depth: 2, text: 'Choose your skin', slug: 'choose-your-skin' });
            break;
          case 'SourceMediaInstall':
            publish(ctx);
            headings.push({
              depth: 2,
              text: 'Install the media adapter',
              slug: 'install-the-media-adapter',
            });
            break;
        }
      },
    });
  };
}

/** Walk ancestors to find the nearest enclosing FrameworkCase / StyleCase. */
function resolveCaseContext(
  node: Parameters<MdastVisitorContext['parent']>[0],
  ctx: MdastVisitorContext
): { frameworks: string[] | null; styles: string[] | null } {
  let frameworks: string[] | null = null;
  let styles: string[] | null = null;

  let current = ctx.parent(node);

  while (current) {
    if (current.type === 'mdxJsxFlowElement') {
      const el = current as MdxJsxFlowElement;

      if (!frameworks && el.name === 'FrameworkCase') {
        frameworks = extractArrayAttr(el, 'frameworks');
      } else if (!styles && el.name === 'StyleCase') {
        styles = extractArrayAttr(el, 'styles');
      }
    }

    current = ctx.parent(current);
  }

  return { frameworks, styles };
}

function getStringAttr(node: MdxJsxFlowElement, name: string): string | null {
  const attr = node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);

  return attr && typeof attr.value === 'string' ? attr.value : null;
}

/** Parse a JSX expression attribute like `frameworks={["react", "html"]}`. */
function extractArrayAttr(node: MdxJsxFlowElement, name: string): string[] | null {
  const attr = node.attributes?.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);
  if (!attr?.value || typeof attr.value === 'string') return null;

  if (attr.value.type !== 'mdxJsxAttributeValueExpression') return null;

  try {
    return JSON.parse(attr.value.value.trim());
  } catch (e) {
    console.warn(`Failed to parse JSX expression: ${attr.value.value}`, e);
    return null;
  }
}

function readRefJson(dir: string, key: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, `${key}.json`), 'utf-8'));
  } catch {
    return null;
  }
}

function readAllRefJson(dir: string): unknown[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => readRefJson(dir, file.slice(0, -'.json'.length)))
      .filter((json) => json !== null);
  } catch {
    return [];
  }
}

function injectComponentReferenceHeadings(node: MdxJsxFlowElement, headings: ConditionalHeading[]) {
  const componentName = getStringAttr(node, 'component');
  if (!componentName) return;

  const json = readRefJson(COMPONENT_REF_DIR, resolveReferenceSlug(componentName));
  if (!json) return;

  const partOrder = extractArrayAttr(node, 'partOrder');
  const model = createComponentReferenceModel(
    componentName,
    json as Parameters<typeof createComponentReferenceModel>[1],
    partOrder ?? undefined
  );

  headings.push(...buildComponentReferenceTocHeadings(model));
}

function injectFeatureReferenceHeadings(node: MdxJsxFlowElement, headings: ConditionalHeading[]) {
  const featureName = getStringAttr(node, 'feature');
  if (!featureName) return;

  const json = readRefJson(FEATURE_REF_DIR, featureName);
  if (!json) return;

  // SAFETY: This JSON is emitted by the feature-reference builder with the same schema consumed by the site.
  const model = createFeatureReferenceModel(featureName, json as Parameters<typeof createFeatureReferenceModel>[1]);

  headings.push(...buildFeatureReferenceTocHeadings(model));
}

function injectUtilReferenceHeadings(node: MdxJsxFlowElement, headings: ConditionalHeading[]) {
  const utilName = getStringAttr(node, 'util');
  if (!utilName) return;

  const slug = getStringAttr(node, 'slug');
  const json = readRefJson(UTIL_REF_DIR, slug ?? utilReferenceSlug(utilName));
  if (!json) return;

  const model = createUtilReferenceModel(utilName, json as Parameters<typeof createUtilReferenceModel>[1]);

  headings.push(...buildUtilReferenceTocHeadings(model));
}

function injectPlayerStoreReferenceHeadings(headings: ConditionalHeading[]) {
  // SAFETY: These JSON files are emitted by the feature- and preset-reference builders with the schemas the site consumes.
  const model = createPlayerStoreReferenceModel(
    readAllRefJson(FEATURE_REF_DIR) as Parameters<typeof createPlayerStoreReferenceModel>[0],
    readAllRefJson(PRESET_REF_DIR) as Parameters<typeof createPlayerStoreReferenceModel>[1]
  );

  headings.push(...buildPlayerStoreReferenceTocHeadings(model));
}

function injectMediaReferenceHeadings(node: MdxJsxFlowElement, headings: ConditionalHeading[]) {
  const mediaName = getStringAttr(node, 'media');
  if (!mediaName) return;

  const json = readRefJson(MEDIA_REF_DIR, resolveReferenceSlug(mediaName));
  if (!json) return;

  // SAFETY: This JSON is emitted by the media-reference builder with the same schema consumed by the site.
  const model = createMediaReferenceModel(mediaName, json as Parameters<typeof createMediaReferenceModel>[1]);

  headings.push(...buildMediaReferenceTocHeadings(model));
}
