// Sessions queue when the account's parallel limit is reached, so each attempt waits longer than a cold start.
export const CONNECT_TIMEOUT = 90_000;
export const RETRY_DELAYS = [10_000, 20_000];
/** Worst-case time spent connecting, so callers can extend the test timeout to cover it. */
export const CONNECT_BUDGET = CONNECT_TIMEOUT * (RETRY_DELAYS.length + 1) + RETRY_DELAYS.reduce((a, b) => a + b, 0);

export async function connectWithRetry<T>(
  connect: (timeout: number) => Promise<T>,
  { name, secrets }: { name: string; secrets: string[] }
): Promise<T> {
  // Connection errors can include the endpoint, which contains the credentials.
  const redact = (message: string) => secrets.reduce((text, secret) => text.replaceAll(secret, '***'), message);
  const failures: string[] = [];

  for (let attempt = 0; ; attempt++) {
    try {
      return await connect(CONNECT_TIMEOUT);
    } catch (error) {
      failures.push(`Attempt ${attempt + 1}: ${redact(error instanceof Error ? error.message : String(error))}`);
    }

    const delay = RETRY_DELAYS[attempt];
    if (delay === undefined) break;

    console.warn(`BrowserStack could not connect to ${name}; retrying in ${delay / 1000}s.\n${failures.at(-1)}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(`BrowserStack could not connect to ${name}.\n${failures.join('\n')}`);
}
