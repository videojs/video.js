/** @internal */
export type StoreErrorCode =
  /** Store was destroyed. */
  | 'DESTROYED'
  /** No target is attached to the store. */
  | 'NO_TARGET';

/** @internal */
export interface StoreErrorOptions {
  cause?: unknown;
  message?: string;
}

/** @internal */
export class StoreError extends Error {
  readonly code: StoreErrorCode;
  cause?: unknown;

  constructor(code: StoreErrorCode, options?: StoreErrorOptions) {
    super(options?.message ?? code);
    this.name = 'StoreError';
    this.code = code;
    this.cause = options?.cause;
  }
}

/** @internal */
export function isStoreError(error: unknown): error is StoreError {
  return error instanceof StoreError;
}

/** @internal */
export function throwNoTargetError(): never {
  throw new StoreError('NO_TARGET');
}

/** @internal */
export function throwDestroyedError(): never {
  throw new StoreError('DESTROYED');
}
