import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { BackgroundVideoSkin } from '../skin';

afterEach(cleanup);

describe('BackgroundVideoSkin', () => {
  it('renders an extensible background surface around its children', () => {
    const { container } = render(
      <BackgroundVideoSkin className="hero" style={{ objectFit: 'contain' }}>
        <video />
      </BackgroundVideoSkin>
    );
    const skin = container.firstElementChild;

    expect(skin?.classList).toContain('media-background-skin');
    expect(skin?.classList).toContain('hero');
    expect(skin?.getAttribute('style')).toContain('object-fit: contain');
    expect(skin?.querySelector('video')).not.toBeNull();
  });
});
