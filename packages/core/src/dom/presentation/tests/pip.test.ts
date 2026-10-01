import { afterEach, describe, expect, it } from 'vite-plus/test';

import { PlayerExtensionCoordinator } from '../../extensions/coordinator';
import { isPictureInPicture } from '../pip';

describe('isPictureInPicture', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'pictureInPictureElement');
  });

  it('recognizes the media behind a player facade as the picture-in-picture element', () => {
    const video = document.createElement('video');
    const extensions = new PlayerExtensionCoordinator(() => {});

    extensions.register({ mediaOverride: null });

    const media = extensions.getStoreMedia(video);

    expect(isPictureInPicture(media)).toBe(false);

    Object.defineProperty(document, 'pictureInPictureElement', { value: video, configurable: true });

    expect(isPictureInPicture(media)).toBe(true);
  });
});
