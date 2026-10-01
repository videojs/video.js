import { MediaError } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import {
  getErrorDialogDismissText,
  getErrorDialogTitleText,
  getMediaErrorTranslationKey,
  resolveErrorDialogDescription,
} from '../i18n';

describe('getMediaErrorTranslationKey', () => {
  it('maps standard MediaError codes to registry keys', () => {
    expect(getMediaErrorTranslationKey(MediaError.MEDIA_ERR_NETWORK)).toBe('errors.network');
    expect(getMediaErrorTranslationKey(MediaError.MEDIA_ERR_ABORTED)).toBe('errors.aborted');
  });
});

describe('getErrorDialogTitleText', () => {
  it('returns the error dialog title key', () => {
    expect(getErrorDialogTitleText()).toMatchObject({
      key: 'errors.title',
      text: 'Something went wrong.',
    });
  });
});

describe('getErrorDialogDismissText', () => {
  it('returns the dismiss button key', () => {
    expect(getErrorDialogDismissText()).toMatchObject({
      key: 'common.ok',
      text: 'OK',
    });
  });
});

describe('resolveErrorDialogDescription', () => {
  it('returns a registry key when the message matches the default for the code', () => {
    const error = new MediaError(undefined, MediaError.MEDIA_ERR_NETWORK);

    expect(resolveErrorDialogDescription(error, null)).toMatchObject({
      key: 'errors.network',
      text: 'This media could not be loaded due to a network or server issue.',
    });
  });

  it('returns custom message text when context is provided', () => {
    const error = new MediaError('Failed to open media', MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, 'hls');

    expect(resolveErrorDialogDescription(error, null)).toBe('Failed to open media');
  });

  it('returns custom message text on standard codes without context', () => {
    const error = new MediaError('App network failure', MediaError.MEDIA_ERR_NETWORK);

    expect(resolveErrorDialogDescription(error, null)).toBe('App network failure');
  });

  it('returns a registry key for browser-specific messages on standard codes', () => {
    const error = new MediaError('Failed to open media', MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);

    expect(resolveErrorDialogDescription(error, null)).toMatchObject({
      key: 'errors.source',
      text: 'This media could not be loaded. It may be unavailable, or your browser may not support its format.',
    });
  });

  it.each([
    [99001, 'errors.unplayable', 'This media is unsupported by the player.'],
    [
      MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
      'errors.source',
      'This media could not be loaded. It may be unavailable, or your browser may not support its format.',
    ],
  ] as const)('resolves empty-message code %s to %s', (code, key, text) => {
    // Engine pipeline failure needs different advice from a browser-unsupported source.
    expect(resolveErrorDialogDescription({ code, message: '' }, null)).toMatchObject({ key, text });
  });

  it('falls back to cached message then generic key', () => {
    expect(resolveErrorDialogDescription(null, 'Cached')).toBe('Cached');
    expect(resolveErrorDialogDescription(null, null)).toMatchObject({
      key: 'errors.unexpected',
      text: 'An unexpected error occurred.',
    });
  });
});
