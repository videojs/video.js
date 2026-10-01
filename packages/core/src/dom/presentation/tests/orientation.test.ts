import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { collectUnhandledRejections } from '../../tests/test-helpers';
import { createScreenOrientationLock } from '../orientation';

function stubOrientation(orientation: Partial<ScreenOrientation>) {
  vi.stubGlobal('screen', { orientation });
}

describe('createScreenOrientationLock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('re-locks when the requested type changes', async () => {
    const orientation = {
      lock: vi.fn(async () => {}),
      unlock: vi.fn(),
    };

    stubOrientation(orientation);

    const screenLock = createScreenOrientationLock();

    await screenLock.lock('landscape');
    await screenLock.lock('portrait');

    expect(orientation.lock).toHaveBeenNthCalledWith(1, 'landscape');
    expect(orientation.lock).toHaveBeenNthCalledWith(2, 'portrait');
    expect(orientation.unlock).not.toHaveBeenCalled();
  });

  it('unlocks only after a successful lock', async () => {
    const orientation = {
      lock: vi.fn(async () => {}),
      unlock: vi.fn(),
    };

    stubOrientation(orientation);

    const screenLock = createScreenOrientationLock();

    screenLock.unlock();
    await screenLock.lock('landscape');
    await screenLock.lock('landscape');
    screenLock.unlock();
    screenLock.unlock();

    expect(orientation.lock).toHaveBeenCalledTimes(1);
    expect(orientation.unlock).toHaveBeenCalledTimes(1);
  });

  it('ignores missing browser APIs', async () => {
    stubOrientation({});

    const screenLock = createScreenOrientationLock();

    await expect(screenLock.lock('landscape')).resolves.toBeUndefined();
    screenLock.unlock();
  });

  it('releases orientation when unlock runs before lock settles', async () => {
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    const orientation = {
      lock: vi.fn(() => lockPromise),
      unlock: vi.fn(),
    };

    stubOrientation(orientation);

    const screenLock = createScreenOrientationLock();
    const lockTask = screenLock.lock('landscape');

    screenLock.unlock();
    resolveLock();
    await lockTask;

    expect(orientation.unlock).toHaveBeenCalledTimes(1);
  });

  it('issues one platform request while an earlier one is in flight', async () => {
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    const orientation = {
      lock: vi.fn<ScreenOrientation['lock']>().mockReturnValue(lockPromise),
      unlock: vi.fn(),
    };

    stubOrientation(orientation);

    const screenLock = createScreenOrientationLock();
    const lockTask = screenLock.lock('landscape');

    // A store publishes on every state change, so `sync` can re-request the
    // type it already asked for while the first request is still pending.
    await screenLock.lock('landscape');
    await screenLock.lock('landscape');

    expect(orientation.lock).toHaveBeenCalledTimes(1);

    resolveLock();
    await lockTask;

    expect(orientation.lock).toHaveBeenCalledTimes(1);
  });

  it('applies the latest requested type once an in-flight request settles', async () => {
    let resolveFirst!: () => void;
    const firstLock = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    const orientation = {
      lock: vi.fn<ScreenOrientation['lock']>().mockReturnValueOnce(firstLock).mockResolvedValue(undefined),
      unlock: vi.fn(),
    };

    stubOrientation(orientation);

    const screenLock = createScreenOrientationLock();
    const lockTask = screenLock.lock('landscape');

    // Portrait must not reach the platform yet: two overlapping requests can
    // settle in either order, leaving the screen on whichever landed last.
    void screenLock.lock('portrait');

    expect(orientation.lock).toHaveBeenCalledTimes(1);

    resolveFirst();
    await lockTask;

    expect(orientation.lock).toHaveBeenNthCalledWith(2, 'portrait');
    expect(orientation.lock).toHaveBeenCalledTimes(2);

    // Portrait is what the platform actually holds, so one release ends it.
    screenLock.unlock();

    expect(orientation.unlock).toHaveBeenCalledTimes(1);
  });

  it('re-requests a type whose earlier request the platform rejected', async () => {
    const orientation = {
      lock: vi.fn<ScreenOrientation['lock']>().mockResolvedValue(undefined),
      unlock: vi.fn(),
    };

    stubOrientation(orientation);

    const screenLock = createScreenOrientationLock();

    await screenLock.lock('landscape');

    orientation.lock.mockRejectedValueOnce(new Error('NotSupportedError'));
    await screenLock.lock('portrait');

    // The rejection must not be recorded as a held portrait lock; the platform
    // is still on landscape, so asking for portrait again has to reach it.
    await screenLock.lock('portrait');

    expect(orientation.lock).toHaveBeenNthCalledWith(3, 'portrait');
    expect(orientation.lock).toHaveBeenCalledTimes(3);
  });

  it('ignores rejected locks and thrown unlocks', async () => {
    const orientation = {
      lock: vi.fn<ScreenOrientation['lock']>().mockRejectedValue(new Error('NotAllowedError')),
      unlock: vi.fn(() => {
        throw new Error('InvalidStateError');
      }),
    };

    stubOrientation(orientation);

    const rejectedLock = createScreenOrientationLock();

    await expect(rejectedLock.lock('landscape')).resolves.toBeUndefined();
    rejectedLock.unlock();
    expect(orientation.unlock).not.toHaveBeenCalled();

    const acceptedLock = createScreenOrientationLock();

    orientation.lock.mockResolvedValue(undefined);
    await acceptedLock.lock('landscape');

    const reasons = await collectUnhandledRejections(() => acceptedLock.unlock());

    expect(orientation.unlock).toHaveBeenCalledOnce();
    expect(reasons).toEqual([]);
  });
});
