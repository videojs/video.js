import { afterEach, describe, expect, it } from 'vite-plus/test';

import { VidyardVideo } from '../vidyard-video/adapter';

class TestVidyardVideo extends VidyardVideo {}

customElements.define('test-vidyard-video', TestVidyardVideo);

afterEach(() => {
  document.body.replaceChildren();
});

describe('VidyardVideo', () => {
  it('builds the player in a container slotted as media', async () => {
    const el = document.createElement('test-vidyard-video') as TestVidyardVideo;

    document.body.append(el);
    // `slotchange` is what hands the new container to the adapter.
    await new Promise((resolve) => setTimeout(resolve));

    const container = el.querySelector(':scope > [slot=media]');

    expect(container).toBeInstanceOf(HTMLDivElement);
    expect(el.adapter.target).toBe(container);
  });

  it('keeps a container the page already slotted', () => {
    const el = document.createElement('test-vidyard-video') as TestVidyardVideo;
    const container = document.createElement('div');

    container.slot = 'media';
    el.append(container);
    document.body.append(el);

    expect(el.querySelectorAll(':scope > [slot=media]')).toHaveLength(1);
    expect(el.adapter.target).toBe(container);
  });

  it('keeps one container when the element is moved', () => {
    const el = document.createElement('test-vidyard-video') as TestVidyardVideo;

    document.body.append(el);
    el.remove();
    document.body.append(el);

    expect(el.querySelectorAll(':scope > [slot=media]')).toHaveLength(1);
  });

  it('marks itself as a cross-origin frame', () => {
    const el = document.createElement('test-vidyard-video') as TestVidyardVideo;

    document.body.append(el);

    expect(el.hasAttribute('data-cross-origin-frame')).toBe(true);
  });

  it('slots the container into the media slot and fills the host with it', () => {
    const template = VidyardVideo.getTemplateHTML();

    expect(template).toMatch(/<slot name="media"><\/slot>/);
    expect(template).toMatch(/::slotted\(\[slot=media\]\)\s*\{\s*position: absolute;\s*inset: 0;/);
  });

  it("follows a mute made in Vidyard's controls, so unmuting through the element reaches the adapter", () => {
    const el = document.createElement('test-vidyard-video') as TestVidyardVideo;

    el.adapter.muted = true;

    expect(el.hasAttribute('muted')).toBe(true);

    el.muted = false;

    expect(el.adapter.muted).toBe(false);
    expect(el.hasAttribute('muted')).toBe(false);
  });
});
