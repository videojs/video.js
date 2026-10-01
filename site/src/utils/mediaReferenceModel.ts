/** Centralized media API subsection definitions shared by the renderer and the generated table of contents. */

import type { HtmlMediaReference, MediaReference, ReactMediaReference } from '@/types/media-reference';

import type { TocHeading } from './componentReferenceModel';

type MediaReferenceSectionKey =
  | 'attributes'
  | 'properties'
  | 'engineOptions'
  | 'methods'
  | 'events'
  | 'cssCustomProperties'
  | 'props'
  | 'refs';

export interface MediaReferenceSection {
  key: MediaReferenceSectionKey;
  title: string;
  id: string;
  depth: number;
}

/** One React ref a media component accepts, rendered as a child of the Refs section. */
export interface MediaReferenceRef {
  key: 'ref' | 'mediaRef';
  id: string;
  title: string;
}

export interface MediaReferenceEngine {
  key: string;
  id: string;
  title: string;
}

interface MediaPlatformModel<Reference> {
  sections: MediaReferenceSection[];
  data: Reference;
}

export interface MediaReferenceModel {
  mediaName: string;
  engines: MediaReferenceEngine[];
  heading: { id: string; depth: number; text: string };
  platforms: {
    html: MediaPlatformModel<HtmlMediaReference>;
    react?: MediaPlatformModel<ReactMediaReference> & { refs: MediaReferenceRef[] };
  };
  data: MediaReference;
}

interface MediaSubsectionDefinition<Reference> {
  key: MediaReferenceSectionKey;
  title: string;
  id: string;
  isEmpty: (source: Reference, ref: MediaReference) => boolean;
}

/**
 * Options under `source.engine`, shared by both platforms: the structured source has the same shape in HTML and React,
 * so the section is defined once and placed after the properties or props it extends.
 */
function createEngineOptionsSubsection<Reference>(): MediaSubsectionDefinition<Reference> {
  return Object.freeze({
    key: 'engineOptions',
    title: 'Engine options',
    id: 'engine-options',
    isEmpty: (_platform: Reference, ref: MediaReference) => Object.keys(ref.engineOptions ?? {}).length === 0,
  });
}

const HTML_SUBSECTIONS: readonly MediaSubsectionDefinition<HtmlMediaReference>[] = Object.freeze([
  {
    key: 'attributes',
    title: 'Attributes',
    id: 'attributes',
    isEmpty: (html) =>
      (html.attributes?.standard ?? []).length === 0 && Object.keys(html.attributes?.custom ?? {}).length === 0,
  },
  {
    key: 'properties',
    title: 'Properties',
    id: 'properties',
    isEmpty: (html) =>
      Object.keys(html.properties?.definitions ?? {}).length === 0 && (html.properties?.native ?? []).length === 0,
  },
  createEngineOptionsSubsection<HtmlMediaReference>(),
  {
    key: 'methods',
    title: 'Methods',
    id: 'methods',
    isEmpty: (html) => (html.methods ?? []).length === 0,
  },
  {
    key: 'events',
    title: 'Events',
    id: 'events',
    isEmpty: (html) => (html.events?.standard ?? []).length === 0 && (html.events?.custom ?? []).length === 0,
  },
  {
    key: 'cssCustomProperties',
    title: 'CSS custom properties',
    id: 'css-custom-properties',
    isEmpty: (html) => Object.keys(html.cssCustomProperties ?? {}).length === 0,
  },
]);

const REACT_SUBSECTIONS: readonly MediaSubsectionDefinition<ReactMediaReference>[] = Object.freeze([
  {
    key: 'props',
    title: 'Props',
    id: 'props',
    isEmpty: (react) => !react.acceptsNativeProps && Object.keys(react.props ?? {}).length === 0,
  },
  createEngineOptionsSubsection<ReactMediaReference>(),
  {
    key: 'refs',
    title: 'Refs',
    id: 'refs',
    isEmpty: () => false,
  },
  {
    key: 'events',
    title: 'Events',
    id: 'events',
    // Iframe medias route the standard media event props to their playback adapter.
    isEmpty: (react) => !react.acceptsNativeProps && react.target !== 'iframe',
  },
]);

function createSections<Reference>(
  definitions: readonly MediaSubsectionDefinition<Reference>[],
  source: Reference,
  ref: MediaReference
): MediaReferenceSection[] {
  return definitions.flatMap((definition) => {
    if (definition.isEmpty(source, ref)) return [];

    return [
      {
        key: definition.key,
        title: definition.title,
        id: definition.id,
        depth: 3,
      },
    ];
  });
}

/**
 * One entry per engine under `source.engine`, in the order the generator emitted them. Ids are lowercased so `hlsJs`
 * and `nativeHls` anchor predictably; titles are the exact path a reader types.
 */
function createEngines(ref: MediaReference): MediaReferenceEngine[] {
  return Object.keys(ref.engineOptions ?? {}).map((key) => ({
    key,
    id: `engine-options-${key.toLowerCase()}`,
    title: `source.engine.${key}`,
  }));
}

/** `ref` always forwards to the rendered element; `mediaRef` appears only where the component accepts one. */
function createRefs(react: ReactMediaReference): MediaReferenceRef[] {
  return [
    { key: 'ref', id: 'ref', title: 'ref' },
    ...(react.mediaRef ? [{ key: 'mediaRef' as const, id: 'media-ref', title: 'mediaRef' }] : []),
  ];
}

export function createMediaReferenceModel(mediaName: string, ref: MediaReference | null): MediaReferenceModel | null {
  if (!ref) return null;

  const engines = createEngines(ref);
  const platforms: MediaReferenceModel['platforms'] = {
    html: {
      sections: createSections(HTML_SUBSECTIONS, ref.platforms.html, ref),
      data: ref.platforms.html,
    },
  };

  if (ref.platforms.react) {
    platforms.react = {
      sections: createSections(REACT_SUBSECTIONS, ref.platforms.react, ref),
      data: ref.platforms.react,
      refs: createRefs(ref.platforms.react),
    };
  }

  return {
    mediaName,
    engines,
    heading: {
      id: 'api-reference',
      depth: 2,
      text: 'API Reference',
    },
    platforms,
    data: ref,
  };
}

export function buildMediaReferenceTocHeadings(model: MediaReferenceModel | null): TocHeading[] {
  if (!model) return [];

  const headings: TocHeading[] = [
    {
      depth: model.heading.depth,
      text: model.heading.text,
      slug: model.heading.id,
    },
  ];

  for (const framework of ['html', 'react'] as const) {
    const platform = model.platforms[framework];
    if (!platform) continue;

    for (const section of platform.sections) {
      headings.push({
        depth: section.depth,
        text: section.title,
        slug: section.id,
        frameworks: [framework],
      });

      if (section.key === 'engineOptions') {
        for (const engine of model.engines) {
          headings.push({
            depth: section.depth + 1,
            text: engine.title,
            slug: engine.id,
            frameworks: [framework],
          });
        }
      }

      if (section.key === 'refs') {
        for (const entry of model.platforms.react?.refs ?? []) {
          headings.push({
            depth: section.depth + 1,
            text: entry.title,
            slug: entry.id,
            frameworks: [framework],
          });
        }
      }
    }
  }

  return headings;
}
