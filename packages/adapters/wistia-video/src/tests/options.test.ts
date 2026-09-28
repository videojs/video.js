import { describe, expect, it } from 'vite-plus/test';

import { wistiaAttributes, wistiaMediaOptions } from '../options';

describe('wistiaMediaOptions', () => {
  it('squares the corners Wistia rounds, which are the skin’s to round', () => {
    expect(wistiaMediaOptions({})).toMatchObject({ roundedPlayer: 0 });
  });

  it('spells looping the way Wistia does', () => {
    expect(wistiaMediaOptions({ loop: true })).toMatchObject({ endVideoBehavior: 'loop' });
    expect(wistiaMediaOptions({ loop: false })).toMatchObject({ endVideoBehavior: 'default' });
  });

  it('turns controls into the group of switches Wistia hides its chrome behind', () => {
    expect(wistiaMediaOptions({ controls: true })).toMatchObject({ bigPlayButton: true, playBarControl: true });
    expect(wistiaMediaOptions({ controls: false })).toMatchObject({ bigPlayButton: false, playBarControl: false });
  });

  it('decides the chrome for a media that never mentioned it, since Wistia’s default is to draw it', () => {
    expect(wistiaMediaOptions({})).toMatchObject({ bigPlayButton: false, playBarControl: false });
  });

  it('resolves an empty preload, which is what a bare attribute means and not a word Wistia knows', () => {
    expect(wistiaMediaOptions({ preload: '' })).toMatchObject({ preload: 'metadata' });
    expect(wistiaMediaOptions({ preload: 'none' })).toMatchObject({ preload: 'none' });
  });

  it('leaves out a prop that was never given, rather than overruling Wistia’s own configuration', () => {
    const options = wistiaMediaOptions({});

    expect(options).not.toHaveProperty('poster');
    expect(options).not.toHaveProperty('preload');
    expect(options).not.toHaveProperty('autoplay');
    expect(options).not.toHaveProperty('endVideoBehavior');
  });

  it('keeps the muted state and the source out of it, which are not the player’s configuration', () => {
    const options = wistiaMediaOptions({}) as Record<string, unknown>;

    expect(options).not.toHaveProperty('muted');
    expect(options).not.toHaveProperty('mediaId');
  });
});

describe('wistiaAttributes', () => {
  it('spells an option the way Wistia’s element observes it', () => {
    expect(wistiaAttributes({ mediaId: 'abcde12345', qualityMin: 540 })).toEqual({
      'media-id': 'abcde12345',
      'quality-min': '540',
    });
  });

  it('writes false out in full, since a dropped attribute is Wistia’s default instead', () => {
    expect(wistiaAttributes({ bigPlayButton: false })).toEqual({ 'big-play-button': 'false' });
  });

  it('leaves out an option with no attribute spelling rather than writing nonsense', () => {
    expect(wistiaAttributes({ playerColorGradient: { on: false }, poster: undefined })).toEqual({});
  });

  it('hands a member Wistia keeps on its prototype the boolean its setter reads, not a truthy spelling of it', () => {
    // React assigns these rather than writing them, and Wistia's setters branch on the value: `'false'` is a
    // string, so spelling it out mutes a player asked to be unmuted and autoplays one asked to stay put.
    expect(wistiaAttributes({ muted: false, autoplay: false, resumable: false, seo: false, swatch: false })).toEqual({
      muted: false,
      autoplay: false,
      resumable: false,
      seo: false,
      swatch: false,
    });
  });

  it('leaves the value of such a member alone whatever its type', () => {
    expect(wistiaAttributes({ aspect: 1.78, poster: 'poster.jpg', preload: 'metadata', muted: true })).toEqual({
      aspect: 1.78,
      poster: 'poster.jpg',
      preload: 'metadata',
      muted: true,
    });
  });
});
