import { describe, expect, it } from 'vite-plus/test';

import { DISCORD_INVITE_URL, GITHUB_REPO_URL, MUX_SUPPORT_URL, MUX_URL } from '@/consts';

import { getLinkDestination } from '../linkDestination';

describe('getLinkDestination', () => {
  it('classifies Mux pages on any mux.com host', () => {
    expect(getLinkDestination(MUX_URL)).toBe('mux');
    expect(getLinkDestination(MUX_SUPPORT_URL)).toBe('mux');
    expect(getLinkDestination('https://dashboard.mux.com/my/video/assets')).toBe('mux');
    expect(getLinkDestination('https://docs.mux.com/guides/data')).toBe('mux');
  });

  it('treats Mux stream and image assets as external', () => {
    expect(getLinkDestination('https://stream.mux.com/abc123.m3u8')).toBe('external');
    expect(getLinkDestination('https://image.mux.com/abc123/thumbnail.webp')).toBe('external');
  });

  it('classifies GitHub, Discord, and npm', () => {
    expect(getLinkDestination(GITHUB_REPO_URL)).toBe('github');
    expect(getLinkDestination('https://docs.github.com/en')).toBe('github');
    expect(getLinkDestination(DISCORD_INVITE_URL)).toBe('discord');
    expect(getLinkDestination('https://discord.com/channels/1')).toBe('discord');
    expect(getLinkDestination('https://www.npmjs.com/package/@videojs/html')).toBe('npm');
  });

  it('does not match a host that only ends with a known name', () => {
    expect(getLinkDestination('https://notmux.com')).toBe('external');
    expect(getLinkDestination('https://mux.com.example.net')).toBe('external');
  });

  it('classifies other web links as external', () => {
    expect(getLinkDestination('https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video')).toBe('external');
    expect(getLinkDestination('https://legacy.videojs.org')).toBe('external');
    expect(getLinkDestination('//example.com/page')).toBe('external');
  });

  it('returns undefined for links on this site', () => {
    expect(getLinkDestination('/docs/framework/html/guides/installation')).toBeUndefined();
    expect(getLinkDestination('#usage')).toBeUndefined();
    expect(getLinkDestination('../customize-skins')).toBeUndefined();
    expect(getLinkDestination('https://videojs.org/blog')).toBeUndefined();
    expect(getLinkDestination('https://www.videojs.org/blog')).toBeUndefined();
    expect(getLinkDestination('https://main.videojs.org/docs')).toBeUndefined();
  });

  it('returns undefined for non-web schemes and missing hrefs', () => {
    expect(getLinkDestination('mailto:hello@example.com')).toBeUndefined();
    expect(getLinkDestination(undefined)).toBeUndefined();
    expect(getLinkDestination(null)).toBeUndefined();
    expect(getLinkDestination('')).toBeUndefined();
  });

  it('accepts a URL object', () => {
    expect(getLinkDestination(new URL('https://www.npmjs.com/package/video.js'))).toBe('npm');
  });
});
