import { serializeAttributes } from '@videojs/utils/dom';
import { pick } from '@videojs/utils/object';

/**
 * Attributes forwarded to the inner `<video>`. `src` is deliberately not one of them: each element decides what to do
 * with it, whether that is assigning the inner video or handing it to a playback engine, and serializing it into the
 * template would start a native load either way.
 */
export const VideoAttributes = [
  'autoplay',
  'controls',
  'controlslist',
  'crossorigin',
  'disablepictureinpicture',
  'disableremoteplayback',
  'loop',
  'muted',
  'playsinline',
  'preload',
] as const;

/**
 * The shadow template both background-video elements render: a `<slot>` for a placeholder image, and a `<video>`
 * stretched over the host.
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
    <video${serializeAttributes(pick(attrs, [...VideoAttributes]))}></video>
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
