/**
 * The custom events the site sends to PostHog, on top of autocapture. Keep names and properties stable: insights and
 * funnels filter on them. Add an event to `ANALYTICS_EVENTS` and its properties to `AnalyticsEventProperties`.
 *
 * `trackEvent` no-ops when PostHog is absent, which is every development build, and never throws. Page context, such as
 * the installation picks, is stamped on every event by `withPageContext` in `src/utils/analytics.ts`.
 */

import type { AnySupportedStyle, SupportedFramework } from '@/types/docs';
import type { EventProperties } from '@/utils/analytics';
import { getFrameworkPreferenceClient } from '@/utils/docs/preferences';
import { installationContextForUrl } from '@/utils/installation/analytics-context';

export const ANALYTICS_EVENTS = {
  docsPreferenceChanged: 'docs_preference_changed',
  codeCopied: 'code_copied',
  agentHandoff: 'agent_handoff',
  searchNoResults: 'search_no_results',
  muxUploadRequested: 'mux_upload_requested',
  muxLoginClicked: 'mux_login_clicked',
  muxAuthSucceeded: 'mux_auth_succeeded',
  muxAuthFailed: 'mux_auth_failed',
  muxUploadStarted: 'mux_upload_started',
  muxUploadCompleted: 'mux_upload_completed',
  muxUploadReady: 'mux_upload_ready',
  muxUploadFailed: 'mux_upload_failed',
  muxUploadRetried: 'mux_upload_retried',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** How a reader handed Video.js docs to an AI assistant. Values match the elements' `cta` attributes. */
export const AGENT_HANDOFF_METHODS = [
  'copy-markdown',
  'copy-agent-prompt',
  'install-agent-skill',
  'view-markdown',
  'open-in-chatgpt',
  'open-in-claude',
  'open-in-cursor',
  'copy-agent-command',
] as const;

export type AgentHandoffMethod = (typeof AGENT_HANDOFF_METHODS)[number];

export function isAgentHandoffMethod(cta: string | undefined): cta is AgentHandoffMethod {
  return AGENT_HANDOFF_METHODS.some((method) => method === cta);
}

export interface AnalyticsEventProperties {
  docs_preference_changed:
    | { preference: 'framework'; value: SupportedFramework; previous: SupportedFramework }
    | { preference: 'style'; value: AnySupportedStyle; previous: AnySupportedStyle };
  /** `block` names the copied block, such as `cdn-scripts`; `tab` is its selected tab, such as `pnpm`. */
  code_copied: { block: string; tab?: string };
  agent_handoff: { method: AgentHandoffMethod };
  search_no_results: { query: string };
  mux_upload_requested: { signed_in: boolean };
  mux_login_clicked: undefined;
  mux_auth_succeeded: undefined;
  mux_auth_failed: { stage: 'initiate' | 'popup'; reason: string };
  mux_upload_started: undefined;
  mux_upload_completed: undefined;
  mux_upload_ready: undefined;
  /** Never carries upload IDs, playback IDs, or tokens: only the step and a short reason. */
  mux_upload_failed: { stage: 'create_upload' | 'upload' | 'processing'; reason: string };
  mux_upload_retried: undefined;
}

type EventArguments<E extends AnalyticsEventName> = AnalyticsEventProperties[E] extends undefined
  ? []
  : [properties: AnalyticsEventProperties[E]];

const REASON_LIMIT = 100;

/** A failure reason short enough to chart. Prefer an error code; a message is trimmed. */
export function failureReason(error: { code?: string; message: string }): string {
  return error.code ?? error.message.slice(0, REASON_LIMIT);
}

const SEARCH_QUERY_LIMIT = 100;

// Readers paste media URLs, addresses, and tokens into search too. Those are theirs to keep, and no page is missing.
const PRIVATE_SEARCH_QUERY = /:\/\/|www\.|@|\b(?=[\w-]*\d)[\w-]{20,}/;

/** A no-results query worth reporting as a content gap, trimmed and capped, or `undefined` for one that looks private. */
export function reportableSearchQuery(query: string): string | undefined {
  const trimmed = query.trim();
  if (!trimmed || PRIVATE_SEARCH_QUERY.test(trimmed)) return undefined;

  return trimmed.slice(0, SEARCH_QUERY_LIMIT);
}

/** Send a custom event. */
export function trackEvent<E extends AnalyticsEventName>(name: E, ...[properties]: EventArguments<E>): void {
  if (import.meta.env.DEV) console.debug('[analytics]', name, properties ?? '');

  try {
    window.posthog?.capture(name, properties);
  } catch {
    // Analytics must never break the page.
  }
}

/**
 * The installation context for the current page, read from its URL the way the installation store reads it. The store
 * writes every settled pick to the URL, so an event carries the picks in place when it is sent, including a first
 * pageview sent before any picker island has loaded the store.
 */
export function currentInstallationContext(): EventProperties {
  return installationContextForUrl(location.pathname, location.search, getFrameworkPreferenceClient() ?? undefined);
}
