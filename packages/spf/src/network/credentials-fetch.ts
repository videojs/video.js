import { isFunction } from '@videojs/utils/predicate';

import type { FetchOptions, Resource } from './fetch';

/**
 * The `credentials` mode the engine's requests are made with: a fixed mode, or a policy consulted per request that may
 * read live state (the media adapter supplies one reading its `crossOrigin`) or decide per resource (only for one CDN
 * host, say). `undefined` from either leaves the platform default (`same-origin`).
 */
export type RequestCredentialsPolicy = RequestCredentials | ((resource: Resource) => RequestCredentials | undefined);

/** Any `Resource`-addressable fetch — `fetchResolvable`, `FetchText`, and `FetchBytes` all qualify. */
type CredentialableFetch = (addressable: Resource, options?: FetchOptions) => Promise<unknown>;

/**
 * Decorate a fetch so every request carries the mode the policy resolves to. The decorated fetch's type is preserved,
 * so this wraps the manifest, playlist, and segment fetches alike.
 *
 * The policy runs per request rather than once at decoration: it mirrors the media element's `crossorigin` attribute,
 * which an author can change after the fetch was built. An explicit per-call `credentials` still wins, and a policy
 * yielding `undefined` leaves the request at the platform default — `Request` treats an `undefined` init member as
 * absent.
 */
export function credentialsFetch<Fetch extends CredentialableFetch>(
  baseFetch: Fetch,
  policy: RequestCredentialsPolicy | undefined
): Fetch {
  // No policy at all (as opposed to a policy that yields no mode): nothing to
  // decorate, so the fetch is returned as is.
  if (policy === undefined) return baseFetch;

  const resolve = isFunction(policy) ? policy : () => policy;

  return ((addressable: Resource, options?: FetchOptions) =>
    baseFetch(addressable, { credentials: resolve(addressable), ...options })) as Fetch;
}
