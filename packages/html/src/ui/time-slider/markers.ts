import {
  getActiveTextCues,
  getTextCues,
  type TextTrackDefinition,
  TimeSliderMarkerCSSVars,
  TimeSliderMarkerDataAttrs,
  TimeSliderMarkersCore,
} from '@videojs/core';
import { applyStateDataAttrs, selectBuffer, selectTextCues, selectTime } from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextConsumer } from '@videojs/element/context';
import { getTimeRangeEnd, type TextTrackFilter, type TextTrackKind } from '@videojs/media';
import { cloneTemplateRoot, getTemplateElement, getTemplateRoot } from '@videojs/utils/dom';
import { isNil } from '@videojs/utils/predicate';

import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { sliderContext } from '../slider/context';
import { UIElement } from '../ui-element';

type TextTrackQuery = TextTrackFilter | TextTrackDefinition;

interface TextCuesWatch {
  watch: (filter: TextTrackFilter) => () => void;
  filter: TextTrackQuery;
  stop: () => void;
}

/**
 * Draws a marker on the time slider for each cue on the text tracks a filter matches, such as ad breaks. Pick tracks
 * with the `kind`, `label`, and `language` attributes, or with the `filter` property; with neither, nothing is drawn.
 * The store reads the matching tracks while the element is connected, so tracks it doesn't read by default work too.
 *
 * Each marker clones the light-DOM template, which must contain exactly one HTML root element, or is a `<div>` without
 * one. Markers are decorative: the slider's own value is what assistive technology reads.
 */
export class TimeSliderMarkersElement extends UIElement {
  static readonly tagName = 'media-time-slider-markers';

  static override properties = {
    kind: { type: String },
    label: { type: String },
    language: { type: String },
  } satisfies PropertyDeclarationMap<'kind' | 'label' | 'language'>;

  /** Draw cues from tracks of this kind. */
  kind: TextTrackKind | null | undefined;
  /** Draw cues from tracks with this label. */
  label: string | null | undefined;
  /** Draw cues from tracks in this language. */
  language: string | null | undefined;

  readonly #core = new TimeSliderMarkersCore();
  readonly #slider = new ContextConsumer(this, { context: sliderContext, subscribe: true });
  readonly #textCues = new PlayerController(this, playerContext, selectTextCues);
  readonly #time = new PlayerController(this, playerContext, selectTime);
  readonly #buffer = new PlayerController(this, playerContext, selectBuffer);
  readonly #rendered = new Map<string, HTMLElement>();
  #filter: TextTrackQuery | undefined;
  #attributeFilter: TextTrackFilter | undefined;
  #watching: TextCuesWatch | null = null;
  #templateRoot: HTMLElement | null = null;
  #templateChecked = false;

  /**
   * Picks the tracks whose cues are drawn: a filter object, a function, or a track definition. Takes priority over the
   * `kind`, `label`, and `language` attributes. Set as a JavaScript property; it has no attribute.
   */
  get filter(): TextTrackQuery | undefined {
    return this.#filter;
  }

  set filter(value: TextTrackQuery | undefined) {
    this.#filter = value;
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('aria-hidden', 'true');
  }

  override disconnectedCallback(): void {
    this.#unwatch();
    super.disconnectedCallback();
  }

  override destroyCallback(): void {
    this.#unwatch();
    super.destroyCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);

    if (changed.has('kind') || changed.has('label') || changed.has('language')) {
      this.#attributeFilter = this.#getAttributeFilter();
    }

    this.#watch(this.#getFilter());
  }

  protected override update(changed: PropertyValues): void {
    super.update(changed);

    const slider = this.#slider.value;
    const templateRoot = this.#getTemplateRoot();

    if (!slider) return;

    applyStateDataAttrs(this, slider.state, slider.stateAttrMap);

    const filter = this.#getFilter();
    const textCues = this.#textCues.value;
    const time = this.#time.value;
    const max = getTimeRangeEnd({ duration: time?.duration ?? 0, seekable: this.#buffer.value?.seekable ?? [] });

    const markers =
      filter && textCues
        ? this.#core.getMarkers({
            cues: getTextCues(textCues, filter),
            activeCues: getActiveTextCues(textCues, filter),
            min: 0,
            max,
            orientation: slider.state.orientation,
          })
        : [];

    const next = new Map<string, HTMLElement>();

    for (const marker of markers) {
      const root = this.#rendered.get(marker.key) ?? this.#createMarker(templateRoot);

      root.style.setProperty(TimeSliderMarkerCSSVars.start, marker.startPercent);
      root.style.setProperty(TimeSliderMarkerCSSVars.end, marker.endPercent);
      root.style.setProperty(TimeSliderMarkerCSSVars.width, marker.width ?? marker.height ?? '0%');
      applyStateDataAttrs(root, slider.state, slider.stateAttrMap);
      applyStateDataAttrs(root, marker, TimeSliderMarkerDataAttrs);

      next.set(marker.key, root);
    }

    for (const [key, root] of this.#rendered) {
      if (!next.has(key)) root.remove();
    }

    let before: ChildNode | null = null;

    for (const root of [...next.values()].reverse()) {
      if (root.parentNode !== this || root.nextSibling !== before) this.insertBefore(root, before);

      before = root;
    }

    this.#rendered.clear();

    for (const [key, rendered] of next) this.#rendered.set(key, rendered);
  }

  #getFilter(): TextTrackQuery | undefined {
    return this.#filter ?? this.#attributeFilter;
  }

  /** A filter from the attributes that are present, or none when no attribute is. */
  #getAttributeFilter(): TextTrackFilter | undefined {
    const { kind, label, language } = this;
    if (isNil(kind) && isNil(label) && isNil(language)) return undefined;

    return { kind: kind ?? undefined, label: label ?? undefined, language: language ?? undefined };
  }

  /** Ask the store to read the tracks the filter matches while the element is connected. */
  #watch(filter: TextTrackQuery | undefined): void {
    const watch = this.isConnected ? this.#textCues.value?.watchTextCues : undefined;
    if (this.#watching?.watch === watch && this.#watching?.filter === filter) return;

    this.#unwatch();

    if (watch && filter) this.#watching = { watch, filter, stop: watch(filter) };
  }

  #unwatch(): void {
    this.#watching?.stop();
    this.#watching = null;
  }

  #createMarker(templateRoot: HTMLElement | null): HTMLElement {
    return templateRoot ? cloneTemplateRoot(templateRoot, this.ownerDocument) : this.ownerDocument.createElement('div');
  }

  /** The template's root, found once; until there is a template, other content is cleared and markers are `<div>`s. */
  #getTemplateRoot(): HTMLElement | null {
    if (this.#templateChecked) return this.#templateRoot;

    const template = getTemplateElement(this);
    const rendered = new Set<ChildNode>(this.#rendered.values());

    for (const node of [...this.childNodes]) {
      if (node !== template && !rendered.has(node)) node.remove();
    }

    if (!template) return null;

    this.#templateChecked = true;

    // Markers drawn before the template arrived are redrawn from it.
    for (const node of rendered) node.remove();

    this.#rendered.clear();

    const root = getTemplateRoot(template);

    if (root?.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
      if (__DEV__) {
        console.warn(`[${this.localName}] template must contain exactly one HTML root element.`);
      }

      return null;
    }

    // SAFETY: the root was just checked to be in the XHTML namespace, so it is an HTML element.
    this.#templateRoot = root as HTMLElement;
    return this.#templateRoot;
  }
}
