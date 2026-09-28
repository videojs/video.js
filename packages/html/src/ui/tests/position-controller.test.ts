import type { ReactiveController } from '@videojs/element';
import { describe, expect, it, vi } from 'vite-plus/test';

import { PositionController, type PositionControllerHost } from '../position-controller';

function createHost(): PositionControllerHost {
  const host = document.createElement('div');

  return Object.assign(host, {
    addController: vi.fn<(controller: ReactiveController) => void>(),
    removeController: vi.fn<(controller: ReactiveController) => void>(),
    requestUpdate: vi.fn<() => void>(),
    updateComplete: Promise.resolve(true),
  });
}

describe('PositionController', () => {
  it('does not query for a trigger while its host is detached', () => {
    const controller = new PositionController(createHost());

    expect(controller.findTrigger('trigger')).toBeNull();
  });

  it('finds explicit triggers inside document fragments', () => {
    const root = document.createDocumentFragment();
    const trigger = document.createElement('button');
    const host = createHost();

    trigger.id = 'trigger';
    root.append(trigger, host);

    const controller = new PositionController(host);

    expect(controller.findTrigger(trigger.id)).toBe(trigger);
  });
});
