import { describe, expect, it } from 'vite-plus/test';

import type { UtilReference } from '@/types/util-reference';

import { buildUtilReferenceTocHeadings, createUtilReferenceModel } from '../utilReferenceModel';

describe('createUtilReferenceModel', () => {
  it('returns null for null input', () => {
    expect(createUtilReferenceModel('foo', null)).toBeNull();
  });

  it('builds a single-overload model with Parameters and Return Value H3s', () => {
    const ref = {
      name: 'useMedia',
      overloads: [
        {
          parameters: {},
          returnValue: { type: 'Media | null' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('useMedia', ref);

    expect(model?.isMultiOverload).toBe(false);

    if (!model || model.isMultiOverload) return;

    expect(model).toMatchObject({
      isMultiOverload: false,
      heading: { id: 'api-reference', depth: 2, text: 'API Reference' },
      sections: [{ key: 'returnValue', title: 'Return Value', id: 'return-value', depth: 3 }],
    });
    // No parameters section since parameters is empty
    expect(model.sections.find((s) => s.key === 'parameters')).toBeUndefined();
  });

  it('includes parameters section when parameters are present', () => {
    const ref = {
      name: 'useButton',
      overloads: [
        {
          parameters: {
            params: { type: 'UseButtonParameters', required: true },
          },
          returnValue: { type: 'UseButtonReturnValue' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('useButton', ref);

    expect(model?.isMultiOverload).toBe(false);

    if (!model || model.isMultiOverload) return;

    expect(model.sections).toEqual([
      { key: 'parameters', title: 'Parameters', id: 'parameters', depth: 3 },
      { key: 'returnValue', title: 'Return Value', id: 'return-value', depth: 3 },
    ]);
  });

  it('builds a callable signature for function overloads', () => {
    const ref: UtilReference = {
      name: 'useSelector',
      overloads: [
        {
          typeParameters: [{ name: 'S' }, { name: 'R' }],
          parameters: {
            subscribe: { type: 'function', required: true },
            getSnapshot: { type: 'function', required: true },
            selector: { type: 'function', required: true },
            isEqual: { type: 'function' },
          },
          returnValue: { type: 'R' },
        },
      ],
    };

    const model = createUtilReferenceModel('useSelector', ref);

    expect(model && !model.isMultiOverload ? model.signature : undefined).toBe(
      'useSelector<S, R>(subscribe, getSnapshot, selector, isEqual?): R'
    );
  });

  it('preserves const type parameters and constraints in callable signatures', () => {
    const ref: UtilReference = {
      name: 'createPlayer',
      overloads: [
        {
          typeParameters: [{ name: 'Features', constraint: 'AnyPlayerFeature[]', const: true }],
          returnType: 'CreatePlayerResult<PlayerStore<Features>>',
          parameters: { config: { type: 'CreatePlayerConfig<Features>', required: true } },
          returnValue: { type: 'object' },
        },
      ],
    };

    const model = createUtilReferenceModel('createPlayer', ref);

    expect(model && !model.isMultiOverload ? model.signature : undefined).toBe(
      'createPlayer<const Features extends AnyPlayerFeature[]>(config): CreatePlayerResult<PlayerStore<Features>>'
    );
  });

  it('preserves rest parameters in callable signatures', () => {
    const ref: UtilReference = {
      name: 'useComposedRefs',
      overloads: [
        {
          typeParameters: [{ name: 'T' }],
          parameters: { refs: { type: 'OptionalRef<T>[]', rest: true } },
          returnType: 'RefCallback<T>',
          returnValue: { type: 'RefCallback<T>' },
        },
      ],
    };

    const model = createUtilReferenceModel('useComposedRefs', ref);

    expect(model && !model.isMultiOverload ? model.signature : undefined).toBe(
      'useComposedRefs<T>(...refs): RefCallback<T>'
    );
  });

  it('prints type parameter defaults in callable signatures', () => {
    const ref: UtilReference = {
      name: 'useSlider',
      overloads: [
        {
          typeParameters: [{ name: 'State', constraint: 'SliderState', default: 'SliderState' }],
          parameters: { options: { type: 'object', required: true } },
          returnType: 'UseSliderReturnValue<State>',
          returnValue: { type: 'UseSliderReturnValue<State>' },
        },
      ],
    };

    const model = createUtilReferenceModel('useSlider', ref);

    expect(model && !model.isMultiOverload ? model.signature : undefined).toBe(
      'useSlider<State extends SliderState = SliderState>(options): UseSliderReturnValue<State>'
    );
  });

  it('builds a constructor signature for controllers', () => {
    const ref: UtilReference = {
      name: 'PlayerController',
      overloads: [
        {
          construct: true,
          typeParameters: [{ name: 'Store', constraint: 'PlayerStore' }],
          parameters: { host: { type: 'object', required: true }, context: { type: 'object', required: true } },
          returnValue: { type: 'PlayerController<Store>' },
        },
      ],
    };

    const model = createUtilReferenceModel('PlayerController', ref);

    expect(model && !model.isMultiOverload ? model.signature : undefined).toBe(
      'new PlayerController<Store extends PlayerStore>(host, context)'
    );
  });

  it('builds a multi-overload model with overload H3s and H4 subsections', () => {
    const ref = {
      name: 'usePlayer',
      overloads: [
        {
          description: 'Returns the store. No subscription.',
          parameters: {},
          returnValue: { type: 'PlayerStore' },
        },
        {
          description: 'Returns selected state.',
          parameters: {
            selector: { type: '(state: StoreState) => R', required: true },
          },
          returnValue: { type: 'R' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('usePlayer', ref);

    expect(model?.isMultiOverload).toBe(true);

    if (!model || !model.isMultiOverload) return;

    expect(model.overloads).toHaveLength(2);

    // Overload 1: no parameters, only return value
    expect(model.overloads[0]).toMatchObject({
      id: 'overload-1',
      index: 1,
      sections: [{ key: 'returnValue', id: 'overload-1-return-value', depth: 4 }],
    });

    // Overload 2: has parameters and return value
    expect(model.overloads[1]).toMatchObject({
      id: 'overload-2',
      index: 2,
      sections: [
        { key: 'parameters', id: 'overload-2-parameters', depth: 4 },
        { key: 'returnValue', id: 'overload-2-return-value', depth: 4 },
      ],
    });
  });
  it('uses label for overload id and heading when present', () => {
    const ref = {
      name: 'createPlayer',
      overloads: [
        {
          label: 'Video',
          parameters: { config: { type: 'VideoConfig', required: true } },
          returnValue: { type: 'VideoPlayer' },
        },
        {
          label: 'Audio',
          parameters: { config: { type: 'AudioConfig', required: true } },
          returnValue: { type: 'AudioPlayer' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('createPlayer', ref);

    expect(model?.isMultiOverload).toBe(true);

    if (!model || !model.isMultiOverload) return;

    expect(model.overloads[0]).toMatchObject({
      id: 'video',
      label: 'Video',
      index: 1,
      sections: [
        { key: 'parameters', id: 'video-parameters', depth: 4 },
        { key: 'returnValue', id: 'video-return-value', depth: 4 },
      ],
    });
    expect(model.overloads[1]).toMatchObject({
      id: 'audio',
      label: 'Audio',
      index: 2,
      sections: [
        { key: 'parameters', id: 'audio-parameters', depth: 4 },
        { key: 'returnValue', id: 'audio-return-value', depth: 4 },
      ],
    });
  });

  it('falls back to overload-N when label is absent', () => {
    const ref = {
      name: 'useStore',
      overloads: [
        {
          parameters: {},
          returnValue: { type: 'S' },
        },
        {
          label: 'Selector',
          parameters: { selector: { type: 'function', required: true } },
          returnValue: { type: 'R' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('useStore', ref);

    expect(model?.isMultiOverload).toBe(true);

    if (!model || !model.isMultiOverload) return;

    expect(model.overloads[0]).toMatchObject({ id: 'overload-1', label: undefined });
    expect(model.overloads[1]).toMatchObject({ id: 'selector', label: 'Selector' });
  });
});

describe('buildUtilReferenceTocHeadings', () => {
  it('returns empty array for null model', () => {
    expect(buildUtilReferenceTocHeadings(null)).toEqual([]);
  });

  it('creates TOC headings for single-overload model', () => {
    const ref = {
      name: 'useButton',
      overloads: [
        {
          parameters: { params: { type: 'UseButtonParameters', required: true } },
          returnValue: { type: 'UseButtonReturnValue' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('useButton', ref);
    const headings = buildUtilReferenceTocHeadings(model);

    expect(headings).toEqual([
      { depth: 2, text: 'API Reference', slug: 'api-reference' },
      { depth: 3, text: 'Parameters', slug: 'parameters' },
      { depth: 3, text: 'Return Value', slug: 'return-value' },
    ]);
  });

  it('creates TOC headings for multi-overload model', () => {
    const ref = {
      name: 'useStore',
      overloads: [
        {
          description: 'Store access',
          parameters: { store: { type: 'Store', required: true } },
          returnValue: { type: 'S' },
        },
        {
          description: 'Selector',
          parameters: {
            store: { type: 'Store', required: true },
            selector: { type: 'function', required: true },
          },
          returnValue: { type: 'R' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('useStore', ref);
    const headings = buildUtilReferenceTocHeadings(model);

    expect(headings).toEqual([
      { depth: 2, text: 'API Reference', slug: 'api-reference' },
      { depth: 3, text: 'Overload 1', slug: 'overload-1' },
      { depth: 4, text: 'Parameters', slug: 'overload-1-parameters' },
      { depth: 4, text: 'Return Value', slug: 'overload-1-return-value' },
      { depth: 3, text: 'Overload 2', slug: 'overload-2' },
      { depth: 4, text: 'Parameters', slug: 'overload-2-parameters' },
      { depth: 4, text: 'Return Value', slug: 'overload-2-return-value' },
    ]);
  });

  it('uses label text and slug in TOC headings when present', () => {
    const ref = {
      name: 'createPlayer',
      overloads: [
        {
          label: 'Video',
          parameters: { config: { type: 'VideoConfig', required: true } },
          returnValue: { type: 'VideoPlayer' },
        },
        {
          label: 'Audio',
          parameters: { config: { type: 'AudioConfig', required: true } },
          returnValue: { type: 'AudioPlayer' },
        },
      ],
    } as UtilReference;

    const model = createUtilReferenceModel('createPlayer', ref);
    const headings = buildUtilReferenceTocHeadings(model);

    expect(headings).toEqual([
      { depth: 2, text: 'API Reference', slug: 'api-reference' },
      { depth: 3, text: 'Video', slug: 'video' },
      { depth: 4, text: 'Parameters', slug: 'video-parameters' },
      { depth: 4, text: 'Return Value', slug: 'video-return-value' },
      { depth: 3, text: 'Audio', slug: 'audio' },
      { depth: 4, text: 'Parameters', slug: 'audio-parameters' },
      { depth: 4, text: 'Return Value', slug: 'audio-return-value' },
    ]);
  });
});
