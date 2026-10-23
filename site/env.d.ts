/// <reference types="astro/client" />
/// <reference types="vite-plugin-svgr/client" />

declare namespace App {
  interface Locals {
    user?: {
      name: string;
      email: string;
    };

    accessToken?: string;

    /** Set by the Netlify adapter on deployed requests; absent under `astro dev`. */
    netlify?: { context: import('./src/mcp/analytics').McpRecordContext };
  }
}
