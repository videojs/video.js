import { render } from '@testing-library/react';
import { type ComponentType, type CSSProperties } from 'react';
import { describe, expect, it } from 'vite-plus/test';

import { CloudflareVideo } from '../cloudflare-video';
import { PlayerJsVideo } from '../playerjs-video';
import { TikTokVideo } from '../tiktok-video';
import { TwitchVideo } from '../twitch-video';
import { VimeoVideo } from '../vimeo-video';
import { YouTubeVideo } from '../youtube-video';

type EmbedProps = { controls?: boolean; style?: CSSProperties };

function iframeOf(container: HTMLElement): HTMLIFrameElement {
  return container.querySelector('iframe')!;
}

describe.each([
  ['YouTubeVideo', YouTubeVideo],
  ['VimeoVideo', VimeoVideo],
  ['TwitchVideo', TwitchVideo],
  ['CloudflareVideo', CloudflareVideo],
  ['TikTokVideo', TikTokVideo],
  ['PlayerJsVideo', PlayerJsVideo],
] as [string, ComponentType<EmbedProps>][])('%s pointer events', (_, Embed) => {
  it('keeps a chromeless embed out of hit-testing so the skin above it sees hover and clicks', () => {
    const { container } = render(<Embed />);

    expect(iframeOf(container).style.pointerEvents).toBe('none');
  });

  it('leaves pointer events to the embed while it shows its own controls', () => {
    const { container, rerender } = render(<Embed controls />);
    const iframe = iframeOf(container);

    expect(iframe.style.pointerEvents).toBe('');

    rerender(<Embed />);
    expect(iframe.style.pointerEvents).toBe('none');

    rerender(<Embed controls />);
    expect(iframe.style.pointerEvents).toBe('');
  });

  it('merges a consumer style without letting it put a chromeless embed back into hit-testing', () => {
    const { container, rerender } = render(<Embed style={{ borderRadius: 8, pointerEvents: 'auto' }} />);
    const iframe = iframeOf(container);

    expect(iframe.style.borderRadius).toBe('8px');
    expect(iframe.style.pointerEvents).toBe('none');

    rerender(<Embed controls style={{ borderRadius: 8 }} />);
    expect(iframe.style.borderRadius).toBe('8px');
    expect(iframe.style.pointerEvents).toBe('');
  });
});
