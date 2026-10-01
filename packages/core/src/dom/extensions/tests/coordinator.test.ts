import { getRegisteredMedia } from '@videojs/media';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../player';
import { PlayerExtensionCoordinator } from '../coordinator';
import type { ExtensionPlayer, PlayerExtension } from '../extension';

/** An observer: declares no `mediaOverride`. */
class TrackingExtension implements PlayerExtension {
  connect = vi.fn<(player: ExtensionPlayer) => void>();
  disconnect = vi.fn();
  attach = vi.fn<(target: PlayerTarget) => void>();
  detach = vi.fn();
  destroy = vi.fn();
}

class MutedExtension implements PlayerExtension {
  attach = vi.fn<(target: PlayerTarget) => void>();
  detach = vi.fn();

  get mediaOverride() {
    return { muted: true };
  }
}

/** Declares `mediaOverride` but has nothing to override yet, like Google Cast before a cast framework exists. */
class IdleOverrideExtension implements PlayerExtension {
  get mediaOverride() {
    return null;
  }
}

function createTarget(): PlayerTarget {
  return { media: document.createElement('video'), container: null };
}

describe('PlayerExtensionCoordinator', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('attaches a registered extension to the current target immediately', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const target = createTarget();
    const extension = new TrackingExtension();

    coordinator.attach(target);
    coordinator.register(extension);

    expect(extension.attach).toHaveBeenCalledWith(target);
    expect(coordinator.get(TrackingExtension)).toBe(extension);
  });

  it('attaches extensions registered before a target once one arrives', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const target = createTarget();
    const extension = new TrackingExtension();

    coordinator.register(extension);
    expect(extension.attach).not.toHaveBeenCalled();

    coordinator.attach(target);
    expect(extension.attach).toHaveBeenCalledWith(target);
  });

  it('connects extensions to the player on register, before they attach', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const extension = new TrackingExtension();

    coordinator.attach(createTarget());
    coordinator.register(extension);

    expect(extension.connect).toHaveBeenCalledTimes(1);
    expect(extension.connect.mock.invocationCallOrder[0]).toBeLessThan(extension.attach.mock.invocationCallOrder[0]!);
  });

  it('gives extensions the time the player was created, not the time they registered', () => {
    vi.useFakeTimers({ now: 1_000 });

    const coordinator = new PlayerExtensionCoordinator(() => {});
    const extension = new TrackingExtension();

    vi.setSystemTime(5_000);
    coordinator.register(extension);

    expect(extension.connect).toHaveBeenCalledWith({ initTime: 1_000 });
  });

  it('keeps extensions connected across media changes', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const extension = new TrackingExtension();

    coordinator.register(extension);
    coordinator.attach(createTarget());
    coordinator.attach(createTarget());
    coordinator.detach();

    expect(extension.connect).toHaveBeenCalledTimes(1);
    expect(extension.disconnect).not.toHaveBeenCalled();
  });

  it('detaches then disconnects an extension on release', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const extension = new TrackingExtension();

    coordinator.attach(createTarget());
    coordinator.register(extension)();

    expect(extension.detach).toHaveBeenCalledTimes(1);
    expect(extension.disconnect).toHaveBeenCalledTimes(1);
    expect(extension.detach.mock.invocationCallOrder[0]).toBeLessThan(
      extension.disconnect.mock.invocationCallOrder[0]!
    );
  });

  it('notifies on register and release of an extension that overrides media', () => {
    const onChange = vi.fn();
    const coordinator = new PlayerExtensionCoordinator(onChange);

    const remove = coordinator.register(new MutedExtension());

    expect(onChange).toHaveBeenCalledTimes(1);

    remove();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(coordinator.get(MutedExtension)).toBeUndefined();
  });

  it('does not notify for an observer', () => {
    const onChange = vi.fn();
    const coordinator = new PlayerExtensionCoordinator(onChange);

    coordinator.attach(createTarget());

    const remove = coordinator.register(new TrackingExtension());

    remove();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('is a no-op to register the same instance twice', () => {
    const onChange = vi.fn();
    const coordinator = new PlayerExtensionCoordinator(onChange);
    const extension = new MutedExtension();

    coordinator.attach(createTarget());
    coordinator.register(extension);
    coordinator.register(extension);

    expect(extension.attach).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('replaces an earlier instance of the same class and detaches it', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const first = new TrackingExtension();
    const second = new TrackingExtension();

    coordinator.attach(createTarget());

    const removeFirst = coordinator.register(first);

    coordinator.register(second);

    expect(first.detach).toHaveBeenCalledTimes(1);
    expect(first.disconnect).toHaveBeenCalledTimes(1);
    expect(second.connect).toHaveBeenCalledTimes(1);
    expect(second.attach).toHaveBeenCalledTimes(1);
    expect(coordinator.get(TrackingExtension)).toBe(second);

    // A stale release callback cannot remove the newer instance.
    removeFirst();
    expect(coordinator.get(TrackingExtension)).toBe(second);
  });

  it('moves extensions between media and ignores an unchanged one', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const extension = new TrackingExtension();
    const first = createTarget();
    const second = createTarget();

    coordinator.register(extension);
    coordinator.attach(first);
    coordinator.attach({ media: first.media, container: first.container });

    expect(extension.attach).toHaveBeenCalledTimes(1);
    expect(extension.detach).not.toHaveBeenCalled();

    coordinator.attach(second);

    expect(extension.detach).toHaveBeenCalledTimes(1);
    expect(extension.attach).toHaveBeenCalledTimes(2);
    expect(extension.attach).toHaveBeenLastCalledWith(second);
  });

  it('keeps extensions attached when only the container changes', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const extension = new TrackingExtension();
    const { media } = createTarget();

    coordinator.register(extension);
    coordinator.attach({ media, container: null });
    coordinator.attach({ media, container: document.createElement('div') });

    expect(extension.attach).toHaveBeenCalledTimes(1);
    expect(extension.detach).not.toHaveBeenCalled();
  });

  it('detaches extensions without destroying them', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const extension = new TrackingExtension();

    coordinator.attach(createTarget());
    coordinator.register(extension);
    coordinator.detach();

    expect(extension.detach).toHaveBeenCalledTimes(1);
    expect(extension.destroy).not.toHaveBeenCalled();

    // Removing while detached must not detach again, but does disconnect.
    coordinator.destroy();
    expect(extension.detach).toHaveBeenCalledTimes(1);
    expect(extension.disconnect).toHaveBeenCalledTimes(1);
    expect(extension.destroy).not.toHaveBeenCalled();
    expect(coordinator.size).toBe(0);
  });

  it('returns the media itself while no extension is registered', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const { media } = createTarget();

    expect(coordinator.getStoreMedia(media)).toBe(media);
  });

  it('returns the media itself while only observers are registered', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const { media } = createTarget();

    coordinator.register(new TrackingExtension());

    expect(coordinator.getStoreMedia(media)).toBe(media);
  });

  it('wraps the media once an extension that overrides media is registered', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const video = document.createElement('video');
    const remove = coordinator.register(new MutedExtension());
    const wrapped = coordinator.getStoreMedia(video);

    expect(wrapped).not.toBe(video);
    expect(wrapped.muted).toBe(true);
    expect(wrapped instanceof HTMLVideoElement).toBe(true);
    expect(getRegisteredMedia(wrapped)).toBe(video);

    // The facade tracks the live registry, so removal shows through without re-wrapping.
    remove();
    expect(wrapped.muted).toBe(false);
  });

  it('wraps for an extension that declares an override even while it has none', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const video = document.createElement('video');

    coordinator.register(new IdleOverrideExtension());

    expect(coordinator.getStoreMedia(video)).not.toBe(video);
  });

  it('returns the same facade for the same media', () => {
    const coordinator = new PlayerExtensionCoordinator(() => {});
    const video = document.createElement('video');

    coordinator.register(new MutedExtension());

    expect(coordinator.getStoreMedia(video)).toBe(coordinator.getStoreMedia(video));
    expect(coordinator.getStoreMedia(document.createElement('video'))).not.toBe(coordinator.getStoreMedia(video));
  });
});
