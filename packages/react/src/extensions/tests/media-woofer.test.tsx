import { render } from '@testing-library/react';
import { MediaWooferExtension } from '@videojs/media-woofer';
import { describe, expect, it } from 'vite-plus/test';

import { createPlayerWrapper } from '../../testing/mocks';
import { MediaWoofer } from '../media-woofer';

describe('MediaWoofer', () => {
  it('registers a MediaWooferExtension with the surrounding player', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    render(<MediaWoofer />, { wrapper: Wrapper });

    expect(extensions.get(MediaWooferExtension)).toBeInstanceOf(MediaWooferExtension);
  });

  it('syncs props to the extension and resets removed ones to their defaults', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { rerender } = render(<MediaWoofer threshold={200} vibration={0} />, { wrapper: Wrapper });
    const extension = extensions.get(MediaWooferExtension)!;

    expect(extension.threshold).toBe(200);
    expect(extension.vibration).toBe(0);

    rerender(<MediaWoofer />);

    expect(extension.threshold).toBe(MediaWooferExtension.defaultProps.threshold);
    expect(extension.vibration).toBe(MediaWooferExtension.defaultProps.vibration);
  });

  it('releases the extension on unmount', () => {
    const { extensions, Wrapper } = createPlayerWrapper();

    const { unmount } = render(<MediaWoofer />, { wrapper: Wrapper });

    unmount();

    expect(extensions.get(MediaWooferExtension)).toBeUndefined();
  });
});
