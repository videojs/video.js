import { PlayerPage } from '../../../shared/page-objects/player';
import { deepQuery, PAGES, readProbe } from '../probes.ts';
import { expect, test } from '../test.ts';
import { versions } from '../versions.ts';

for (const target of PAGES) {
  test(`${target.path}: skin fallbacks and playback`, async ({ page, caps }, testInfo) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));

    const player = new PlayerPage(page);

    await page.goto(target.path, { timeout: 60_000 });

    const userAgent = await page.evaluate(() => navigator.userAgent);

    await testInfo.attach('browser', { body: userAgent, contentType: 'text/plain' });

    if (caps.browser === 'chrome') expect(userAgent).toContain(`Chrome/${versions.chrome}.`);

    if (caps.browser === 'edge') expect(userAgent).toContain(`Edg/${versions.edge}.`);

    if (caps.browser === 'playwright-firefox') expect(userAgent).toContain(`Firefox/${versions.firefox}.`);

    if (caps.browser === 'playwright-webkit') expect(userAgent).toContain(`Version/${versions.safari}`);

    if (caps.realMobile) {
      const session: { os_version: string; browser_version: string; device: string } = JSON.parse(
        await page.evaluate(() => '', 'browserstack_executor: {"action":"getSessionDetails"}')
      );

      await testInfo.attach('device', {
        body: JSON.stringify({ os: session.os_version, browser: session.browser_version, device: session.device }),
        contentType: 'application/json',
      });

      expect(userAgent).toContain(`OS ${versions.ios.replaceAll('.', '_')}`);
    }

    await player.waitForMediaReady();

    // Real-device execution needs an explicit return instead of a bare expression string.
    await expect
      .poll(async () => {
        const probe = await page.evaluate<ReturnType<typeof readProbe>, string>(
          (source) => new Function(`return ${source}`)(),
          `(${readProbe.toString()})(${deepQuery.toString()})`
        );

        return probe?.styled;
      })
      .toBe(true);

    const probe = await page.evaluate<ReturnType<typeof readProbe>, string>(
      (source) => new Function(`return ${source}`)(),
      `(${readProbe.toString()})(${deepQuery.toString()})`
    );

    expect(probe).not.toBeNull();

    if (!probe) throw new Error('The skin root did not settle.');

    expect(probe.visibleClosedPopovers).toBe(0);
    expect(probe.bufferRight).not.toBeNull();
    expect(probe.bufferRight).not.toBe('auto');
    expect(
      target.preset === 'audio' ? ['rgb(255, 255, 255)', 'oklch(1 0 0)'] : ['rgb(0, 0, 0)', 'oklch(0 0 0)']
    ).toContain(probe.primaryForeground);

    if (target.preset === 'video') {
      expect(probe.scrim).toContain('gradient');
      expect(probe.frameBorder).not.toBe('rgb(255, 0, 0)');

      if (!target.path.includes('minimal')) expect(probe.surfaceBlur).toContain('blur');
    }

    // Unsupported H.264 or rejected playback must fail here.
    await player.play();
    await player.waitForPlayback(0.5);
    await player.playButton.dispatchEvent('click');
    // Poll the value directly: WebKit's pinned server lacks the newer attribute-value matcher.
    await expect.poll(() => player.playButton.getAttribute('data-paused'), { timeout: 5_000 }).toBe('');
    await player.seekTo(25);
    expect(await player.getCurrentTime()).toBeGreaterThan(1);

    if (target.preset === 'audio') await page.addStyleTag({ content: 'body { padding-top: 320px; }' });

    await player.playerRoot.dispatchEvent('pointermove', { pointerType: 'mouse' });

    if (target.preset === 'video') {
      await expect.poll(() => player.controls.getAttribute('data-visible')).toBe('');
    }

    await page.locator('[aria-haspopup="menu"]').first().click();
    await expect(page.locator('[role="menu"][data-open]').first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('menu.png') });
    expect(errors).toEqual([]);
  });
}
