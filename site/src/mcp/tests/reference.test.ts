import { z } from 'astro/zod';
import { describe, expect, it } from 'vite-plus/test';

import { ComponentReferenceSchema } from '../../types/component-reference';
import { FeatureReferenceSchema } from '../../types/feature-reference';
import { MediaReferenceSchema } from '../../types/media-reference';
import { PresetReferenceSchema } from '../../types/preset-reference';
import { UtilReferenceSchema } from '../../types/util-reference';
import { buildReferenceData, REFERENCE_DECLARATION } from '../reference';

type JsonSchemaNode = z.core.JSONSchema._JSONSchema;

/** Every property name a JSON Schema declares, at any depth. */
function propertyNames(node: JsonSchemaNode, names = new Set<string>()): Set<string> {
  if (node === true || node === false) return names;

  for (const [name, value] of Object.entries(node.properties ?? {})) {
    names.add(name);
    propertyNames(value, names);
  }

  const items = Array.isArray(node.items) ? node.items : node.items === undefined ? [] : [node.items];

  for (const inner of [...items, ...(node.anyOf ?? [])]) propertyNames(inner, names);

  if (node.additionalProperties !== undefined) propertyNames(node.additionalProperties, names);

  return names;
}

describe('REFERENCE_DECLARATION', () => {
  it('names every field of the reference schemas', () => {
    const schemas = [
      ComponentReferenceSchema,
      MediaReferenceSchema,
      PresetReferenceSchema,
      FeatureReferenceSchema,
      UtilReferenceSchema,
    ];
    const names = schemas.flatMap((schema) => [...propertyNames(z.toJSONSchema(schema))]);
    const missing = [...new Set(names)].filter((name) => !new RegExp(`\\b${name}\\??:`).test(REFERENCE_DECLARATION));

    expect(names.length).toBeGreaterThan(40);
    expect(missing).toEqual([]);
  });
});

const EMPTY_COMPONENT = {
  name: 'TimeSlider',
  props: {},
  state: {},
  dataAttributes: {},
  cssCustomProperties: {},
  platforms: {},
};
const EMPTY_OVERLOAD = { parameters: {}, returnValue: { type: 'void' } };
const EMPTY_MEDIA = {
  name: 'HlsVideo',
  tagName: 'hls-video',
  mediaType: 'video',
  platforms: {
    html: {
      target: 'video',
      attributes: { standard: [], custom: {} },
      properties: { definitions: {}, native: [] },
      events: { standard: [], custom: [] },
      methods: [],
      cssCustomProperties: {},
    },
  },
};
const EMPTY_PRESET = {
  name: 'video',
  featureBundle: 'video',
  features: [],
  html: { skins: [] },
  react: { skins: [], mediaElement: 'Video' },
};

describe('buildReferenceData', () => {
  it('adds each entry its slug and framework-relative docs page', () => {
    const data = buildReferenceData(
      {
        components: [{ id: 'time-slider', data: ComponentReferenceSchema.parse(EMPTY_COMPONENT) }],
        media: [{ id: 'hls-video', data: MediaReferenceSchema.parse(EMPTY_MEDIA) }],
        presets: [{ id: 'video', data: PresetReferenceSchema.parse(EMPTY_PRESET) }],
        features: [
          {
            id: 'buffer',
            data: FeatureReferenceSchema.parse({
              name: 'buffer',
              slug: 'buffer',
              docsSlug: 'reference/api/feature-buffer',
              state: {},
              actions: {},
            }),
          },
        ],
        utils: [
          { id: 'use-player', data: UtilReferenceSchema.parse({ name: 'usePlayer', overloads: [EMPTY_OVERLOAD] }) },
        ],
      },
      { modules: { '@videojs/react': ['TimeSlider'] }, elements: { 'video-player': ['@videojs/html/video/player'] } },
      '10.2.0'
    );

    expect(data.components[0]).toMatchObject({ slug: 'time-slider', docs: 'reference/components/time-slider' });
    expect(data.media[0]).toMatchObject({ docs: 'reference/components/hls-video' });
    expect(data.presets[0]).toMatchObject({ docs: 'reference/api/preset-video' });
    expect(data.features[0]).toMatchObject({ docs: 'reference/api/feature-buffer' });
    expect(data.utils[0]).toMatchObject({ docs: 'reference/api/use-player' });
    expect(data.modules).toEqual({ '@videojs/react': ['TimeSlider'] });
    expect(data.install.compatibility.methodsByFramework.react).toContain('packaged');
  });

  it('leaves exports and elements empty without a package surface', () => {
    const empty = { components: [], media: [], presets: [], features: [], utils: [] };

    expect(buildReferenceData(empty, undefined, '10.2.0')).toMatchObject({ modules: {}, elements: {} });
  });
});
