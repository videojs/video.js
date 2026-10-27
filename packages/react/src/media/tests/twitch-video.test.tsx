import { render } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { TwitchVideo } from '../twitch-video';

describe('TwitchVideo', () => {
  it('starts the embed muted from the muted prop, which React never renders as an attribute', () => {
    const { container } = render(<TwitchVideo src="https://www.twitch.tv/videos/123456789" autoPlay muted />);

    expect(new URL(container.querySelector('iframe')!.src).searchParams.get('muted')).toBe('true');
  });
});
