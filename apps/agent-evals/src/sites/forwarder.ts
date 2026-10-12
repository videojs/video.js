import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:https';

/** Built into the image: a certificate for these hosts, signed by a CA only the eval image trusts. */
const TLS_DIR = '/opt/harness/tls';

/** Hosts a run can serve from another origin, such as a Netlify deploy preview. */
export const ROUTABLE_HOSTS = ['videojs.org', 'www.videojs.org', 'shadcn.videojs.org'] as const;
export type RoutableHost = (typeof ROUTABLE_HOSTS)[number];

/** Host to origin, for example `{ 'videojs.org': 'https://deploy-preview-2948--vjs10-site.netlify.app' }`. */
export type SiteRoutes = Partial<Record<RoutableHost, string>>;

const FORWARDED_REQUEST_HEADERS = ['accept', 'accept-language', 'content-type', 'user-agent', 'if-none-match'];
const RELAYED_RESPONSE_HEADERS = ['content-type', 'cache-control', 'etag', 'vary', 'link'];

/**
 * Points a redirect back at the host the client asked for, so a redirect inside the preview keeps the client on the
 * forwarder instead of revealing a different origin.
 */
export function rewriteLocation(location: string, host: string, origin: string): string {
  return location.startsWith(origin) ? `https://${host}${location.slice(origin.length)}` : location;
}

export interface SiteForwarder {
  /** Requests served per host, to show whether agents used the routed sites at all. */
  requests: Record<string, number>;
  close: () => void;
}

/**
 * Answers HTTPS for routed hosts on 127.0.0.1:443 and fetches each request from the host's origin. The container maps
 * those hostnames to 127.0.0.1, so curl, npm, the shadcn CLI, and agent web fetches all reach the forwarder.
 */
export async function startSiteForwarder(
  routes: SiteRoutes,
  { port = 443, tlsDir = TLS_DIR }: { port?: number; tlsDir?: string } = {}
): Promise<SiteForwarder> {
  const requests: Record<string, number> = {};
  const server = createServer(
    { key: readFileSync(`${tlsDir}/site.key`), cert: readFileSync(`${tlsDir}/site.crt`) },
    (request, response) => {
      forward(request, response).catch((error: unknown) => {
        response.statusCode = 502;
        response.end(error instanceof Error ? error.message : String(error));
      });
    }
  );

  async function forward(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const host = (request.headers.host ?? '').split(':')[0] as RoutableHost;
    const origin = routes[host];

    if (!origin) {
      response.statusCode = 421;
      response.end(`No route for ${host}.`);
      return;
    }

    requests[host] = (requests[host] ?? 0) + 1;

    const headers = new Headers();

    for (const name of FORWARDED_REQUEST_HEADERS) {
      const value = request.headers[name];

      if (typeof value === 'string') headers.set(name, value);
    }

    const chunks: Buffer[] = [];

    for await (const chunk of request) chunks.push(chunk as Buffer);

    const upstream = await fetch(`${origin}${request.url ?? '/'}`, {
      method: request.method ?? 'GET',
      headers,
      redirect: 'manual',
      ...(chunks.length > 0 ? { body: Buffer.concat(chunks) } : {}),
    });

    response.statusCode = upstream.status;

    for (const name of RELAYED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);

      if (value) response.setHeader(name, value);
    }

    const location = upstream.headers.get('location');

    if (location) response.setHeader('location', rewriteLocation(location, host, origin));

    response.end(Buffer.from(await upstream.arrayBuffer()));
  }

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    requests,
    close: () => {
      server.closeAllConnections();
      server.close();
    },
  };
}
