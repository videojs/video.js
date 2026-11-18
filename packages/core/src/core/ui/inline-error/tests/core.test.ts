import { MediaError } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { networkText, unexpectedText } from '../../../i18n/text/errors';
import { InlineErrorCore } from '../core';

describe('InlineErrorCore', () => {
  it('is hidden without an error', () => {
    const core = new InlineErrorCore();

    core.setMedia({ error: null });

    expect(core.getState()).toEqual({ visible: false });
    expect(core.getDescription()).toBe(unexpectedText);
  });

  it('shows the message for the current error', () => {
    const core = new InlineErrorCore();

    core.setMedia({ error: new MediaError(undefined, MediaError.MEDIA_ERR_NETWORK) });

    expect(core.getState()).toEqual({ visible: true });
    expect(core.getDescription()).toBe(networkText);
  });

  it('keeps the last message after the error clears', () => {
    const core = new InlineErrorCore();

    core.setMedia({ error: new MediaError('Custom failure', MediaError.MEDIA_ERR_CUSTOM) });
    core.setMedia({ error: null });

    expect(core.getState()).toEqual({ visible: false });
    expect(core.getDescription()).toBe('Custom failure');
  });
});
