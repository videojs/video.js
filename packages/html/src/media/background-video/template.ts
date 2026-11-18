import { serializeAttributes } from '@videojs/utils/dom';

/**
 * The shadow template both background-video elements render: a `<slot>` for a placeholder image, and a `<video>`
 * stretched over the host.
 *
 * `attrs` go onto the `<video>` as given; each element decides which of its own attributes to forward. `src` is never
 * among them, since serializing it would start a native load before an engine could take it.
 *
 * Shared so the two can't drift in presentation. `object-fit` and `object-position` are the only styling hooks — a
 * background video has no controls to theme.
 */
export function getTemplateHTML(attrs: Record<string, string>) {
  return /*html*/ `
    <style>
      :host {
        position: relative;
      }

      video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: var(--media-object-fit, inherit);
        object-position: var(--media-object-position, 50% 50%);
      }
    </style>
    <slot></slot>
    <video${serializeAttributes(attrs)}></video>
  `;
}

/**
 * The `<video>` from `getTemplateHTML`. Always the shadow one: the template has no slot that would render a light-DOM
 * `<video>`, so anything found there is either the placeholder or not displayed at all.
 */
export function getTemplateVideo(shadowRoot: ShadowRoot | null): HTMLVideoElement | null {
  const video = shadowRoot?.querySelector('video');

  return video instanceof HTMLVideoElement ? video : null;
}
