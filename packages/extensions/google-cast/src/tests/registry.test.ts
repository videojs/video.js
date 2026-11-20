import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

/** A fresh registry, so each test starts before the framework has loaded. */
async function importRegistry() {
  vi.resetModules();

  return import('../registry');
}

beforeEach(() => {
  // An already available Cast API, so loading the framework settles without a script.
  vi.stubGlobal('chrome', { cast: { isAvailable: true } });
  vi.stubGlobal('cast', { framework: { name: 'framework' } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('whenCastFramework', () => {
  it('calls back once the framework loads', async () => {
    const { ensureCastFramework, whenCastFramework } = await importRegistry();
    const callback = vi.fn();

    whenCastFramework(callback);
    expect(callback).not.toHaveBeenCalled();

    await ensureCastFramework();

    expect(callback).toHaveBeenCalledExactlyOnceWith(cast.framework);
  });

  it('calls back right away when the framework already loaded', async () => {
    const { ensureCastFramework, whenCastFramework } = await importRegistry();
    const callback = vi.fn();

    await ensureCastFramework();
    whenCastFramework(callback);

    expect(callback).toHaveBeenCalledExactlyOnceWith(cast.framework);
  });

  it('does not call back once cancelled', async () => {
    const { ensureCastFramework, whenCastFramework } = await importRegistry();
    const callback = vi.fn();

    whenCastFramework(callback)();
    await ensureCastFramework();

    expect(callback).not.toHaveBeenCalled();
  });
});
