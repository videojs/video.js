import { type Browser, type BrowserContextOptions, test as base } from '@playwright/test';
import playwrightPkg from 'playwright-core/package.json' with { type: 'json' };

import { getIosDevice } from './ios-device.ts';

export interface Options {
  caps: Record<string, string>;
}

export const test = base.extend<{ session: Browser }, Options>({
  caps: [{}, { option: true, scope: 'worker' }],
  context: async ({ session: browser, baseURL, viewport, actionTimeout }, use) => {
    const options: BrowserContextOptions = { viewport };

    if (baseURL) options.baseURL = baseURL;

    // Explicit undefined prevents the runner injecting a download value rejected by older remote engines.
    // The client omits it when serializing the protocol request.
    Object.assign(options, { acceptDownloads: undefined });

    const context = await browser.newContext(options);

    context.setDefaultTimeout(actionTimeout);

    try {
      await use(context);
    } finally {
      await context.close();
    }
  },
  // Real iOS sessions permit only one context, so connect separately for each test.
  session: async ({ playwright, caps }, use, testInfo) => {
    if (process.env.BROWSERSTACK_LOCAL_TEST) {
      const browser = await playwright.chromium.launch();

      try {
        await use(browser);
      } finally {
        await browser.close();
      }

      return;
    }

    const username = process.env.BROWSERSTACK_USERNAME;
    const key = process.env.BROWSERSTACK_ACCESS_KEY;
    if (!username || !key) throw new Error('Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY.');

    const deviceName = caps.realMobile ? await getIosDevice(caps.osVersion!, username, key) : undefined;

    if (deviceName) console.log(`BrowserStack iOS ${caps.osVersion}: ${deviceName}`);

    const capabilities = {
      ...caps,
      deviceName,
      'browserstack.username': username,
      'browserstack.accessKey': key,
      'browserstack.local': true,
      'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER ?? 'videojs',
      'client.playwrightVersion': playwrightPkg.version,
      project: 'Video.js 10',
      build: process.env.BROWSERSTACK_BUILD ?? 'local',
      name: testInfo.project.name,
    };

    // The legacy endpoint also accepts these real-device field names.
    if (deviceName) Object.assign(capabilities, { device: deviceName, os_version: caps.osVersion });

    const endpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(capabilities))}`;
    const type = caps.realMobile ? playwright.webkit : playwright.chromium;
    // Connection errors can include the endpoint, which contains the credentials.
    const browser = await type.connect(endpoint, { timeout: 60_000 }).catch(() => {
      throw new Error(
        `BrowserStack could not connect to ${testInfo.project.name}. Check its availability and credentials.`
      );
    });

    try {
      await use(browser);
    } finally {
      await browser.close();
    }
  },
});

export { expect } from '@playwright/test';
