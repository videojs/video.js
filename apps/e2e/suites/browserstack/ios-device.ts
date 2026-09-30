interface Device {
  os: string;
  os_version: string;
  device: string | null;
  real_mobile: boolean | string | null;
}

export async function getIosDevice(version: string, username: string, key: string): Promise<string> {
  const major = version.split('.')[0];
  const response = await fetch('https://api.browserstack.com/automate/browsers.json', {
    headers: { Authorization: `Basic ${Buffer.from(`${username}:${key}`).toString('base64')}` },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => {
    throw new Error('Could not fetch the BrowserStack device list.');
  });
  if (!response.ok) throw new Error(`BrowserStack device discovery failed: HTTP ${response.status}.`);

  const devices: unknown = await response.json();
  if (!Array.isArray(devices)) throw new Error('BrowserStack returned an invalid device list.');

  const device = devices
    .flatMap((entry: Device) =>
      entry.os.toLowerCase() === 'ios' &&
      (entry.os_version === version || entry.os_version === major) &&
      (entry.real_mobile === true || entry.real_mobile === 'true') &&
      entry.device?.startsWith('iPhone')
        ? [entry.device]
        : []
    )
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))[0];
  if (!device) throw new Error(`BrowserStack has no real iPhone supporting the browserslist minimum iOS ${version}.`);

  return device;
}
