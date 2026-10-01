import { describe, expect, it } from 'vite-plus/test';

import type { MediaReference } from '@/types/media-reference';

import { buildMediaReferenceTocHeadings, createMediaReferenceModel } from '../mediaReferenceModel';

function makeRef(overrides: Partial<MediaReference> = {}): MediaReference {
  return {
    name: 'HlsJsVideo',
    tagName: 'hlsjs-video',
    mediaType: 'video',
    platforms: {
      html: {
        target: 'video',
        attributes: {
          standard: ['src', 'autoplay', 'controls'],
          custom: {
            'stream-type': { type: 'string', readonly: false },
          },
        },
        properties: {
          definitions: {
            src: { type: 'string', readonly: false },
            streamType: { type: 'string', readonly: false },
          },
          native: ['currentTime', 'duration', 'volume'],
        },
        events: {
          standard: ['play', 'pause'],
          custom: [{ name: 'streamtypechange', description: 'Fired when the stream type changes.' }],
        },
        methods: ['canPlayType', 'load', 'pause', 'play'],
        cssCustomProperties: { '--media-object-fit': { description: 'Object fit.' } },
      },
      react: {
        target: 'video',
        acceptsNativeProps: true,
        props: {
          src: { type: 'string', readonly: false },
          streamType: { type: 'string', readonly: false },
        },
      },
    },
    ...overrides,
  };
}

const ENGINE_OPTIONS = {
  hlsJs: [{ name: 'maxBufferLength', type: 'number', description: 'Buffer length.' }],
  nativeHls: [{ name: 'drmSystems', type: 'object' }],
} satisfies NonNullable<MediaReference['engineOptions']>;

describe('createMediaReferenceModel', () => {
  it('returns null without a reference', () => {
    expect(createMediaReferenceModel('HlsJsVideo', null)).toBeNull();
  });

  it('uses the HTML API subsection order', () => {
    const model = createMediaReferenceModel('HlsJsVideo', makeRef())!;

    expect(model.platforms.html.sections.map((section) => section.key)).toEqual([
      'attributes',
      'properties',
      'methods',
      'events',
      'cssCustomProperties',
    ]);
  });

  it('places engine options after the properties they extend', () => {
    const model = createMediaReferenceModel('HlsJsVideo', makeRef({ engineOptions: ENGINE_OPTIONS }))!;

    expect(model.platforms.html.sections.map((section) => section.key)).toEqual([
      'attributes',
      'properties',
      'engineOptions',
      'methods',
      'events',
      'cssCustomProperties',
    ]);
    expect(model.platforms.react!.sections.map((section) => section.key)).toEqual([
      'props',
      'engineOptions',
      'refs',
      'events',
    ]);
  });

  it('omits engine options for a media with no structured source', () => {
    const model = createMediaReferenceModel('HlsJsVideo', makeRef())!;

    expect(model.engines).toEqual([]);

    for (const platform of ['html', 'react'] as const) {
      expect(model.platforms[platform]!.sections.map((section) => section.key)).not.toContain('engineOptions');
    }
  });

  it('describes one engine per key under source.engine', () => {
    const model = createMediaReferenceModel('HlsJsVideo', makeRef({ engineOptions: ENGINE_OPTIONS }))!;

    expect(model.engines).toEqual([
      { key: 'hlsJs', id: 'engine-options-hlsjs', title: 'source.engine.hlsJs' },
      { key: 'nativeHls', id: 'engine-options-nativehls', title: 'source.engine.nativeHls' },
    ]);
  });

  it('uses React-specific props and refs sections', () => {
    const model = createMediaReferenceModel('HlsJsVideo', makeRef())!;

    expect(model.platforms.react!.sections.map((section) => section.key)).toEqual(['props', 'refs', 'events']);
  });

  it('lists mediaRef under refs only when the component accepts one', () => {
    const withoutMediaRef = createMediaReferenceModel('HlsJsVideo', makeRef())!;
    const ref = makeRef();

    ref.platforms.react!.mediaRef = { type: 'HTMLVideoElement' };
    const withMediaRef = createMediaReferenceModel('HlsJsVideo', ref)!;

    expect(withoutMediaRef.platforms.react!.refs.map((entry) => entry.key)).toEqual(['ref']);
    expect(withMediaRef.platforms.react!.refs).toEqual([
      { key: 'ref', id: 'ref', title: 'ref' },
      { key: 'mediaRef', id: 'media-ref', title: 'mediaRef' },
    ]);
  });

  it('keeps the React props section when only standard native props are accepted', () => {
    const ref = makeRef();

    ref.platforms.react!.props = {};
    const model = createMediaReferenceModel('HlsJsVideo', ref)!;

    expect(model.platforms.react!.sections.some((section) => section.key === 'props')).toBe(true);
  });

  it('omits the React props section when the component accepts no props', () => {
    const ref = makeRef();

    ref.platforms.react!.acceptsNativeProps = false;
    ref.platforms.react!.props = {};
    const model = createMediaReferenceModel('HlsJsVideo', ref)!;

    expect(model.platforms.react!.sections.some((section) => section.key === 'props')).toBe(false);
  });

  it('drops an empty HTML section', () => {
    const ref = makeRef();

    ref.platforms.html.properties = { definitions: {}, native: [] };
    const model = createMediaReferenceModel('HlsJsVideo', ref)!;

    expect(model.platforms.html.sections.some((section) => section.key === 'properties')).toBe(false);
  });

  it('keeps the HTML properties section when only native properties exist', () => {
    const ref = makeRef();

    ref.platforms.html.properties.definitions = {};
    const model = createMediaReferenceModel('HlsJsVideo', ref)!;

    expect(model.platforms.html.sections.some((section) => section.key === 'properties')).toBe(true);
  });

  it('omits React events when the component does not accept native media props', () => {
    const ref = makeRef();

    ref.platforms.react!.acceptsNativeProps = false;
    const model = createMediaReferenceModel('HlsJsVideo', ref)!;

    expect(model.platforms.react!.sections.some((section) => section.key === 'events')).toBe(false);
  });

  it('keeps React events for an iframe media that routes them to its adapter', () => {
    const ref = makeRef();

    ref.platforms.react!.target = 'iframe';
    ref.platforms.react!.acceptsNativeProps = false;
    const model = createMediaReferenceModel('YouTubeVideo', ref)!;

    expect(model.platforms.react!.sections.some((section) => section.key === 'events')).toBe(true);
  });
});

describe('buildMediaReferenceTocHeadings', () => {
  it('returns empty for a null model', () => {
    expect(buildMediaReferenceTocHeadings(null)).toEqual([]);
  });

  it('marks platform-specific headings for TOC filtering', () => {
    const model = createMediaReferenceModel('HlsJsVideo', makeRef());
    const headings = buildMediaReferenceTocHeadings(model);

    expect(headings[0]).toEqual({ depth: 2, text: 'API Reference', slug: 'api-reference' });
    expect(headings).toContainEqual({
      depth: 3,
      text: 'Attributes',
      slug: 'attributes',
      frameworks: ['html'],
    });
    expect(headings).toContainEqual({ depth: 3, text: 'Props', slug: 'props', frameworks: ['react'] });
  });

  it('nests each engine under the engine options heading', () => {
    const model = createMediaReferenceModel('HlsJsVideo', makeRef({ engineOptions: ENGINE_OPTIONS }));
    const headings = buildMediaReferenceTocHeadings(model);
    const html = headings.filter((heading) => heading.frameworks?.includes('html')).map((heading) => heading.slug);

    expect(html).toEqual([
      'attributes',
      'properties',
      'engine-options',
      'engine-options-hlsjs',
      'engine-options-nativehls',
      'methods',
      'events',
      'css-custom-properties',
    ]);
    expect(headings).toContainEqual({
      depth: 4,
      text: 'source.engine.hlsJs',
      slug: 'engine-options-hlsjs',
      frameworks: ['html'],
    });
  });

  it('nests ref and mediaRef under the React refs heading', () => {
    const ref = makeRef();

    ref.platforms.react!.mediaRef = { type: 'HTMLVideoElement' };
    const headings = buildMediaReferenceTocHeadings(createMediaReferenceModel('HlsJsVideo', ref));
    const react = headings.filter((heading) => heading.frameworks?.includes('react')).map((heading) => heading.slug);

    expect(react).toEqual(['props', 'refs', 'ref', 'media-ref', 'events']);
    expect(headings).toContainEqual({ depth: 4, text: 'mediaRef', slug: 'media-ref', frameworks: ['react'] });
  });
});
