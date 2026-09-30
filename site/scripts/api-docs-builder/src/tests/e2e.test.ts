/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐ │ API DOCS BUILDER — END-TO-END SPEC
 * │ │ │ │ This file IS the specification for the API docs builder pipeline. │ │ It exercises every pattern the builder
 * must handle, using a mock │ │ monorepo under fixtures/monorepo/. If you're an agent trying to │ │ understand how the
 * builder works: read this file. The fixtures are │ │ the inputs, the expected JSON objects are the outputs. │ │ │ │
 * The builder is a black box: given TypeScript source files following │ │ specific conventions, it produces JSON
 * reference objects. These tests │ │ verify the contract between input conventions and output shape. │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * FIXTURE LAYOUT (under fixtures/monorepo/):
 *
 * Components (packages/core/src/core/ui/): toggle-button/ — Single-part component. Exercises: props, state, data-attrs,
 * CSS vars, defaultProps, HTML element, type abbreviation, @ignore skipping, ref auto-skip, function-typed props.
 * gauge/ — Multi-part component. Exercises: primary part detection via Core instantiation, sub-parts with/without HTML
 * elements, React-only parts (no platforms.html), sub-part data-attr inheritance (stateAttrMap heuristic), non-boolean
 * type inference (number, string literal union via type alias), extra @parts-tagged data-attrs files attaching to the
 * listed parts (label.ts). slider/ — Base multi-part component. Exercises: base component whose parts are re-exported
 * by domain variants. volume-slider/ — Domain variant. Exercises: re-exported parts from slider, origin-based element +
 * data-attr resolution, re-exported parts are never primary, always multi-part (no fallback).
 *
 * Utils (already existing fixtures for hooks, controllers, selectors, etc.): Exercises: hook discovery, controller
 * discovery, @public context, create* factory, mixin display name stripping, selector discovery,
 *
 * @label overloads, slug collision (react vs html create-player),
 *   framework assignment.
 *   ui/rate-options/ — Hook re-exported through a directory index
 *   (entry index → ./ui/rate-options → ./use-rate-options), with a
 *   namespace merged onto the function (Props/Result pattern).
 *   Exercises: recursive re-export resolution in util discovery,
 *   entry-visibility filtering (useRateInternals is scanned but never
 *   re-exported to the entry), and skipping re-exports that resolve to
 *   a directory with no index.ts (./legacy holds only compiled JS).
 *
 * Features (packages/core/src/dom/store/features/):
 *   playback.ts  — Simple feature. Exercises: boolean state properties,
 *                  void/Promise action methods, JSDoc description extraction.
 *   volume.ts    — Complex feature. Exercises: numeric state, type alias
 *                  (MediaFeatureAvailability), methods with params + returns,
 *                  interface-level JSDoc → feature description.
 *   metadata.ts  — Resolved + configured feature. Exercises: `@state` tag
 *                  naming the published interface when state() annotates
 *                  private source state, and `config` inputs typed from the
 *                  symbol-keyed private actions they forward to.
 *   presets.ts   — Feature bundles. Exercises: plural _Features naming
 *                  (filtered out of feature discovery), array resolution
 *                  for preset feature lists.
 *   feature.parts.ts — Short aliases (playbackFeature as playback, etc.).
 *                  Exercises: namespace re-export filtering (export * as features).
 *   index.ts     — Re-export barrel. Exercises: feature discovery filtering
 *                  (singular _Feature only, not *Features or namespaces).
 *
 * Presets:
 *   HTML (packages/html/src/presets/):
 *     video.ts   — Exercises: feature bundle export, multiple HTML skins
 *                  (SkinElement inheritance), tailwind skin exclusion.
 *     audio.ts   — Exercises: single skin, subset of features.
 *   React (packages/react/src/presets/):
 *     video/     — Exercises: feature bundle, React skins (_Skin naming),
 *                  media element export, tailwind skin exclusion.
 *     audio/     — Exercises: single skin, different media element.
 *
 * Media elements (packages/html/src/define/media/ + packages/media/src/dom/):
 *   simple-video  — Simple media element. Exercises: discovery via static
 *                   tagName in define/media/_.ts, minimal host (src rw,
 *                   engine readonly), shared attributes/events/CSS vars
 *                   from custom-media-element.
 *   complex-video — Complex media element. Exercises: host with JSDoc
 *                   descriptions, multiple property types (string, boolean,
 *                   Record), and the intentional content-attribute vs
 *                   IDL-property overlap (src, preload appear in BOTH
 *                   hostProperties and nativeAttributes — no dedup).
 *   extending-video — Extending media element. Exercises: host inheritance
 *                   (ExtendingHost extends ComplexHost). Builder must
 *                   walk the extends chain to include inherited properties.
 *                   Child overrides (debug) replace parent definitions.
 *                   Also exercises a hoisted-const base with an `as` cast
 *                   (`extends (Base as typeof Base)`) — the builder must
 *                   unwrap the cast and resolve the local const initializer.
 *   define/ui/container.ts — Container registration lives with UI elements,
 *                   so it is outside media-element discovery.
 *   background-video.ts — Exclusion case. Uses MediaAttachMixin(HTMLElement)
 *                   without CustomMediaElement. API reference manually maintained.
 */
import * as path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';

import { type FeatureResult, generateFeatureReferences } from '../feature-handler';
import { generateMediaElementReferences, type MediaElementResult } from '../media-element-handler';
import { generateComponentReferences } from '../pipeline';
import { generatePresetReferences, type PresetResult } from '../preset-handler';
import { getUtilEntries, type UtilEntry } from '../util-handler';

const FIXTURE_ROOT = path.resolve(import.meta.dirname, 'fixtures/monorepo');

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT PIPELINE
// ═══════════════════════════════════════════════════════════════════════

describe('Component pipeline (end-to-end)', () => {
  // Run the full pipeline once and reuse results across tests.
  const results = generateComponentReferences(FIXTURE_ROOT);

  function findComponent(name: string) {
    return results.find((r) => r.name === name);
  }

  // ─────────────────────────────────────────────────────────────────
  // SINGLE-PART COMPONENT: ToggleButton
  // ─────────────────────────────────────────────────────────────────
  //
  // A single-part component is the simplest case. The builder merges
  // data from three source files into one flat reference object:
  //   - core.ts → Props interface, State interface, defaultProps
  //   - data.ts → data attribute names + JSDoc descriptions
  //   - vars.ts → CSS custom property names + descriptions
  //   - HTML element file → tagName for platforms.html
  //
  // Key behaviors tested:
  //   - Props with `@ignore` JSDoc are excluded from output
  //   - Props named `ref` are auto-excluded (React internal)
  //   - Function-typed props get abbreviated ("function") with detailedType
  //   - Union props with function members get "type | function" abbreviation
  //   - defaultProps values are merged as string representations
  //   - Boolean data-attrs have NO type field (presence/absence convention)
  //   - CSS custom properties appear in cssCustomProperties
  //   - platforms.html is present when an HTML element file exists
  //   - No `parts` field on single-part components

  describe('ToggleButton (single-part)', () => {
    it('produces the expected JSON reference', () => {
      const toggle = findComponent('ToggleButton');

      expect(toggle).toBeDefined();

      const ref = toggle!.reference;

      // Top-level shape
      expect(ref.name).toBe('ToggleButton');
      expect(ref.parts).toBeUndefined();

      // ── Props ──
      // `ref` prop is auto-skipped. `_internalFlag` has @ignore and is skipped.
      // What remains: disabled, label, onPressedChange.
      expect(Object.keys(ref.props)).toEqual(expect.arrayContaining(['disabled', 'label', 'onPressedChange']));
      expect(ref.props['ref' as keyof typeof ref.props]).toBeUndefined();
      expect(ref.props['_internalFlag' as keyof typeof ref.props]).toBeUndefined();

      // disabled: simple boolean, has defaultProps value.
      // Props that are non-optional in the interface have required: true,
      // even when they have a runtime default (defaultProps is separate from optionality).
      expect(ref.props.disabled).toEqual({
        type: 'boolean',
        description: 'Whether the button is disabled.',
        default: 'false',
        required: true,
      });

      // label: union with function → abbreviated to "string | function"
      // defaultProps '' → "''"
      expect(ref.props.label).toMatchObject({
        type: 'string | function',
        description: 'Custom label for the button.',
        default: "''",
      });
      // detailedType shows the full function signature
      expect(ref.props.label!.detailedType).toBeDefined();
      expect(ref.props.label!.detailedType).toContain('=>');

      // onPressedChange: pure function → abbreviated to "function"
      expect(ref.props.onPressedChange).toMatchObject({
        type: 'function',
        description: 'Callback when pressed state changes.',
      });
      expect(ref.props.onPressedChange!.detailedType).toBeDefined();

      // The HTML element exposes `disabled` and `label` but has no `onPressedChange`, so only React documents it.
      expect(ref.props.disabled!.frameworks).toBeUndefined();
      expect(ref.props.label!.frameworks).toBeUndefined();
      expect(ref.props.onPressedChange!.frameworks).toEqual(['react']);

      // ── State ──
      expect(ref.state.pressed).toEqual({
        type: 'boolean',
        description: 'Whether the toggle is pressed.',
      });
      expect(ref.state.disabled).toEqual({
        type: 'boolean',
        description: 'Whether the button is disabled.',
      });

      // ── Data attributes ──
      // Boolean state types → type field is OMITTED (presence/absence convention).
      expect(ref.dataAttributes['data-pressed']).toEqual({
        description: 'Present when the toggle is pressed.',
      });
      expect(ref.dataAttributes['data-disabled']).toEqual({
        description: 'Present when the button is disabled.',
      });

      // ── CSS custom properties ──
      expect(ref.cssCustomProperties['--media-toggle-pressed-bg']).toEqual({
        description: 'Background color when pressed.',
      });
      expect(ref.cssCustomProperties['--media-toggle-transition']).toEqual({
        description: 'Transition duration for the toggle animation.',
      });

      // ── Platforms ──
      // HTML element exists → platforms.html with tagName
      expect(ref.platforms.html).toEqual({
        tagName: 'media-toggle-button',
        events: [
          { name: 'focus-change' },
          { name: 'pressed-change', description: 'Emitted when the pressed state changes.' },
        ],
      });
    });

    it('detects literal dispatches without @fires and uses @fires only for descriptions', () => {
      const events = findComponent('ToggleButton')!.reference.platforms.html?.events;

      expect(events).toContainEqual({ name: 'focus-change' });
      expect(events).toContainEqual({
        name: 'pressed-change',
        description: 'Emitted when the pressed state changes.',
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MULTI-PART COMPONENT: Gauge
  // ─────────────────────────────────────────────────────────────────
  //
  // A multi-part component is detected when `index.parts.ts` exists
  // in the React package. The top-level reference has EMPTY props,
  // state, dataAttributes, cssCustomProperties, and platforms. All
  // meaningful data lives in the `parts` record.
  //
  // Parts are discovered from index.parts.ts exports:
  //   - PRIMARY PART: The part whose React source instantiates the
  //     component's own Core class (matches `new {Name}Core\b`). When
  //     no part does, or several do, the part named `Root` is chosen.
  //     Gets: shared core Props/State, data-attrs, CSS vars, root tagName.
  //   - SUB-PARTS: All other parts. Get: their own tagName (if element
  //     file exists), description from React JSDoc, shared data-attrs
  //     (only if React source references `stateAttrMap`), and custom
  //     React props from `{LocalName}Props` interface.
  //   - REACT-ONLY PARTS: Sub-parts with no matching HTML element file.
  //     Get platforms.react but NOT platforms.html.
  //   - NAMESPACE PARTS: `export * as Preview from './preview/index.parts'`
  //     expands the nested index into `Preview.Root`, `Preview.Label`, ...
  //     keyed `preview-root`, `preview-label`. The nested Root maps to the
  //     element file named after the namespace (`slider/preview.ts`).
  //
  // Non-boolean data-attr types are inferred from StateAttrMap<State>:
  //   - number → type: "number"
  //   - string literal union → type: "'empty' | 'partial' | 'full'"
  //   - type alias → expanded to literals (FillLevel → 'empty' | ...)
  //   - boolean → type field OMITTED

  describe('Gauge (multi-part)', () => {
    it('has empty top-level and parts record', () => {
      const gauge = findComponent('Gauge');

      expect(gauge).toBeDefined();

      const ref = gauge!.reference;

      // Top-level is empty for multi-part components
      expect(ref.props).toEqual({});
      expect(ref.state).toEqual({});
      expect(ref.dataAttributes).toEqual({});
      expect(ref.cssCustomProperties).toEqual({});
      expect(ref.platforms).toEqual({});

      // Parts record exists
      expect(ref.parts).toBeDefined();
      expect(Object.keys(ref.parts!)).toEqual(
        expect.arrayContaining(['indicator', 'track', 'fill', 'label', 'marker'])
      );
    });

    it('primary part (Indicator) gets core props, state, data-attrs, CSS vars', () => {
      const parts = findComponent('Gauge')!.reference.parts!;
      const indicator = parts.indicator!;

      expect(indicator.name).toBe('Indicator');
      expect(indicator.description).toBe('A visual indicator for the current value. Renders a `<span>` element.');

      // Props from shared core (GaugeProps), with defaultProps merged
      expect(indicator.props.min).toMatchObject({ type: 'number', default: '0' });
      expect(indicator.props.max).toMatchObject({ type: 'number', default: '100' });
      expect(indicator.props.label).toMatchObject({
        type: 'string | function',
        default: "''",
      });

      // State from shared core (GaugeState)
      expect(indicator.state.percentage).toMatchObject({
        type: 'number',
        description: 'Current value as a percentage (0\u20131).',
      });

      // Data attributes with non-boolean type inference
      expect(indicator.dataAttributes['data-percentage']).toMatchObject({
        description: 'Current percentage as a string.',
        type: 'number',
      });
      expect(indicator.dataAttributes['data-fill-level']).toMatchObject({
        description: 'The fill level.',
      });
      // FillLevel type alias → expanded to string literal union
      const fillType = indicator.dataAttributes['data-fill-level']!.type;

      expect(fillType).toBeDefined();
      expect(fillType).toContain("'empty'");
      expect(fillType).toContain("'partial'");
      expect(fillType).toContain("'full'");

      // CSS vars from shared css-vars file
      expect(indicator.cssCustomProperties['--media-gauge-fill']).toEqual({
        description: 'The fill color of the gauge.',
      });

      // Platforms: both html and react
      expect(indicator.platforms.html).toEqual({ tagName: 'media-gauge' });
      expect(indicator.platforms.react).toEqual({});
    });

    it('sub-part (Track) gets its own tagName, empty props/state', () => {
      const track = findComponent('Gauge')!.reference.parts!.track!;

      expect(track.name).toBe('Track');
      expect(track.description).toBe('The track area of the gauge. Renders a `<div>` element.');
      expect(track.props).toEqual({});
      expect(track.state).toEqual({});
      expect(track.dataAttributes).toEqual({});
      expect(track.cssCustomProperties).toEqual({});

      // Has both HTML and React platforms
      // The HTML element's own JSDoc replaces the React wording on HTML pages.
      expect(track.platforms.html).toEqual({
        tagName: 'media-gauge-track',
        description: 'The track area of the gauge, as the `<media-gauge-track>` element.',
      });
      expect(track.platforms.react).toEqual({});
    });

    it('sub-part (Fill) inherits shared data-attrs via stateAttrMap heuristic', () => {
      const fill = findComponent('Gauge')!.reference.parts!.fill!;

      expect(fill.name).toBe('Fill');
      // Props inherited by the matching custom element are shared with HTML.
      expect(fill.props.color).toEqual({
        type: 'string',
        description: 'The color of the fill bar.',
        frameworks: ['html', 'react'],
      });
      // Documented `children` is included because it is an explicit React contract.
      expect(fill.props.children).toEqual({
        type: 'unknown',
        description: 'Fallback content displayed before the gauge is ready.',
        frameworks: ['react'],
      });
      expect(fill.state).toEqual({});

      // Fill's React source references `stateAttrMap`, so it gets the
      // component's shared data-attrs from data.ts
      expect(Object.keys(fill.dataAttributes).length).toBeGreaterThan(0);
      expect(fill.dataAttributes['data-percentage']).toBeDefined();
      expect(fill.dataAttributes['data-fill-level']).toBeDefined();

      // A compiler directive between the element's JSDoc and its class does not detach the JSDoc.
      expect(fill.platforms.html).toEqual({
        tagName: 'media-gauge-fill',
        description: 'The filled portion of the gauge.',
      });
      expect(fill.platforms.react).toEqual({});
    });

    it('React-only sub-part (Label) has no platforms.html', () => {
      const label = findComponent('Gauge')!.reference.parts!.label!;

      expect(label.name).toBe('Label');
      expect(label.description).toBe('An accessible label for the gauge value. Renders a `<span>` element.');

      // React-only: has platforms.react but NOT platforms.html
      expect(label.platforms.react).toEqual({});
      expect(label.platforms.html).toBeUndefined();
    });

    it('nested sub-part (Marker) resolves its React and HTML files', () => {
      const marker = findComponent('Gauge')!.reference.parts!.marker!;

      expect(marker.name).toBe('Marker');
      expect(marker.description).toBe('A nested marker for the current gauge value.');
      expect(marker.platforms.html).toEqual({ tagName: 'media-gauge-marker' });
      expect(marker.platforms.react).toEqual({});
    });

    // Extra data-attrs files (any simple name next to the main data.ts)
    // declare their target parts with a @parts JSDoc tag on an exported
    // *DataAttrs const. This covers attrs that a DOM layer applies to
    // parts directly, invisible to the per-part stateAttrMap heuristic
    // (e.g. menu/item.ts applied by dom/ui/menu/menu.ts).
    it('extra @parts-tagged data-attrs file attaches to listed parts', () => {
      const parts = findComponent('Gauge')!.reference.parts!;

      // label: no other attrs — gets the extra file's attrs
      expect(parts.label!.dataAttributes['data-emphasized']).toMatchObject({
        description: 'Present when the value is emphasized.',
      });

      // fill: extra attrs merge with attrs inherited via stateAttrMap
      expect(parts.fill!.dataAttributes['data-emphasized']).toBeDefined();
      expect(parts.fill!.dataAttributes['data-percentage']).toBeDefined();

      // parts not listed in @parts are untouched
      expect(parts.track!.dataAttributes).toEqual({});
      expect(parts.indicator!.dataAttributes['data-emphasized']).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MULTI-PART WITH A SHARED SOURCE FILE: OptionGroup
  // ─────────────────────────────────────────────────────────────────
  //
  // Option groups export Root, Options, and Value from one `component.tsx`
  // and drive the core through hooks, so no React source constructs it.
  //   - Part kebabs derive from the export names instead of the shared
  //     file name, so the parts do not collapse into one record.
  //   - `Root` becomes the primary part by fallback and gets the core
  //     data plus the component's `element.ts` (tag name and events).
  //   - Descriptions and sub-part props resolve by local export name
  //     inside the shared file.

  describe('OptionGroup (multi-part, shared source file)', () => {
    it('keeps one part per export', () => {
      const ref = findComponent('OptionGroup')!.reference;

      expect(ref.props).toEqual({});
      expect(ref.platforms).toEqual({});
      expect(Object.keys(ref.parts!).sort()).toEqual(['options', 'root', 'value']);
    });

    it('falls back to Root as the primary part', () => {
      const root = findComponent('OptionGroup')!.reference.parts!.root!;

      expect(root.name).toBe('Root');
      expect(root.description).toBe(
        'Owns option state and shares it with an enclosing menu. Does not render a DOM element.'
      );
      expect(root.props.label).toMatchObject({ type: 'string', default: "''" });
      expect(root.props.formatOption).toMatchObject({ type: 'function' });
      expect(root.state.value).toMatchObject({ type: 'string' });
      expect(root.dataAttributes['data-value']).toMatchObject({ description: 'The selected option value.' });
      expect(root.platforms.html).toEqual({
        tagName: 'media-option-group',
        events: [{ name: 'value-change', description: 'Emitted when the selected option changes.' }],
      });
      expect(root.platforms.react).toEqual({});
    });

    it('resolves sub-parts by export name inside the shared file', () => {
      const parts = findComponent('OptionGroup')!.reference.parts!;

      expect(parts.options!.description).toBe('Renders items for the available options.');
      expect(parts.options!.props.renderItem).toMatchObject({
        type: 'function',
        detailedType: '((value: string) => unknown)',
        frameworks: ['react'],
      });
      expect(parts.options!.props.className).toMatchObject({
        type: 'string | function',
        detailedType: 'string | ((state: string) => string | undefined)',
        frameworks: ['react'],
      });
      expect(parts.options!.platforms).toEqual({ react: {} });

      expect(parts.value!.description).toBe('Displays the selected option label.');
      expect(parts.value!.props.className).toMatchObject({ type: 'string' });
      expect(parts.value!.platforms).toEqual({ react: {} });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MULTI-PART WITH A NAMESPACE RE-EXPORT: Slider
  // ─────────────────────────────────────────────────────────────────
  //
  // slider/index.parts.ts re-exports `./preview/index.parts` as the
  // `Preview` namespace. Its nested exports become dotted parts:
  //   - Preview.Root → slider/preview.ts (element named after the namespace)
  //   - Preview.Label → gauge/label.tsx (nested re-export of another
  //     component's React-only part)

  describe('Slider (multi-part with a namespace re-export)', () => {
    it('expands the namespace into dotted parts', () => {
      const parts = findComponent('Slider')!.reference.parts!;

      expect(Object.keys(parts).sort()).toEqual(['preview-label', 'preview-root', 'root', 'thumb', 'track']);
    });

    it('nested Root resolves the element named after the namespace', () => {
      const root = findComponent('Slider')!.reference.parts!['preview-root']!;

      expect(root.name).toBe('Preview.Root');
      expect(root.description).toBe('Positions preview content at the slider pointer.');
      expect(root.props.offset).toMatchObject({
        type: 'number',
        description: 'Distance between the preview and the track, in pixels.',
        frameworks: ['react'],
      });
      expect(root.platforms.html).toEqual({ tagName: 'media-slider-preview' });
      expect(root.platforms.react).toEqual({});
    });

    it('nested re-export of another component stays React-only', () => {
      const label = findComponent('Slider')!.reference.parts!['preview-label']!;

      expect(label.name).toBe('Preview.Label');
      expect(label.description).toBe('An accessible label for the gauge value. Renders a `<span>` element.');
      expect(label.platforms).toEqual({ react: {} });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MULTI-PART WITH RE-EXPORTS: VolumeSlider
  // ─────────────────────────────────────────────────────────────────
  //
  // Domain variant components like VolumeSlider re-export parts from
  // a base component (Slider). The builder resolves re-exports:
  //   - Parses the origin's index.parts.ts to find the original export
  //   - Derives element file paths from the ORIGIN component
  //   - Data-attrs come from the ORIGIN component's data-attrs file
  //   - Re-exported parts are NEVER primary
  //   - Components with re-exported parts always produce multi-part
  //     output (no single-part fallback, even if only 1 local export)

  describe('VolumeSlider (multi-part with re-exports)', () => {
    it('has empty top-level and parts from both local and re-exported sources', () => {
      const vs = findComponent('VolumeSlider');

      expect(vs).toBeDefined();

      const ref = vs!.reference;

      expect(ref.props).toEqual({});
      expect(ref.state).toEqual({});
      expect(ref.parts).toBeDefined();

      // Root is local, Thumb and Track are re-exported from slider
      expect(ref.parts!.root).toBeDefined();
      expect(ref.parts!.thumb).toBeDefined();
      expect(ref.parts!.track).toBeDefined();
    });

    it('re-exported namespace (Preview) expands from the slider origin', () => {
      const parts = findComponent('VolumeSlider')!.reference.parts!;

      expect(parts['preview-root']!.name).toBe('Preview.Root');
      expect(parts['preview-root']!.platforms.html).toEqual({ tagName: 'media-slider-preview' });
      expect(parts['preview-label']!.name).toBe('Preview.Label');
      expect(parts['preview-label']!.platforms).toEqual({ react: {} });
    });

    it('local primary part (Root) gets VolumeSlider core data', () => {
      const root = findComponent('VolumeSlider')!.reference.parts!.root!;

      expect(root.name).toBe('Root');
      // Props come from VolumeSliderProps
      expect(root.props.orientation).toBeDefined();
      // State comes from VolumeSliderState
      expect(root.state.volume).toBeDefined();
      // HTML tag comes from volume-slider/element.ts
      expect(root.platforms.html).toEqual({ tagName: 'media-volume-slider' });
      expect(root.platforms.react).toEqual({});
    });

    it('re-exported sub-part (Thumb) resolves from slider origin', () => {
      const thumb = findComponent('VolumeSlider')!.reference.parts!.thumb!;

      expect(thumb.name).toBe('Thumb');
      // HTML tag comes from SLIDER's element file (slider/thumb.ts),
      // not volume-slider's directory
      expect(thumb.platforms.html).toEqual({ tagName: 'media-slider-thumb' });
      expect(thumb.platforms.react).toEqual({});

      // Data-attrs come from SLIDER's data-attrs file because the origin
      // React source (slider-thumb.tsx) references stateAttrMap
      expect(Object.keys(thumb.dataAttributes).length).toBeGreaterThan(0);
      expect(thumb.dataAttributes['data-value']).toBeDefined();
      expect(thumb.dataAttributes['data-dragging']).toBeDefined();
    });

    it('re-exported sub-part (Track) with no stateAttrMap gets empty data-attrs', () => {
      const track = findComponent('VolumeSlider')!.reference.parts!.track!;

      expect(track.name).toBe('Track');
      // slider-track.tsx does NOT reference stateAttrMap, so no data-attrs
      expect(track.dataAttributes).toEqual({});
      // HTML tag from slider's track element
      expect(track.platforms.html).toEqual({ tagName: 'media-slider-track' });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BASE COMPONENT: Slider
  // ─────────────────────────────────────────────────────────────────
  //
  // The slider base is also discovered as its own component.
  // It has index.parts.ts with 3 local parts (Root, Thumb, Track).
  // This tests that the base component is independently valid.

  describe('Slider (base multi-part)', () => {
    it('is discovered and has parts', () => {
      const slider = findComponent('Slider');

      expect(slider).toBeDefined();

      const ref = slider!.reference;

      expect(ref.parts).toBeDefined();

      // Root is primary (instantiates SliderCore)
      expect(ref.parts!.root).toBeDefined();
      expect(ref.parts!.root!.props.min).toBeDefined();
      expect(ref.parts!.root!.props.max).toBeDefined();
      expect(ref.parts!.root!.state.value).toBeDefined();
      expect(ref.parts!.root!.state.dragging).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // CROSS-CUTTING CONVENTIONS
  // ─────────────────────────────────────────────────────────────────

  describe('Cross-cutting conventions', () => {
    it('all components are discovered from core/ui directories', () => {
      const names = results.map((r) => r.name).sort();

      expect(names).toEqual(expect.arrayContaining(['Gauge', 'PiPButton', 'Slider', 'ToggleButton', 'VolumeSlider']));
    });

    it('kebab name matches directory name', () => {
      expect(findComponent('ToggleButton')!.kebab).toBe('toggle-button');
      expect(findComponent('Gauge')!.kebab).toBe('gauge');
      expect(findComponent('Slider')!.kebab).toBe('slider');
      expect(findComponent('VolumeSlider')!.kebab).toBe('volume-slider');
    });

    it('NAME_OVERRIDES: pip-button → PiPButton (not PipButton)', () => {
      // The NAME_OVERRIDES map handles cases where standard kebab-to-PascalCase
      // conversion is wrong. "pip-button" would normally become "PipButton",
      // but the override maps it to "PiPButton".
      const pip = findComponent('PiPButton');

      expect(pip).toBeDefined();
      expect(pip!.kebab).toBe('pip-button');
      expect(pip!.reference.name).toBe('PiPButton');
      // Props use the overridden name for interface lookup (PiPButtonProps)
      expect(pip!.reference.props.disabled).toBeDefined();
      expect(pip!.reference.state.active).toBeDefined();
    });

    it('primary part appears first in parts record (sorted by isPrimary)', () => {
      const gaugeParts = Object.keys(findComponent('Gauge')!.reference.parts!);

      expect(gaugeParts[0]).toBe('indicator');

      const vsParts = Object.keys(findComponent('VolumeSlider')!.reference.parts!);

      expect(vsParts[0]).toBe('root');
    });

    it('props are sorted: required first, then alphabetical', () => {
      // All ToggleButton props are required (non-optional in the interface),
      // so they should be purely alphabetical within the required group.
      const toggleProps = Object.keys(findComponent('ToggleButton')!.reference.props);
      const sorted = [...toggleProps].sort((a, b) => a.localeCompare(b));

      expect(toggleProps).toEqual(sorted);
    });

    it('optional fields are omitted from JSON when undefined', () => {
      const ref = findComponent('ToggleButton')!.reference;

      // disabled has no detailedType (simple boolean, no abbreviation)
      expect('detailedType' in ref.props.disabled!).toBe(false);

      // Boolean data-attrs have no type field
      expect('type' in ref.dataAttributes['data-pressed']!).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// UTIL PIPELINE
// ═══════════════════════════════════════════════════════════════════════
//
// The util pipeline scans fixed entry points for exports matching
// naming conventions (use*, select*, create*, *Controller) or @public
// JSDoc. Each export produces a UtilReference JSON with overloads.
//
// Key behaviors:
//   - Hooks (use*): discovered from React entry points, framework: "react"
//   - Controllers (*Controller): discovered from HTML entry points, framework: "html"
//   - Selectors (select*): framework-agnostic (null)
//   - Factories (create*): framework depends on entry point
//   - @public exports: explicit inclusion regardless of naming
//   - create*Mixin: display name strips "create" prefix
//   - Slug collisions: React keeps bare slug, HTML gets prefixed with "html-"
//   - Multi-overload functions: each overload is preserved in the overloads array
//   - @label JSDoc: becomes the overload's label field
//   - Controller params: "- " prefix stripped from @param descriptions

describe('Util pipeline (end-to-end)', () => {
  const entries = getUtilEntries(FIXTURE_ROOT);

  function findByName(name: string, framework?: 'react' | 'html' | null): UtilEntry | undefined {
    return entries.find((e) => e.data.name === name && (framework === undefined || e.framework === framework));
  }

  // ─────────────────────────────────────────────────────────────────
  // DISCOVERY & FRAMEWORK ASSIGNMENT
  // ─────────────────────────────────────────────────────────────────
  //
  // Exports are discovered by scanning entry point files and their
  // local re-exports. The framework is determined by which entry
  // point the export was found in.

  describe('Discovery', () => {
    it('discovers hooks from React entry points', () => {
      expect(findByName('usePlayer', 'react')).toBeDefined();
      expect(findByName('useStore', 'react')).toBeDefined();
      expect(findByName('useFormat', 'react')).toBeDefined();
    });

    // Entry indexes often re-export hooks through a directory index
    // (entry index → ./ui/rate-options → ./use-rate-options). Discovery
    // must follow re-export hops to the declaring module so JSDoc and
    // overload extraction read the real source file. The fixture also
    // merges a namespace onto the hook (the repo's Props/Result pattern),
    // which must not break FunctionNode detection.
    it('discovers hooks re-exported through a directory index', () => {
      const entry = findByName('useRateOptions', 'react');

      expect(entry).toBeDefined();
      expect(entry!.slug).toBe('use-rate-options');
      expect(entry!.data.description).toContain('Create rate menu options');

      const overload = entry!.data.overloads[0]!;

      expect(overload.parameters.props).toBeDefined();
      expect(overload.parameters.props!.description).toContain('formatRate');
    });

    // Whole modules are scanned, but only names visible from the entry
    // point (through named re-exports and local `export *` chains) are
    // public API. useRateInternals matches the use* convention and lives
    // in a scanned file, but is never re-exported up to the entry.
    it('excludes exports that are not visible from the entry point', () => {
      expect(findByName('useRateInternals', 'react')).toBeUndefined();
    });

    // rate-options/index.ts re-exports './legacy', which resolves to a
    // directory with no index.ts (only compiled index.js). Discovery must
    // skip it — not crash reading a directory — and the unreachable export
    // stays undocumented.
    it('skips re-exports that resolve to a directory without index.ts', () => {
      expect(findByName('useLegacyRate', 'react')).toBeUndefined();
    });

    it('discovers controllers from HTML entry points', () => {
      expect(findByName('PlayerController', 'html')).toBeDefined();
      expect(findByName('SnapshotController', 'html')).toBeDefined();
    });

    it('discovers selectors as framework-agnostic (null)', () => {
      for (const name of ['selectPlayback', 'selectVolume', 'selectTime']) {
        const entry = findByName(name, null);

        expect(entry, `expected ${name} to be framework-agnostic`).toBeDefined();
        expect(entry!.framework).toBeNull();
      }
    });

    it('discovers @public exports (mergeProps, playerContext)', () => {
      expect(findByName('mergeProps', 'react')).toBeDefined();
      expect(findByName('playerContext', 'html')).toBeDefined();
    });

    it('discovers factories from both React and HTML', () => {
      expect(findByName('createPlayer', 'react')).toBeDefined();
      expect(findByName('createPlayer', 'html')).toBeDefined();
      expect(findByName('createSelector', null)).toBeDefined();
    });

    it('leaves external re-exports with their canonical entry point', () => {
      const matches = entries.filter((entry) => entry.data.name === 'createSelector');

      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({ slug: 'create-selector', framework: null });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // DISPLAY NAME & SLUG
  // ─────────────────────────────────────────────────────────────────
  //
  // Display names are the export name as-is, EXCEPT create*Mixin
  // factories which strip the "create" prefix.
  // Slugs are kebab-case of the display name. On collision, React
  // keeps the bare slug and HTML gets "html-" prefixed.

  describe('Display name & slug', () => {
    it('strips "create" prefix from mixin display names', () => {
      const mixin = findByName('MediaAttachMixin', 'html');

      expect(mixin).toBeDefined();
      expect(mixin!.slug).toBe('media-attach-mixin');
    });

    it('resolves slug collisions: React bare, HTML prefixed', () => {
      const reactCreate = entries.find((e) => e.slug === 'create-player' && e.framework === 'react');
      const htmlCreate = entries.find((e) => e.slug === 'html-create-player' && e.framework === 'html');

      expect(reactCreate).toBeDefined();
      expect(htmlCreate).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // OVERLOADS
  // ─────────────────────────────────────────────────────────────────
  //
  // When a function or constructor has multiple signatures, each
  // becomes a separate entry in the overloads array.
  // @label JSDoc tags on overload signatures become the label field.

  describe('Overloads', () => {
    it('preserves multiple overload signatures', () => {
      const usePlayer = findByName('usePlayer', 'react');

      expect(usePlayer!.data.overloads.length).toBe(2);

      const useStore = findByName('useStore', 'react');

      expect(useStore!.data.overloads.length).toBe(2);
    });

    it('extracts @label from overload JSDoc', () => {
      const useFormat = findByName('useFormat', 'react');

      expect(useFormat!.data.overloads[0]!.label).toBe('Number');
      expect(useFormat!.data.overloads[1]!.label).toBe('String');
    });

    it('omits label when @label is absent', () => {
      const useStore = findByName('useStore', 'react');

      expect(useStore!.data.overloads[0]!.label).toBeUndefined();
    });

    it('applies type substitutions inside call signatures', () => {
      const useStore = findByName('useStore', 'react');
      const selector = useStore!.data.overloads[1]!.parameters.selector;

      expect(selector).toEqual({
        type: 'object',
        detailedType: "{ (state: S['state']): R; displayName?: string }",
        required: true,
      });
    });

    it('records function type parameters and their constraints', () => {
      const useStore = findByName('useStore', 'react');

      expect(useStore!.data.overloads[0]!.typeParameters).toEqual([{ name: 'S' }]);
      expect(useStore!.data.overloads[0]!.returnType).toBe('S');
      expect(useStore!.data.overloads[1]!.typeParameters).toEqual([
        { name: 'S', constraint: 'AnyStore' },
        { name: 'R' },
      ]);
    });

    it('includes inherited interface members in parameter types', () => {
      const useStore = findByName('useStore', 'react');

      expect(useStore!.data.overloads[1]!.parameters.options).toEqual({
        type: 'object',
        detailedType: "{ mode?: 'active' | 'passive'; disabled?: boolean; label?: string }",
      });
    });

    it('applies type substitutions inside construct signatures', () => {
      const createPlayer = findByName('createPlayer', 'html');
      const controller = createPlayer!.data.overloads[0]!.returnValue.fields!.PlayerController;

      expect(controller).toMatchObject({
        type: 'object',
        detailedType:
          '{ new (): PlayerController<VideoPlayerStore>; new <Result>(selector: Selector<VideoPlayerStore, Result>): PlayerController<VideoPlayerStore> }',
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // EXTRACTION SHAPE
  // ─────────────────────────────────────────────────────────────────
  //
  // Each util reference has: name, description?, overloads[].
  // Each overload has: label?, description?, parameters, returnValue.
  // Parameters and returnValue follow the same PropDef/StateDef shape
  // used by component references.

  describe('Extraction shape', () => {
    it('hooks have description and overloads with parameters + returnValue', () => {
      const usePlayer = findByName('usePlayer', 'react');

      expect(usePlayer!.data.description).toBeDefined();

      const overload = usePlayer!.data.overloads[0]!;

      expect(overload.returnValue).toBeDefined();
      expect(overload.returnValue.type).toBeDefined();
    });

    it('controllers have constructor params and public members as returnValue.fields', () => {
      const snapshot = findByName('SnapshotController', 'html');

      expect(snapshot!.data.description).toBeDefined();

      const overload = snapshot!.data.overloads[0]!;

      // Constructor parameters
      expect(overload.parameters.host).toBeDefined();

      // Return value type includes class name with type params
      expect(overload.returnValue.type).toContain('SnapshotController');

      // Public members as fields
      expect(overload.returnValue.fields).toBeDefined();
      expect(overload.returnValue.fields!.value).toBeDefined();
      expect(overload.returnValue.fields!.track).toMatchObject({
        type: 'function',
        detailedType: '(() => void)',
      });
      expect(overload.returnValue.fields!.untrack).toMatchObject({
        detailedType: '((delay?: number, ...reasons: string[]) => void)',
      });
    });

    it('types defaulted and rest parameters from their own annotations', () => {
      const useCompare = findByName('useCompare', 'react');
      const { parameters } = useCompare!.data.overloads[0]!;

      expect(parameters.value).toMatchObject({ type: 'T', required: true });
      expect(parameters.isEqual).toMatchObject({ type: 'function' });
      expect(parameters.isEqual!.detailedType).toContain('(a: T, b: T) => boolean');
      expect(parameters.isEqual!.required).toBeUndefined();
      expect(parameters.tags).toMatchObject({ type: 'string[]' });
      expect(parameters.tags!.required).toBeUndefined();
      expect(parameters.tags!.rest).toBe(true);
    });

    it('prints what a module-private alias names and keeps type parameter defaults', () => {
      const [overload] = findByName('useEntries', 'react')!.data.overloads;

      expect(overload!.typeParameters).toEqual([{ name: 'T', constraint: 'string', default: 'string' }]);
      expect(overload!.parameters._entries?.type ?? overload!.parameters.entries?.type).toBe(
        '({ kind: T } | undefined)[]'
      );
      expect(overload!.returnType).toBe('{ kind: T }[]');
    });

    it('groups a conditional member of a union', () => {
      const [overload] = findByName('useKindOf', 'react')!.data.overloads;

      expect(overload!.returnType).toBe("(S extends string ? 'text' : 'other') | undefined");
    });

    it('keeps the type parameters of a generic function type', () => {
      expect(findByName('useIdentity', 'react')!.data.overloads[0]!.returnType).toBe('(<T>(value: T) => T)');
    });

    it('records a parameter default value', () => {
      expect(findByName('useStep', 'react')!.data.overloads[0]!.parameters.step).toMatchObject({ default: '5' });
    });

    it('shows optional return fields as possibly undefined', () => {
      const { fields } = findByName('useShortcut', 'react')!.data.overloads[0]!.returnValue;

      expect(fields!.aria).toMatchObject({ type: 'string | undefined' });
      expect(fields!.keys).toMatchObject({ type: 'string' });
    });

    it('applies @displayType inside a type literal', () => {
      const { returnValue } = findByName('useBagHooks', 'react')!.data.overloads[0]!;

      expect(returnValue.detailedType ?? returnValue.type).toContain("Bag['state']");
      expect(returnValue.detailedType ?? returnValue.type).not.toContain('StateOf');
    });

    it("resolves a looked-up member in its own declaration's scope", () => {
      const { fields } = findByName('useEngineInput', 'react')!.data.overloads[0]!.returnValue;

      expect(fields!.input).toMatchObject({ type: 'Handle<string>' });
      expect(fields!.count).toMatchObject({ type: 'Handle' });
    });

    it('documents a function-typed member export as a function', () => {
      const [overload] = findByName('ToolkitProvider', 'react')!.data.overloads;

      expect(overload!.parameters.props).toMatchObject({ required: true });
      expect(overload!.parameters.props!.detailedType ?? overload!.parameters.props!.type).toContain('locale?: string');
      expect(overload!.returnValue.type).toBe('unknown');
    });

    it('marks controller overloads as constructors and omits host callbacks', () => {
      const snapshot = findByName('SnapshotController', 'html')!.data;

      expect(snapshot.overloads[0]).toMatchObject({
        construct: true,
        typeParameters: [{ name: 'S' }, { name: 'R', default: 'S' }],
      });
      expect(snapshot.overloads[0]!.returnValue.fields).not.toHaveProperty('hostConnected');
      expect(snapshot.overloads[0]!.returnValue.fields).not.toHaveProperty('hostDisconnected');
    });

    it('controller param descriptions have "- " prefix stripped', () => {
      const snapshot = findByName('SnapshotController', 'html');
      const hostParam = snapshot!.data.overloads[0]!.parameters.host;

      expect(hostParam!.description).toBe('The host element.');
      expect(hostParam!.description).not.toMatch(/^-\s/);
    });

    it('controller constructor overloads keep their @label', () => {
      const [withSelector, withoutSelector] = findByName('SnapshotController', 'html')!.data.overloads;

      expect(withSelector!.label).toBe('With Selector');
      expect(withoutSelector!.label).toBeUndefined();
    });

    it('contexts (@public non-function) have empty parameters and type as returnValue', () => {
      const ctx = findByName('playerContext', 'html');

      expect(ctx!.data.description).toBeDefined();

      const overload = ctx!.data.overloads[0]!;

      expect(overload.parameters).toEqual({});
      expect(overload.returnValue.type).toBeDefined();
    });

    it('selectors have parameters and returnValue', () => {
      const sel = findByName('selectPlayback', null);

      expect(sel!.data.description).toBeDefined();

      const overload = sel!.data.overloads[0]!;

      expect(Object.keys(overload.parameters).length).toBeGreaterThan(0);
      expect(overload.returnValue.type).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// FEATURE PIPELINE
// ═══════════════════════════════════════════════════════════════════════
//
// Features are defined via `definePlayerFeature()` and discovered from
// the features index. Each feature's state interface is split into two
// records: `state` (non-method properties) and `actions` (methods).
//
// Key behaviors:
//   - Discovery: singular *Feature exports from the features index
//   - Filtering: plural *Features (feature bundles) are excluded
//   - State extraction: interface properties → state record
//   - Action extraction: interface methods → actions record
//   - Published state: derived from the feature when state() annotates a
//     local interface rather than one from media/state.ts
//   - Config: `config` inputs → provider props, typed from the action they
//     forward to — a symbol-keyed private one or a public setter named
//     outright — defaulted from the state() initializer, described by JSDoc
//   - JSDoc: member descriptions flow through, interface-level JSDoc
//     becomes the feature description
//   - Type aliases: expanded in the output (MediaFeatureAvailability →
//     'available' | 'unavailable' | 'unsupported')
//   - Slug: derived from feature name, used for cross-linking from presets

describe('Feature pipeline (end-to-end)', () => {
  const results = generateFeatureReferences(FIXTURE_ROOT);

  function findFeature(name: string): FeatureResult | undefined {
    return results.find((r) => r.name === name);
  }

  // ─────────────────────────────────────────────────────────────────
  // DISCOVERY
  // ─────────────────────────────────────────────────────────────────

  describe('Discovery', () => {
    it('discovers features from the features index', () => {
      const names = results.map((r) => r.name);

      expect(names).toContain('captionStyle');
      expect(names).toContain('metadata');
      expect(names).toContain('orientationLock');
      expect(names).toContain('playback');
      expect(names).toContain('poster');
      expect(names).toContain('volume');
    });

    it('excludes feature bundles (plural *Features)', () => {
      const names = results.map((r) => r.name);

      expect(names).not.toContain('videoFeatures');
      expect(names).not.toContain('audioFeatures');
    });

    it('excludes namespace re-exports (export * as features)', () => {
      const names = results.map((r) => r.name);

      expect(names).not.toContain('features');
    });

    it('produces one result per feature', () => {
      expect(results.length).toBe(6);
    });
  });

  describe('orientationLock (silent feature)', () => {
    it('generates an empty reference for empty state', () => {
      const ref = findFeature('orientationLock')!.reference;

      expect(ref.state).toEqual({});
      expect(ref.actions).toEqual({});
    });

    it('has no configuration', () => {
      expect(findFeature('orientationLock')!.reference.config).toEqual({});
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // METADATA FEATURE (published state + configuration)
  // ─────────────────────────────────────────────────────────────────
  //
  // state() annotates MetadataSourceState, which is local to the feature, so
  // the published shape is derived. Here the interface omits every member of
  // the one it extends and keeps the rest behind symbols, so `derived` keys are
  // the whole published shape and there are no actions at all. `config` maps
  // two provider inputs onto private state keys and the symbol-keyed actions
  // that write them.

  describe('metadata (published shape derived from the feature)', () => {
    it('publishes derived keys with their inferred type and JSDoc', () => {
      const ref = findFeature('metadata')!.reference;

      expect(ref.state.title).toEqual({
        type: 'string',
        description: 'The resolved content title.',
      });
      expect(ref.state.poster).toEqual({
        type: 'string',
        description: 'The resolved poster URL.',
      });
    });

    it('publishes no actions when the source state keeps every writer private', () => {
      const ref = findFeature('metadata')!.reference;

      // An empty record, not a missing key: the model drops the section on
      // emptiness, so the reference must say "none" rather than "unknown".
      expect(ref.actions).toEqual({});
    });

    it('omits symbol-keyed source state as private', () => {
      const ref = findFeature('metadata')!.reference;

      expect(Object.keys(ref.state)).toEqual(['title', 'poster']);
      expect(JSON.stringify(ref)).not.toContain('__@');
    });

    it('describes itself from the feature export JSDoc', () => {
      const ref = findFeature('metadata')!.reference;

      expect(ref.description).toBe('Resolves user and media content metadata into player state.');
    });
  });

  describe('metadata (configuration)', () => {
    it('emits one input per config key, in declaration order', () => {
      const config = findFeature('metadata')!.reference.config;

      expect(Object.keys(config)).toEqual(['title', 'poster']);
    });

    it('types each input from the symbol-keyed action it forwards to', () => {
      const config = findFeature('metadata')!.reference.config;

      // MediaContentValue = string | null | undefined, reached through the
      // computed `[SET_USER_TITLE]` / `[SET_USER_POSTER]` members.
      for (const input of Object.values(config)) {
        expect(input.type).toContain('string');
        expect(input.type).toContain('null');
        expect(input.type).toContain('undefined');
      }
    });

    it('omits the default for an input whose state key starts at undefined', () => {
      const config = findFeature('metadata')!.reference.config;

      // An unset input is what an absent default already says; printing
      // "undefined" in the default column would be noise on every row.
      expect(config.title!.default).toBeUndefined();
      expect(config.poster!.default).toBeUndefined();
    });

    it('carries a declared attribute name, and leaves it off when the key is used as-is', () => {
      const config = findFeature('metadata')!.reference.config;

      // `title` is taken on an element, so the feature declares another name for
      // markup. `poster` isn't, so it takes the kebab-cased key and the
      // reference stays silent rather than repeating what the renderer derives.
      expect(config.title!.attribute).toBe('content-title');
      expect(config.poster!.attribute).toBeUndefined();
    });

    it('carries JSDoc from the config entry', () => {
      const config = findFeature('metadata')!.reference.config;

      expect(config.title!.description).toBe(
        'The title to display. Takes precedence over the title the media carries.'
      );
      expect(config.poster!.description).toBe(
        'The poster to display. Takes precedence over the poster the media carries.'
      );
    });

    it('leaves state and actions untouched by config extraction', () => {
      const volume = findFeature('volume')!.reference;

      expect(volume.config).toEqual({});
      expect(Object.keys(volume.state)).toContain('volume');
      expect(Object.keys(volume.actions)).toContain('setVolume');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // POSTER FEATURE (published-key defaults and narrow unions)
  // ─────────────────────────────────────────────────────────────────
  //
  // Metadata covers an input that names its action by string. Poster covers the
  // two steps that still have to follow a published key the rest of the way:
  // the initial value behind it, and a value type narrower than plain text.

  describe('poster (published-key defaults and narrow unions)', () => {
    it('reads the default through a plain state key', () => {
      const config = findFeature('poster')!.reference.config;

      expect(config.poster!.default).toBe("'/poster.jpg'");
    });

    // The fixture's PlayerFeatureConfig mirrors production, so a constraint that
    // drifted back to demanding exactly `string | null | undefined` would fail
    // this file's own type check before it reached the assertion.
    it('keeps a narrower union as the input type', () => {
      const config = findFeature('poster')!.reference.config;

      expect(config.posterFit!.type).toBe("undefined | null | 'contain' | 'cover'");
      expect(config.posterFit!.default).toBe("'contain'");
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // CAPTION STYLE FEATURE (public setter + config degrade paths)
  // ─────────────────────────────────────────────────────────────────
  //
  // `fontFamily` is the working named-action shape: public setters are optional
  // on a feature, and this is the one that carries an inherited one. The two
  // failures below produce output that looks fine and is wrong, so the warning
  // is part of the contract, not a nicety.

  describe('captionStyle (public setter and config degrade paths)', () => {
    function generateWithWarnings(): { results: FeatureResult[]; warnings: string[] } {
      const warnings: string[] = [];
      const spy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
        warnings.push(args.map(String).join(' '));
      });

      try {
        return { results: generateFeatureReferences(FIXTURE_ROOT), warnings };
      } finally {
        spy.mockRestore();
      }
    }

    it('types an input from a public setter named outright, following inheritance', () => {
      const config = findFeature('captionStyle')!.reference.config;

      // `setFontFamily` is declared on MediaCaptionStyleState, not on the
      // feature's own interface, so the type has to come from the resolved type
      // rather than the declaration's members.
      expect(config.fontFamily!.type).toContain('string');
      expect(config.fontFamily!.type).toContain('null');
      expect(config.fontFamily!.type).toContain('undefined');
    });

    it('resolves a named-constant initializer to its literal, not its identifier', () => {
      const config = findFeature('captionStyle')!.reference.config;

      // state() initializes this key to FALLBACK_FONT; printing that private
      // identifier into public docs would be meaningless to a reader.
      expect(config.fontFamily!.default).toBe("'sans-serif'");
    });

    it('falls back to an unresolved type when the action has no source-state member', () => {
      const { results: fresh, warnings } = generateWithWarnings();
      const config = fresh.find((r) => r.name === 'captionStyle')!.reference.config;

      expect(config.fontStretch!.type).toBe('unknown');
      expect(warnings.some((w) => w.includes('fontStretch') && w.includes('MISSING_ACTION'))).toBe(true);
    });

    it('drops an input whose action is neither an identifier nor a string, and says so', () => {
      const { results: fresh, warnings } = generateWithWarnings();
      const config = fresh.find((r) => r.name === 'captionStyle')!.reference.config;

      expect(config.fontSize).toBeUndefined();
      expect(warnings.some((w) => w.includes('fontSize') && w.includes('unreadable'))).toBe(true);
    });

    it('still publishes the feature state around the broken inputs', () => {
      const ref = findFeature('captionStyle')!.reference;

      expect(ref.state.fontFamily).toMatchObject({ type: 'string' });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // PLAYBACK FEATURE (simple: booleans + void methods)
  // ─────────────────────────────────────────────────────────────────
  //
  // MediaPlaybackState has:
  //   - paused: boolean (state)
  //   - ended: boolean (state)
  //   - play(): Promise<void> (action)
  //   - pause(): void (action)
  // No interface-level JSDoc → no feature description.

  describe('playback (simple feature)', () => {
    it('has name and slug', () => {
      const playback = findFeature('playback');

      expect(playback).toBeDefined();
      expect(playback!.slug).toBe('playback');
      expect(playback!.reference.name).toBe('playback');
      expect(playback!.reference.slug).toBe('playback');
    });

    it('emits the docs slug of its reference page', () => {
      expect(findFeature('playback')!.reference.docsSlug).toBe('reference/api/feature-playback');
      expect(findFeature('orientationLock')!.reference.docsSlug).toBe('reference/api/feature-orientation-lock');
    });

    it('has no description (no interface-level JSDoc)', () => {
      const ref = findFeature('playback')!.reference;

      expect(ref.description).toBeUndefined();
    });

    it('extracts boolean properties as state', () => {
      const state = findFeature('playback')!.reference.state;

      expect(state.paused).toEqual({
        type: 'boolean',
        description: 'Whether playback is paused.',
      });
      expect(state.ended).toEqual({
        type: 'boolean',
        description: 'Whether playback has reached the end.',
      });
    });

    it('extracts methods as actions', () => {
      const actions = findFeature('playback')!.reference.actions;

      expect(actions.play).toBeDefined();
      expect(actions.play).toMatchObject({ type: 'function' });
      expect(actions.play!.detailedType).toContain('Promise');
      expect(actions.play!.description).toBe('Start playback.');

      expect(actions.pause).toBeDefined();
      expect(actions.pause).toMatchObject({ type: 'function' });
      expect(actions.pause!.detailedType).toContain('void');
      expect(actions.pause!.description).toBe('Pause playback.');
    });

    it('does not mix state and actions', () => {
      const ref = findFeature('playback')!.reference;

      // Methods should not appear in state
      expect(ref.state['play' as keyof typeof ref.state]).toBeUndefined();
      expect(ref.state['pause' as keyof typeof ref.state]).toBeUndefined();
      // Properties should not appear in actions
      expect(ref.actions['paused' as keyof typeof ref.actions]).toBeUndefined();
      expect(ref.actions['ended' as keyof typeof ref.actions]).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // VOLUME FEATURE (complex: types, params, returns, description)
  // ─────────────────────────────────────────────────────────────────
  //
  // MediaVolumeState has interface-level JSDoc → feature description.
  //   - volume: number (state)
  //   - muted: boolean (state)
  //   - volumeAvailability: MediaFeatureAvailability (state, type alias)
  //   - setVolume(volume: number): number (action with param + return)
  //   - toggleMuted(): boolean (action with return)

  describe('volume (complex feature)', () => {
    it('has description from interface-level JSDoc', () => {
      const ref = findFeature('volume')!.reference;

      expect(ref.description).toBe('Controls audio volume and mute state.');
    });

    it('extracts state with various types', () => {
      const state = findFeature('volume')!.reference.state;

      expect(state.volume).toMatchObject({
        type: 'number',
        description: 'Volume level from 0 (silent) to 1 (max).',
      });

      expect(state.muted).toMatchObject({
        type: 'boolean',
        description: 'Whether audio is muted.',
      });
    });

    it('expands type aliases in state', () => {
      const state = findFeature('volume')!.reference.state;
      // MediaFeatureAvailability should be expanded to the union
      const avail = state.volumeAvailability!;

      expect(avail.type).toContain("'available'");
      expect(avail.type).toContain("'unavailable'");
      expect(avail.type).toContain("'unsupported'");
    });

    it('extracts actions with parameters and return types', () => {
      const actions = findFeature('volume')!.reference.actions;

      // setVolume has a parameter and returns a number
      expect(actions.setVolume).toBeDefined();
      expect(actions.setVolume).toMatchObject({ type: 'function' });
      expect(actions.setVolume!.detailedType).toContain('number');
      expect(actions.setVolume!.description).toBe('Set volume (clamped 0-1). Returns the clamped value.');

      // toggleMuted returns a boolean
      expect(actions.toggleMuted).toBeDefined();
      expect(actions.toggleMuted).toMatchObject({ type: 'function' });
      expect(actions.toggleMuted!.detailedType).toContain('boolean');
      expect(actions.toggleMuted!.description).toBe('Toggle mute state. Returns the new muted value.');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// PRESET PIPELINE
// ═══════════════════════════════════════════════════════════════════════
//
// Presets bundle features, skins, and media elements for a specific use
// case. They are discovered from package.json exports in
// packages/{html,react}/.
//
// Key behaviors:
//   - Discovery: reads package.json exports for ./X + ./X/* pairs
//   - Feature bundle: *Features export from barrel → resolved to feature names
//   - HTML skins: classes with static tagName whose name matches *Skin*Element
//   - HTML media element: classes with static tagName that aren't skins or
//     players; native tags derived from the React media element (Video →
//     video, Audio → audio) when the scan finds none
//   - React skins: exports matching *Skin naming
//   - React media element: remaining exports that aren't bundles or skins
//   - Tailwind exclusion: .tailwind files are filtered out
//   - Player exclusion: *Player* classes are filtered out

describe('Preset pipeline (end-to-end)', () => {
  const results = generatePresetReferences(FIXTURE_ROOT);

  function findPreset(name: string): PresetResult | undefined {
    return results.find((r) => r.name === name);
  }

  // ─────────────────────────────────────────────────────────────────
  // DISCOVERY
  // ─────────────────────────────────────────────────────────────────

  describe('Discovery', () => {
    it('discovers presets from package.json exports', () => {
      const names = results.map((r) => r.name).sort();

      expect(names).toEqual(['audio', 'background', 'video']);
    });

    it('produces one result per preset', () => {
      expect(results.length).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // VIDEO PRESET (full: multiple skins, tailwind exclusion)
  // ─────────────────────────────────────────────────────────────────

  describe('video preset', () => {
    it('extracts description from file-level JSDoc', () => {
      const ref = findPreset('video')!.reference;

      expect(ref.description).toContain('Mock React video preset');
    });

    it('identifies the feature bundle', () => {
      const ref = findPreset('video')!.reference;

      expect(ref.featureBundle).toBe('videoFeatures');
    });

    it('resolves feature names from the bundle', () => {
      const ref = findPreset('video')!.reference;

      expect(ref.features.map((f) => f.name)).toEqual(expect.arrayContaining(['playback', 'volume']));
      expect(ref.features.length).toBe(2);
    });

    it('emits docs slugs for features', () => {
      const ref = findPreset('video')!.reference;
      const playback = ref.features.find((f) => f.name === 'playback');
      const volume = ref.features.find((f) => f.name === 'volume');

      expect(playback?.slug).toBe('reference/api/feature-playback');
      expect(volume?.slug).toBe('reference/api/feature-volume');
    });

    it('flags hasReference true when the feature MDX page exists', () => {
      const ref = findPreset('video')!.reference;
      const playback = ref.features.find((f) => f.name === 'playback');

      expect(playback?.hasReference).toBe(true);
    });

    it('flags hasReference false when the feature MDX page is missing', () => {
      const ref = findPreset('video')!.reference;
      const volume = ref.features.find((f) => f.name === 'volume');

      expect(volume?.hasReference).toBe(false);
    });

    it('detects HTML skins with tagNames', () => {
      const skins = findPreset('video')!.reference.html.skins;

      expect(skins).toEqual(
        expect.arrayContaining([
          { name: 'VideoSkinElement', tagName: 'video-skin' },
          { name: 'MinimalVideoSkinElement', tagName: 'video-minimal-skin' },
        ])
      );
    });

    it('excludes HTML tailwind skins', () => {
      const skinNames = findPreset('video')!.reference.html.skins.map((s) => s.name);

      expect(skinNames).not.toContain('VideoSkinTailwindElement');
    });

    it('derives the native HTML media element from the React media component', () => {
      const ref = findPreset('video')!.reference;

      expect(ref.html.mediaElement).toBe('video');
    });

    it('detects React skins with CSS imports', () => {
      const skins = findPreset('video')!.reference.react.skins;

      expect(skins).toEqual(
        expect.arrayContaining([
          { name: 'VideoSkin', cssImport: '@videojs/react/video/skin.css' },
          { name: 'MinimalVideoSkin', cssImport: '@videojs/react/video/minimal-skin.css' },
        ])
      );
    });

    it('excludes React tailwind skins', () => {
      const skinNames = findPreset('video')!.reference.react.skins.map((s) => s.name);

      expect(skinNames).not.toContain('VideoSkinTailwind');
    });

    it('detects React media element', () => {
      const ref = findPreset('video')!.reference;

      expect(ref.react.mediaElement).toBe('Video');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // AUDIO PRESET (minimal: single skin, subset of features)
  // ─────────────────────────────────────────────────────────────────

  describe('audio preset', () => {
    it('identifies the feature bundle', () => {
      const ref = findPreset('audio')!.reference;

      expect(ref.featureBundle).toBe('audioFeatures');
    });

    it('resolves feature names (subset of video)', () => {
      const ref = findPreset('audio')!.reference;

      expect(ref.features.map((f) => f.name)).toEqual(['playback']);
    });

    it('detects single HTML skin', () => {
      const skins = findPreset('audio')!.reference.html.skins;

      expect(skins).toEqual([{ name: 'AudioSkinElement', tagName: 'audio-skin' }]);
    });

    it('derives the native HTML media element from the React media component', () => {
      const ref = findPreset('audio')!.reference;

      expect(ref.html.mediaElement).toBe('audio');
    });

    it('detects single React skin with CSS import', () => {
      const skins = findPreset('audio')!.reference.react.skins;

      expect(skins).toEqual([{ name: 'AudioSkin', cssImport: '@videojs/react/audio/skin.css' }]);
    });

    it('detects React media element', () => {
      const ref = findPreset('audio')!.reference;

      expect(ref.react.mediaElement).toBe('Audio');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // BACKGROUND PRESET (incomplete barrel, custom media element)
  // ─────────────────────────────────────────────────────────────────

  describe('background preset', () => {
    it('identifies the feature bundle', () => {
      const ref = findPreset('background')!.reference;

      expect(ref.featureBundle).toBe('backgroundFeatures');
    });

    it('resolves empty features array', () => {
      const ref = findPreset('background')!.reference;

      expect(ref.features).toEqual([]);
    });

    it('detects HTML skin from directory scan (not in barrel)', () => {
      const skins = findPreset('background')!.reference.html.skins;

      expect(skins).toEqual([{ name: 'BackgroundVideoSkinElement', tagName: 'background-video-skin' }]);
    });

    it('detects HTML media element via export * chain', () => {
      const ref = findPreset('background')!.reference;

      expect(ref.html.mediaElement).toBe('background-video');
    });

    it('excludes player elements', () => {
      const skinNames = findPreset('background')!.reference.html.skins.map((s) => s.name);

      expect(skinNames).not.toContain('BackgroundVideoPlayerElement');
    });

    it('detects React skin without CSS import when no CSS file exists', () => {
      const skins = findPreset('background')!.reference.react.skins;

      expect(skins).toEqual([{ name: 'BackgroundVideoSkin' }]);
    });

    it('detects React media element', () => {
      const ref = findPreset('background')!.reference;

      expect(ref.react.mediaElement).toBe('BackgroundVideo');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // CROSS-CUTTING: feature links
  // ─────────────────────────────────────────────────────────────────

  describe('Cross-cutting', () => {
    it('feature names in presets match feature reference slugs', () => {
      const featureResults = generateFeatureReferences(FIXTURE_ROOT);
      const featureSlugs = featureResults.map((r) => r.slug);

      const videoPreset = findPreset('video')!.reference;

      for (const feature of videoPreset.features) {
        expect(featureSlugs).toContain(feature.name);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MEDIA ELEMENT PIPELINE
// ═══════════════════════════════════════════════════════════════════════
//
// Media elements are custom elements that adapt native <video>/<audio> targets
// or embedded players. They are discovered from
// packages/html/src/define/media/*.ts and public nested index.ts barrels by
// looking for files that declare a class with `static tagName`.
//
// The builder extracts:
//   - Tag name from the element class's static tagName
//   - Host properties by following the CustomMediaElement(tag, Host) call to the
//     host class and walking its getter/setter pairs
//   - Standard/custom attributes from static properties and host accessors
//   - Platform metadata from the matching React component conventions
//   - Events and CSS vars for the HTML custom element
//   - JSDoc descriptions from host getter/setter pairs
//
// Key behaviors:
//   - Discovery: files in define/media/ and public nested barrels with an inline
//     class declaration + static tagName
//   - Exclusion: container.ts (re-exports, no inline class), background-video.ts
//     (no CustomMediaElement — uses MediaAttachMixin(HTMLElement) directly)
//   - Host inheritance: child host extends parent, builder walks the chain
//   - Attribute classification: standard attributes remain an MDN-linked list;
//     Video.js-specific attributes use their corresponding host definitions.
//   - Methods: native media methods are extracted ONCE per media type from the
//     shared base host classes (html-media-adapter + html-video-adapter/html-audio-adapter).
//   - Properties: the inherited native surface is compact, while source-authored
//     definitions retain types, defaults, and descriptions.
//   - Event buckets: custom (@fires-tagged) events live ONLY in `custom`, never
//     in the standard MDN-linked list.
//   - React: forwardRef and useSyncProps conventions produce the ref target and
//     Video.js-specific prop table without per-element configuration.

describe('Media element pipeline (end-to-end)', () => {
  const results = generateMediaElementReferences(FIXTURE_ROOT);

  function findElement(name: string): MediaElementResult | undefined {
    return results.find((r) => r.name === name);
  }

  // ─────────────────────────────────────────────────────────────────
  // DISCOVERY
  // ─────────────────────────────────────────────────────────────────

  describe('Discovery', () => {
    it('discovers media elements from define/media/ files', () => {
      const names = results.map((r) => r.name).sort();

      expect(names).toEqual([
        'BarrelVideo',
        'ComplexVideo',
        'EmbedVideo',
        'ExtendingVideo',
        'MixinVideo',
        'SimpleVideo',
        'SpfAudio',
      ]);
    });

    it('does not treat the UI container as a media element', () => {
      expect(findElement('ContainerElement')).toBeUndefined();
    });

    it('excludes background-video (no CustomMediaElement, manually maintained)', () => {
      expect(findElement('BackgroundVideo')).toBeUndefined();
      expect(findElement('BackgroundVideoElement')).toBeUndefined();
    });

    it('produces one result per media element', () => {
      expect(results.length).toBe(7);
    });

    it('follows nested public index barrels without including sibling implementations', () => {
      expect(findElement('BarrelVideo')?.reference.tagName).toBe('barrel-video');
    });

    it('omits engineOptions for hosts with no structured source', () => {
      // SimpleVideo exposes `engine` (the live player instance) but no `source`,
      // so there is no engine config to document.
      expect(findElement('SimpleVideo')!.reference.engineOptions).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // SIMPLE MEDIA ELEMENT: SimpleVideo
  // ─────────────────────────────────────────────────────────────────
  //
  // A minimal media element with a simple host (src rw, engine readonly).
  // No JSDoc on host properties — descriptions should be undefined.
  // No overlap between host props and native attributes (engine is not
  // in static properties), so nativeAttributes should be the full shared list.

  describe('SimpleVideo (minimal host)', () => {
    it('extracts the tag name', () => {
      const ref = findElement('SimpleVideo')!.reference;

      expect(ref.tagName).toBe('simple-video');
      expect(ref.mediaType).toBe('video');
    });

    it('extracts host properties with types and readonly flags', () => {
      const props = findElement('SimpleVideo')!.reference.platforms.html.properties.definitions;

      // src: read-write string
      expect(props.src).toMatchObject({
        type: 'string',
        readonly: false,
      });
      expect(props.src.description).toBeUndefined();

      // engine: readonly, unannotated getter — type inferred by the checker
      // (would be 'unknown' if the builder only read syntactic annotations).
      expect(props.engine).toMatchObject({
        type: 'object',
        readonly: true,
      });
    });

    it('excludes host lifecycle methods (attach, detach, destroy)', () => {
      const props = findElement('SimpleVideo')!.reference.platforms.html.properties.definitions;

      expect(props.attach).toBeUndefined();
      expect(props.detach).toBeUndefined();
      expect(props.destroy).toBeUndefined();
    });

    it('separates standard attributes from Video.js-specific attributes', () => {
      const ref = findElement('SimpleVideo')!.reference;

      expect(ref.platforms.html.attributes.standard).toEqual(
        expect.arrayContaining([
          'autoplay',
          'controls',
          'crossorigin',
          'loop',
          'muted',
          'playsinline',
          'poster',
          'preload',
        ])
      );
      expect(ref.platforms.html.attributes.standard).toContain('src');
      expect(ref.platforms.html.attributes.standard).not.toContain('stream-type');
      expect(ref.platforms.html.attributes.custom['stream-type']).toMatchObject({
        type: 'string',
        readonly: false,
      });
      expect(ref.platforms.html.attributes.custom['stream-type'].description).toContain('Current stream type');
    });

    it('extracts native media methods from the shared base host classes', () => {
      const ref = findElement('SimpleVideo')!.reference;

      // Video methods = html-media-adapter methods + html-video-adapter methods, deduped + sorted.
      // Lifecycle methods (attach/detach/destroy) and accessors are excluded.
      expect(ref.platforms.html.methods).toEqual(['canPlayType', 'load', 'pause', 'play', 'requestFullscreen']);
    });

    it('excludes ECMAScript-private and @internal methods', () => {
      const methods = findElement('SimpleVideo')!.reference.platforms.html.methods;

      expect(methods).not.toContain('privateMethod');
      expect(methods).not.toContain('internalMethod');
    });

    it('extracts native passthrough properties from the shared base host classes', () => {
      const ref = findElement('SimpleVideo')!.reference;

      // Video native properties = html-media-adapter + html-video-adapter accessors, filtered to
      // genuine native members and deduped against hostProperties. `currentTime`
      // and `volume` come from html-media-adapter; `videoWidth` is video-only.
      expect(ref.platforms.html.properties.native).toEqual(['currentTime', 'videoWidth', 'volume']);
      // Video.js-specific base accessors receive full definitions instead.
      expect(ref.platforms.html.properties.native).not.toContain('streamType');
      expect(ref.platforms.html.properties.native).not.toContain('isFullscreen');
      expect(ref.platforms.html.properties.definitions.streamType).toBeDefined();
      expect(ref.platforms.html.properties.definitions.isFullscreen).toBeDefined();
      // `src` is native but re-declared in hostProperties → deduped out (shown in
      // the rich table instead).
      expect(ref.platforms.html.properties.definitions.src).toBeDefined();
      expect(ref.platforms.html.properties.native).not.toContain('src');
    });

    it('includes events derived from VideoEvents capability contracts', () => {
      const ref = findElement('SimpleVideo')!.reference;

      // Events are extracted from VideoEvents in types.ts, which extends all
      // capability event interfaces including TextTrackListEvents. Custom
      // Video.js events from MediaStreamTypeEvents/MediaLiveEvents
      // (streamtypechange) are NOT native and are excluded here — they only
      // appear in elementSpecific, and only on elements that @fires them.
      expect(ref.platforms.html.events.standard).toEqual([
        'play',
        'playing',
        'waiting',
        'pause',
        'ended',
        'timeupdate',
        'durationchange',
        'seeking',
        'seeked',
        'loadedmetadata',
        'loadstart',
        'emptied',
        'canplay',
        'canplaythrough',
        'loadeddata',
        'volumechange',
        'ratechange',
        'progress',
        'error',
        'addtrack',
        'removetrack',
        'changetrack',
        'trackmodechange',
      ]);
      // SimpleHost dispatches no events of its own.
      expect(ref.platforms.html.events.custom).toEqual([]);
    });

    it('omits custom events entirely when the element does not @fires them', () => {
      // Regression guard: streamtypechange lives in the VideoEvents contract via
      // MediaStreamTypeEvents, but SimpleVideo has no @fires tag for it (and no
      // streamType event documentation). A custom event must never leak into the standard list
      // (which points readers at MDN) — with no @fires it appears in NEITHER
      // bucket. Mirrors dash-video / hls-video in the real monorepo.
      const ref = findElement('SimpleVideo')!.reference;

      expect(ref.platforms.html.events.standard).not.toContain('streamtypechange');
      const elementSpecificNames = ref.platforms.html.events.custom.map((e) => e.name);

      expect(elementSpecificNames).not.toContain('streamtypechange');
    });

    it('includes CSS custom properties from VideoCSSVars', () => {
      const css = findElement('SimpleVideo')!.reference.platforms.html.cssCustomProperties;

      expect(css['--media-object-fit']).toEqual({
        description: 'Object fit for the video.',
      });
      expect(css['--media-video-border-radius']).toEqual({
        description: 'Border radius of the video element.',
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // COMPLEX MEDIA ELEMENT: ComplexVideo
  // ─────────────────────────────────────────────────────────────────
  //
  // A full media element with a complex host that has JSDoc descriptions,
  // multiple property types, and overlap with native attributes (src, preload).
  // Tests that the builder extracts descriptions from JSDoc on getters and
  // deduplicates host props from nativeAttributes.

  describe('ComplexVideo (full host, JSDoc, deduplication)', () => {
    it('extracts the tag name', () => {
      const ref = findElement('ComplexVideo')!.reference;

      expect(ref.tagName).toBe('complex-video');
    });

    it('extracts all host properties', () => {
      const props = findElement('ComplexVideo')!.reference.platforms.html.properties.definitions;
      const propNames = Object.keys(props).sort();

      expect(propNames).toEqual([
        'config',
        'debug',
        'engine',
        'isFullscreen',
        'onReady',
        'preferPlayback',
        'preload',
        'src',
        'streamType',
        'type',
      ]);
    });

    it('extracts JSDoc descriptions from host getters', () => {
      const props = findElement('ComplexVideo')!.reference.platforms.html.properties.definitions;

      expect(props.type.description).toBe('Explicit source type. When unset, inferred from the source URL extension.');
      expect(props.preferPlayback.description).toBe("Whether to prefer `'mse'` or `'native'` playback.");
      expect(props.debug.description).toBe('Enable debug logging.');
      expect(props.engine.description).toBe('The underlying playback engine instance.');
      expect(props.onReady).toMatchObject({
        type: 'function',
        detailedType: '((value: string) => void) | undefined',
        description: 'Callback invoked when playback is ready.',
        readonly: true,
      });
    });

    it('marks readonly properties correctly', () => {
      const props = findElement('ComplexVideo')!.reference.platforms.html.properties.definitions;

      // engine: getter only → readonly
      expect(props.engine.readonly).toBe(true);
      // src: getter + setter → not readonly
      expect(props.src.readonly).toBe(false);
      expect(props.debug.readonly).toBe(false);
    });

    it('extracts property types', () => {
      const props = findElement('ComplexVideo')!.reference.platforms.html.properties.definitions;

      expect(props.src.type).toBe('string');
      expect(props.debug.type).toBe('boolean');
      expect(props.config.type).toContain('Record');
    });

    it('keeps host-owned attributes in BOTH hostProperties and nativeAttributes', () => {
      const ref = findElement('ComplexVideo')!.reference;

      // src and preload are richer host properties AND genuinely settable as
      // markup attributes — the intentional content-attribute vs IDL-property
      // overlap. They appear in hostProperties...
      expect(ref.platforms.html.properties.definitions.src).toBeDefined();
      expect(ref.platforms.html.properties.definitions.preload).toBeDefined();
      // ...and ALSO in nativeAttributes (no dedup).
      expect(ref.platforms.html.attributes.standard).toContain('src');
      expect(ref.platforms.html.attributes.standard).toContain('preload');
      // Other native attrs remain
      expect(ref.platforms.html.attributes.standard).toContain('autoplay');
      expect(ref.platforms.html.attributes.standard).toContain('controls');
    });

    it('extracts defaults from the co-located defaultProps export', () => {
      const props = findElement('ComplexVideo')!.reference.platforms.html.properties.definitions;

      // Literal values are emitted as source text (strings keep their quotes).
      expect(props.src.default).toBe("''");
      expect(props.debug.default).toBe('false');
      expect(props.preload.default).toBe("'metadata'");
      expect(props.preferPlayback.default).toBe("'mse'");
      // `undefined` defaults are omitted — they convey nothing beyond the
      // table's "—" placeholder.
      expect(props.type.default).toBeUndefined();
      // Empty object literals stay literal.
      expect(props.config.default).toBe('{}');
    });

    it('resolves const-object member defaults through imports', () => {
      // streamType: MediaStreamTypes.UNKNOWN — the builder resolves the member
      // access to its literal value in the imported `as const` object.
      const props = findElement('ComplexVideo')!.reference.platforms.html.properties.definitions;

      expect(props.streamType.default).toBe("'unknown'");
    });

    it('omits defaults for properties without a defaultProps entry', () => {
      const props = findElement('ComplexVideo')!.reference.platforms.html.properties.definitions;

      expect(props.engine.default).toBeUndefined();
    });

    it('extracts the matching React surface from source conventions', () => {
      const react = findElement('ComplexVideo')!.reference.platforms.react;

      expect(react).toMatchObject({
        target: 'video',
        acceptsNativeProps: true,
      });
      expect(Object.keys(react!.props).sort()).toEqual([
        'config',
        'debug',
        'preferPlayback',
        'preload',
        'src',
        'streamType',
        'type',
      ]);
      expect(react!.props.streamType.default).toBe("'unknown'");
      expect(react!.props.engine).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // EMBED MEDIA ELEMENT: EmbedVideo
  // ─────────────────────────────────────────────────────────────────

  describe('EmbedVideo (iframe-backed media)', () => {
    it('uses the target declared by CustomMediaElement', () => {
      const ref = findElement('EmbedVideo')!.reference;

      expect(ref.platforms.html.target).toBe('iframe');
      expect(ref.platforms.react?.target).toBe('iframe');
    });

    it('does not invent native video properties, methods, or CSS for an iframe target', () => {
      const html = findElement('EmbedVideo')!.reference.platforms.html;

      expect(html.properties.native).toEqual([]);
      expect(html.methods).toEqual(['play']);
      expect(html.cssCustomProperties).toEqual({});
    });

    it('documents only attributes implemented by the synthetic media host', () => {
      const attributes = findElement('EmbedVideo')!.reference.platforms.html.attributes;

      expect(attributes.standard).toEqual([]);
      expect(Object.keys(attributes.custom).sort()).toEqual(['autoplay', 'src']);
      expect(attributes.custom['stream-type']).toBeUndefined();
    });

    it('documents only events dispatched by the embedded media adapter', () => {
      const events = findElement('EmbedVideo')!.reference.platforms.html.events;

      expect(events.standard).toEqual(['play', 'waiting', 'loadedmetadata']);
      expect(events.custom).toEqual([{ name: 'adapterready' }]);
    });

    it('extracts custom React props without claiming native media props', () => {
      const react = findElement('EmbedVideo')!.reference.platforms.react;

      expect(react).toMatchObject({ target: 'iframe', acceptsNativeProps: false });
      expect(Object.keys(react!.props).sort()).toEqual(['autoplay', 'source', 'src']);
    });

    it('extracts engine options by following the source property type', () => {
      const ref = findElement('EmbedVideo')!.reference;

      expect(Object.keys(ref.engineOptions ?? {})).toEqual(['embed']);
      expect(ref.engineOptions?.embed).toEqual([
        {
          name: 'cc_load_policy',
          type: '0 | 1 | undefined',
          description: 'Show captions by default. Defaults to `0`.',
        },
        {
          name: 'hl',
          type: 'string | undefined',
          description: 'Player interface language, as a BCP 47 tag.',
        },
        {
          name: 'referrerPolicy',
          type: 'ReferrerPolicy | undefined',
          description: '`referrerpolicy` for the embed iframe. Not an embed parameter.',
        },
        // Present in the API surface, so documented as existing even with no
        // description to give it.
        { name: 'undocumented', type: 'string | undefined' },
      ]);
    });

    it('keeps an engine option that carries no JSDoc, without a description', () => {
      const options = findElement('EmbedVideo')!.reference.engineOptions?.embed ?? [];
      const undocumented = options.find((option) => option.name === 'undocumented');

      expect(undocumented).toBeDefined();
      expect(undocumented?.description).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // EXTENDING MEDIA ELEMENT: ExtendingVideo
  // ─────────────────────────────────────────────────────────────────
  //
  // A media element whose host extends another host (mirrors
  // MuxVideoAdapter extending HlsMedia). The builder must walk the
  // extends chain to include inherited properties. Child properties
  // override parent definitions.

  describe('ExtendingVideo (host inheritance)', () => {
    it('extracts the tag name', () => {
      const ref = findElement('ExtendingVideo')!.reference;

      expect(ref.tagName).toBe('extending-video');
    });

    it('includes own properties from ExtendingHost', () => {
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      expect(props.playbackId).toMatchObject({
        type: 'string',
        readonly: false,
        description: 'The playback ID for the video.',
      });
      expect(props.customDomain).toMatchObject({
        type: 'string',
        readonly: false,
        description: 'Custom domain for asset delivery.',
      });
    });

    it('includes inherited properties from ComplexHost', () => {
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      // These are inherited from ComplexHost
      expect(props.src).toBeDefined();
      expect(props.type).toBeDefined();
      expect(props.preferPlayback).toBeDefined();
      expect(props.config).toBeDefined();
      expect(props.preload).toBeDefined();
      expect(props.engine).toBeDefined();
    });

    it('child overrides replace parent definitions', () => {
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      // ExtendingHost overrides debug with different JSDoc
      expect(props.debug.description).toBe('Overrides parent debug — adds network logging.');
    });

    it('inherited readonly flags are preserved', () => {
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      // engine is readonly in ComplexHost and not overridden
      expect(props.engine.readonly).toBe(true);
    });

    it('resolves spread defaults through the parent host static defaultProps', () => {
      // ExtendingHost.defaultProps = { ...ComplexHost.defaultProps, ... } —
      // the builder must follow the spread to the parent's static literal.
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      expect(props.src.default).toBe("''");
      expect(props.debug.default).toBe('false');
      expect(props.streamType.default).toBe("'unknown'");
    });

    it('extracts the React surface from a static defaultProps that spreads the parent host', () => {
      const react = findElement('ExtendingVideo')!.reference.platforms.react;

      expect(react).toMatchObject({ target: 'video', acceptsNativeProps: true });
      expect(Object.keys(react!.props).sort()).toEqual([
        'config',
        'debug',
        'maxResolution',
        'playbackId',
        'preferPlayback',
        'preload',
        'src',
        'streamType',
        'tokens',
        'type',
      ]);
      expect(react!.props.maxResolution.default).toBe('1080');
      expect(react!.props.streamType.default).toBe("'unknown'");
    });

    it('extracts own defaults alongside spread defaults', () => {
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      expect(props.playbackId.default).toBe("''");
      expect(props.maxResolution.default).toBe('1080');
    });

    it('abbreviates non-empty object defaults', () => {
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      expect(props.tokens.default).toBe('{…}');
    });

    it('omits defaults for properties without an entry', () => {
      const props = findElement('ExtendingVideo')!.reference.platforms.html.properties.definitions;

      expect(props.customDomain.default).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // CROSS-CUTTING: EVENT EXTRACTION
  // ─────────────────────────────────────────────────────────────────
  //
  // Events are derived from the capability contract types in
  // packages/media/src/core/types.ts, not hardcoded.
  // VideoEvents includes TextTrackListEvents; AudioEvents does not.

  describe('Event extraction from capability contracts', () => {
    it('video elements include text track events from VideoEvents', () => {
      const ref = findElement('SimpleVideo')!.reference;

      expect(ref.platforms.html.events.standard).toContain('addtrack');
      expect(ref.platforms.html.events.standard).toContain('removetrack');
      expect(ref.platforms.html.events.standard).toContain('changetrack');
      expect(ref.platforms.html.events.standard).toContain('trackmodechange');
    });

    it('all video elements share the same native event list', () => {
      const simple = findElement('SimpleVideo')!.reference.platforms.html.events.standard;
      const complex = findElement('ComplexVideo')!.reference.platforms.html.events.standard;
      const extending = findElement('ExtendingVideo')!.reference.platforms.html.events.standard;

      expect(complex).toEqual(simple);
      expect(extending).toEqual(simple);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // MIXIN MEDIA ELEMENT: MixinVideo
  // ─────────────────────────────────────────────────────────────────
  //
  // A media element whose host extends a chain of mixins
  // (`MixinBVolumeMixin(MixinAFooMixin(MixinBaseHost))` — mirrors
  // `MuxDataMediaMixin(GoogleCastMixin(HlsMedia))`). The builder must walk
  // the call-expression extends, follow each mixin to its source file, and
  // collect getters/setters from each mixin's inner class.
  //
  // Also exercises:
  //   - overridesNative tagging for properties whose name matches an
  //     HTMLMediaElement member (volume)
  //   - Description fallback through the chain (src has JSDoc on the base,
  //     overridden without JSDoc by MixinB)
  //   - Element-specific event extraction via this.dispatchEvent(new Event(...))
  //     in mixin code (foochange dispatched by MixinAFooMixin)

  describe('MixinVideo (mixin chain)', () => {
    it('extracts the tag name', () => {
      const ref = findElement('MixinVideo')!.reference;

      expect(ref.tagName).toBe('mixin-video');
    });

    it('walks function-declaration mixin (Shape A)', () => {
      const props = findElement('MixinVideo')!.reference.platforms.html.properties.definitions;

      expect(props.foo).toMatchObject({
        type: 'string',
        readonly: false,
        description: 'Mixin A documentation.',
      });
    });

    it('walks const-arrow mixin (Shape B)', () => {
      const props = findElement('MixinVideo')!.reference.platforms.html.properties.definitions;

      expect(props.volume).toBeDefined();
      expect(props.volume.type).toBe('number');
      expect(props.volume.readonly).toBe(false);
    });

    it('includes leaf-class own properties', () => {
      const props = findElement('MixinVideo')!.reference.platforms.html.properties.definitions;

      expect(props.bar).toMatchObject({
        type: 'number',
        readonly: false,
        description: 'Leaf class own property.',
      });
    });

    it('marks volume as overridesNative (HTMLMediaElement member)', () => {
      const props = findElement('MixinVideo')!.reference.platforms.html.properties.definitions;

      expect(props.volume.overridesNative).toBe(true);
    });

    it('does not mark non-native properties as overridesNative', () => {
      const props = findElement('MixinVideo')!.reference.platforms.html.properties.definitions;

      expect(props.foo.overridesNative).toBeUndefined();
      expect(props.bar.overridesNative).toBeUndefined();
    });

    it('inherits parent description when child override has no JSDoc', () => {
      // src has JSDoc on MixinBaseHost; MixinB overrides without JSDoc.
      // The description should fall through from the base.
      const props = findElement('MixinVideo')!.reference.platforms.html.properties.definitions;

      expect(props.src.description).toBe('Source URL of the media.');
    });

    it('documents a @fires event ONLY in element-specific, never in native', () => {
      // streamtypechange is in VideoEvents (via MediaStreamTypeEvents) AND carries
      // a @fires tag on the mixin — mirrors HlsMedia. Element-specific events live
      // ONLY in the elementSpecific bucket (where they carry their description);
      // they are excluded from native so they are never listed twice.
      const ref = findElement('MixinVideo')!.reference;

      expect(ref.platforms.html.events.standard).not.toContain('streamtypechange');
      expect(ref.platforms.html.events.custom).toContainEqual({
        name: 'streamtypechange',
        description: 'Fired when the detected stream type changes.',
      });
    });

    it('does not document a dispatched-but-untagged event', () => {
      // foochange is dispatched via this.dispatchEvent(new Event('foochange')) but
      // has no @fires tag, so it is not surfaced — documentation requires a tag.
      const ref = findElement('MixinVideo')!.reference;
      const elementSpecificNames = ref.platforms.html.events.custom.map((e) => e.name);

      expect(elementSpecificNames).not.toContain('foochange');
    });

    it('separates native events from element-specific events', () => {
      const ref = findElement('MixinVideo')!.reference;
      const elementSpecificNames = ref.platforms.html.events.custom.map((e) => e.name);

      expect(ref.platforms.html.events.standard).toContain('play');
      expect(ref.platforms.html.events.standard).not.toContain('foochange');
      expect(elementSpecificNames).not.toContain('play');
    });

    it('extracts defaults declared in a mixin file', () => {
      const props = findElement('MixinVideo')!.reference.platforms.html.properties.definitions;

      expect(props.foo.default).toBe("''");
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // CROSS-PACKAGE MIXIN AUDIO ELEMENT: SpfAudio
  // ─────────────────────────────────────────────────────────────────
  //
  // An audio element whose host's only mixin lives in a different workspace
  // package (spf), reached through that package's barrel file — mirrors
  // HlsAudioAdapter extending HlsAudioMixin from @videojs/spf/hls.
  //
  // Also exercises:
  //   - @fires-declared event descriptions for events outside the native
  //     contract (audiomodechange also has a dispatch site, manifestparsed does
  //     not — the @fires tag alone surfaces both)
  //   - Defaults on the mixin's inner class (SpfAudioOnly.defaultProps)
  //   - AudioEvents capability contract

  describe('SpfAudio (cross-package mixin, audio host)', () => {
    it('extracts the tag name and audio media type', () => {
      const ref = findElement('SpfAudio')!.reference;

      expect(ref.tagName).toBe('spf-audio');
      expect(ref.mediaType).toBe('audio');
    });

    it('resolves the mixin through another package barrel', () => {
      const props = findElement('SpfAudio')!.reference.platforms.html.properties.definitions;

      expect(props.src).toMatchObject({
        type: 'string',
        readonly: false,
        description: 'Source URL of the HLS manifest.',
      });
      expect(props.preload).toMatchObject({
        type: 'string',
        readonly: false,
        description: 'Preload hint forwarded to the internal audio element.',
      });
    });

    it('extracts defaults declared next to the cross-package mixin', () => {
      const props = findElement('SpfAudio')!.reference.platforms.html.properties.definitions;

      expect(props.src.default).toBe("''");
      expect(props.preload.default).toBe("''");
    });

    it('uses AudioEvents for native events (no text track events)', () => {
      const ref = findElement('SpfAudio')!.reference;

      expect(ref.platforms.html.events.standard).toContain('play');
      expect(ref.platforms.html.events.standard).not.toContain('addtrack');
    });

    it('surfaces a @fires event with its tag description', () => {
      const ref = findElement('SpfAudio')!.reference;

      expect(ref.platforms.html.events.custom).toContainEqual({
        name: 'audiomodechange',
        description: 'Fired when the audio-only rendition changes.',
      });
    });

    it('includes @fires-declared events without a scanned dispatch site', () => {
      const ref = findElement('SpfAudio')!.reference;

      expect(ref.platforms.html.events.custom).toContainEqual({
        name: 'manifestparsed',
        description: 'Fired after the multivariant playlist is parsed.',
      });
    });

    it('sorts element-specific events by name', () => {
      const ref = findElement('SpfAudio')!.reference;
      const names = ref.platforms.html.events.custom.map((e) => e.name);

      expect(names).toEqual([...names].sort());
    });

    it('has empty AudioCSSVars', () => {
      const ref = findElement('SpfAudio')!.reference;

      expect(ref.platforms.html.cssCustomProperties).toEqual({});
    });

    it('extracts audio methods from the shared base host (no video-only methods)', () => {
      const ref = findElement('SpfAudio')!.reference;

      // Audio methods = html-media-adapter methods + html-audio-adapter methods. The fixture
      // audio host adds none, so video-only methods (requestFullscreen) are absent.
      expect(ref.platforms.html.methods).toEqual(['canPlayType', 'load', 'pause', 'play']);
      expect(ref.platforms.html.methods).not.toContain('requestFullscreen');
    });

    it('extracts native properties from the shared base host (no video-only props)', () => {
      const ref = findElement('SpfAudio')!.reference;

      // Audio native properties = html-media-adapter accessors only (audio host adds
      // none), filtered to native members and deduped against hostProperties
      // (src is re-declared by the mixin). videoWidth is video-only → absent.
      expect(ref.platforms.html.properties.native).toEqual(['currentTime', 'volume']);
      expect(ref.platforms.html.properties.native).not.toContain('videoWidth');
      expect(ref.platforms.html.properties.native).not.toContain('src');
    });
  });
});
