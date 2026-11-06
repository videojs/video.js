import {
  HyperFramesAdapter,
  type HyperFramesSource,
  type HyperFramesTimelineFactory,
} from '@videojs/hyperframes-video';
import { CustomMediaElement } from '@videojs/media/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

// `CustomMediaElement` and `MediaAttachMixin` implement the lifecycle callbacks but don't type them; declared so `super`
// can reach them.
interface HyperFramesCustomMediaElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
}

class HyperFramesCustomMediaElement extends CustomMediaElement('iframe', HyperFramesAdapter) {
  static override getTemplateHTML = (): string => /*html*/ `
    <style>
      :host {
        display: block;
        position: relative;
        min-width: 300px;
        min-height: 150px;
      }
      .frame {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }
      /* A composition has no chrome of its own: the skin above it takes every pointer event. */
      iframe {
        pointer-events: none;
      }
    </style>
    <div class="frame" part="frame">
      <iframe part="iframe" title="HyperFrames composition" allow="autoplay; fullscreen"></iframe>
    </div>
  `;
}

/**
 * Plays a HyperFrames composition written as the element's `<template>` child, or loaded from `src`. The template keeps
 * the markup inert in the page (its scripts do not run and its media does not load here) until the element writes it
 * into the composition frame. Setting `source` takes over from both.
 */
export class HyperFramesVideo extends MediaAttachMixin(HyperFramesCustomMediaElement) {
  #timeline: HyperFramesTimelineFactory | undefined;
  // The source this element built from its template, told apart from one a page set itself, which it leaves alone.
  #templateSource: HyperFramesSource | null = null;
  #childObserver: MutationObserver | null = null;
  #contentObserver: MutationObserver | null = null;
  #template: HTMLTemplateElement | null = null;

  /** Builds the composition's timeline from its root once the template's markup is in the frame. */
  get timeline(): HyperFramesTimelineFactory | undefined {
    return this.#timeline;
  }
  set timeline(value: HyperFramesTimelineFactory | undefined) {
    const playing = this.#templateSource !== null && this.adapter.source === this.#templateSource;

    this.#timeline = value;

    // The timeline is built when the composition loads, so one set on a composition already playing takes a reload.
    if (this.#syncTemplateSource() && playing) void this.adapter.load();
  }

  override connectedCallback() {
    super.connectedCallback?.();

    this.#childObserver ??= new MutationObserver(() => this.#syncTemplateSource());
    this.#childObserver.observe(this, { childList: true });
    this.#syncTemplateSource();
  }

  override disconnectedCallback() {
    this.#childObserver?.disconnect();
    this.#observeTemplate(null);
    super.disconnectedCallback?.();
  }

  // Point the adapter at the template child, unless the element plays something else. Returns whether it did.
  #syncTemplateSource(): boolean {
    const template = this.querySelector<HTMLTemplateElement>(':scope > template');
    const current = this.adapter.source;
    const owned = current === null || current === this.#templateSource;

    this.#observeTemplate(template);

    // A `src` attribute or a source the page set outranks the template.
    if (!template || !owned || this.hasAttribute('src')) return false;

    const source: HyperFramesSource = {
      content: template,
      ...(this.#timeline && { timeline: this.#timeline }),
    };

    this.#templateSource = source;
    this.adapter.source = source;
    return true;
  }

  // Edits inside a template's content leave the template the same element, so they are watched for and reloaded.
  #observeTemplate(template: HTMLTemplateElement | null) {
    if (template === this.#template) return;

    this.#contentObserver?.disconnect();
    this.#template = template;

    if (!template) return;

    this.#contentObserver ??= new MutationObserver(() => {
      if (this.#syncTemplateSource()) void this.adapter.load();
    });
    this.#contentObserver.observe(template.content, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
  }
}
