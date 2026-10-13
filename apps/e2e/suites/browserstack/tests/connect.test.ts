import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { CONNECT_TIMEOUT, connectWithRetry } from '../connect.ts';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => vi.useRealTimers());

describe('connectWithRetry', () => {
  it('retries transient failures and returns the connection', async () => {
    const connect = vi.fn().mockRejectedValueOnce(new Error('queued')).mockResolvedValueOnce('browser');

    const result = connectWithRetry(connect, { name: 'edge-111', secrets: ['key'] });

    await vi.runAllTimersAsync();

    expect(await result).toBe('browser');
    expect(connect).toHaveBeenCalledTimes(2);
    expect(connect).toHaveBeenCalledWith(CONNECT_TIMEOUT);
  });

  it('reports every attempt with credentials redacted after the last retry', async () => {
    const connect = vi
      .fn()
      .mockRejectedValue(new Error('wss://cdp.browserstack.com?user=bs-user&key=s3cret timed out'));

    const result = connectWithRetry(connect, { name: 'edge-111', secrets: ['s3cret', 'bs-user'] });
    const assertion = expect(result).rejects.toThrow(
      /could not connect to edge-111\.\nAttempt 1: .*user=\*\*\*&key=\*\*\* timed out\nAttempt 2: .*\nAttempt 3: /
    );

    await vi.runAllTimersAsync();

    await assertion;
    expect(connect).toHaveBeenCalledTimes(3);
    await expect(result).rejects.not.toThrow(/s3cret/);
  });
});
