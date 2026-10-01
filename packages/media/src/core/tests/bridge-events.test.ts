import { describe, expect, it, vi } from 'vite-plus/test';

import { bridgeEvents } from '../bridge-events';

describe('bridgeEvents', () => {
  it('forwards events dispatched by a sub-delegate to the host', () => {
    const source = new EventTarget();
    const host = new EventTarget();
    const handler = vi.fn();

    host.addEventListener('custom', handler);
    bridgeEvents(source, host);
    source.dispatchEvent(new Event('custom'));

    expect(handler).toHaveBeenCalledOnce();
  });

  it('creates a new event instance for the host dispatch', () => {
    const source = new EventTarget();
    const host = new EventTarget();
    const hostEvents: Event[] = [];
    const original = new Event('custom');

    host.addEventListener('custom', (event) => hostEvents.push(event));
    bridgeEvents(source, host);
    source.dispatchEvent(original);

    expect(hostEvents).toHaveLength(1);
    expect(hostEvents[0]!.type).toBe('custom');
    expect(hostEvents[0]).not.toBe(original);
    expect(hostEvents[0]!.target).toBe(host);
    expect(original.target).not.toBe(host);
  });
});
