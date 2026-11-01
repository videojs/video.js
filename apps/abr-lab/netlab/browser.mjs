// Chromium inside the lab network, driven from the host over Playwright's remote protocol.
import { chromium } from 'playwright-core';

const server = await chromium.launchServer({
  host: '0.0.0.0',
  port: 3100,
  wsPath: '/abr-lab',
  // The origin's certificate is self-signed and minted at container start.
  args: ['--ignore-certificate-errors'],
});

console.log(`browser server at ${server.wsEndpoint()}`);
