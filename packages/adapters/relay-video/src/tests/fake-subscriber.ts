import type { WantHandlers, WantOptions } from '@caprid/relay';
import { type Mock, vi } from 'vite-plus/test';

export interface FakeWant {
  readonly options: WantOptions;
  readonly handlers: WantHandlers;
}

export interface FakeSubscriber {
  readonly wants: Map<string, FakeWant>;
  /** Every want and unwant in order, so a test can tell a move from an unwant and a new want. */
  readonly log: string[];
  readonly status: 'live';
  readonly closed: Promise<{ error?: unknown }>;
  readonly want: Mock<(key: string, options: WantOptions, handlers?: WantHandlers) => void>;
  readonly unwant: Mock<(key: string) => void>;
  readonly catchUp: Mock<(key: string) => void>;
  readonly close: Mock<() => void>;
  readonly rotate: Mock<() => void>;
  /** Stop the supervisor, as `close()` or a failure it does not retry would. */
  end(error?: unknown): void;
}

/** A supervised subscriber as an application holds it: the view a relay video borrows plus `close` and `rotate`. */
export function createFakeSubscriber(): FakeSubscriber {
  const wants = new Map<string, FakeWant>();
  const log: string[] = [];
  let resolveClosed!: (value: { error?: unknown }) => void;

  return {
    wants,
    log,
    status: 'live',
    closed: new Promise((resolve) => {
      resolveClosed = resolve;
    }),
    want: vi.fn((key: string, options: WantOptions, handlers: WantHandlers = {}) => {
      log.push(`want ${key} ${options.track}`);
      wants.set(key, { options, handlers });
    }),
    unwant: vi.fn((key: string) => {
      log.push(`unwant ${key}`);
      wants.delete(key);
    }),
    catchUp: vi.fn(),
    close: vi.fn(),
    rotate: vi.fn(),
    end(error) {
      resolveClosed(error === undefined ? {} : { error });
    },
  };
}
