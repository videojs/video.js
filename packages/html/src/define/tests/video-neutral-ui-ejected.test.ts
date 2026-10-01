import { describe, expect, it } from 'vite-plus/test';

describe('video/neutral-ui ejected registration', () => {
  it('upgrades input feedback when light DOM exists before registration', async () => {
    document.body.innerHTML = /*html*/ `
      <video-player>
        <media-container>
          <video></video>
          <media-status-announcer></media-status-announcer>
          <media-volume-indicator></media-volume-indicator>
          <media-status-indicator></media-status-indicator>
          <media-seek-indicator></media-seek-indicator>
        </media-container>
      </video-player>
    `;

    await import('../video/neutral-ui');

    const announcer = document.querySelector('media-status-announcer')!;
    const indicators = [
      ...document.querySelectorAll('media-volume-indicator, media-status-indicator, media-seek-indicator'),
    ];

    await (announcer as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;
    await Promise.all(
      indicators.map((indicator) => (indicator as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete)
    );

    expect(announcer.getAttribute('role')).toBe('status');
    expect(announcer.querySelector('[data-status-announcer-content]')).not.toBeNull();
    expect(indicators.every((indicator) => (indicator as HTMLElement).hidden)).toBe(true);
    expect(customElements.get('media-popover')).toBeDefined();
    expect(customElements.get('media-menu')).toBeDefined();
  });
});
