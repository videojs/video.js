import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { createMcpRecorder } from '@/mcp/analytics';
import type { McpSurface } from '@/mcp/check-code';
import { handleMcpRequest } from '@/mcp/handler';
import { buildReferenceData } from '@/mcp/reference';
import { INSTALLATION_PACKAGE_VERSION } from '@/utils/installation/markdown';

export const prerender = false;

// The surface is generated from the built packages and gitignored; without it, `check_code` runs only the rules that
// need no package data, and `query_reference` has no exports or elements.
const surface = Object.values(
  import.meta.glob<McpSurface>('../content/generated-mcp-surface.json', { eager: true, import: 'default' })
)[0];

let referenceJson: Promise<string> | undefined;

// Built once per function instance: the reference only changes on deploy.
function loadReferenceJson(): Promise<string> {
  referenceJson ??= Promise.all([
    getCollection('componentReference'),
    getCollection('mediaReference'),
    getCollection('presetReference'),
    getCollection('featureReference'),
    getCollection('utilReference'),
  ]).then(([components, media, presets, features, utils]) =>
    JSON.stringify(
      buildReferenceData({ components, media, presets, features, utils }, surface, INSTALLATION_PACKAGE_VERSION)
    )
  );

  return referenceJson;
}

export const ALL: APIRoute = ({ request, locals }) =>
  handleMcpRequest(request, {
    origin: new URL(request.url).origin,
    fetch,
    packageVersion: INSTALLATION_PACKAGE_VERSION,
    referenceJson: loadReferenceJson,
    surface,
    record: createMcpRecorder(request, locals.netlify?.context),
  });
