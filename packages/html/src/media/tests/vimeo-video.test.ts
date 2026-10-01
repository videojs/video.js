import { describe, expect, it } from 'vite-plus/test';

import { VimeoVideo } from '../vimeo-video/adapter';

let tagCounter = 0;

function defineVimeoVideo(): string {
  const tag = `test-vimeo-video-${tagCounter++}`;

  customElements.define(tag, class extends VimeoVideo {});
  return tag;
}

function iframeSrc(element: HTMLElement): string {
  return element.shadowRoot?.querySelector('iframe')?.getAttribute('src') ?? '';
}

/** Flush the microtask a deferred embed waits on so it sees every attribute. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('VimeoVideo', () => {
  it('builds the embed for a src set after the element is created', async () => {
    const tag = defineVimeoVideo();

    // How every framework builds the element: created first, `src` set after, so
    // the constructor runs with no attributes to build an embed from.
    const element = document.createElement(tag) as HTMLElement & { engine: unknown };

    expect(iframeSrc(element)).toBe('');

    element.setAttribute('src', 'https://vimeo.com/1181503036');
    await flushDeferredEmbed();

    expect(iframeSrc(element)).toContain('https://player.vimeo.com/video/1181503036');
    expect(element.engine).toBeTruthy();
    expect(new URL(iframeSrc(element)).searchParams.get('controls')).toBe('0');
  });

  it('builds the embed from attributes set after src in the same task', async () => {
    const tag = defineVimeoVideo();
    const element = document.createElement(tag) as HTMLElement & { engine: unknown };

    element.setAttribute('src', 'https://vimeo.com/1181503036');
    element.setAttribute('controls', '');
    await flushDeferredEmbed();

    const iframe = element.shadowRoot?.querySelector('iframe');

    expect(iframe).toBeTruthy();
    expect(iframe!.getAttribute('src')).toContain('https://player.vimeo.com/video/1181503036');
    expect(new URL(iframe!.src).searchParams.has('controls')).toBe(false);
    expect(element.engine).toBeTruthy();
  });
});
