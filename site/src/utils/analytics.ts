/**
 * PostHog setup. `src/components/Posthog.astro` defines the snippet's queueing stub and calls `initAnalytics` in
 * production builds only.
 *
 * PostHog runs in `cookieless_mode: "always"`, so there is no durable person: never call `identify`, `alias`, or a
 * person-property API.
 */

import { PRIVATE_INSTALLATION_QUERY_PARAMETERS } from '@videojs/installation';
import { isPlainObject, isString } from 'es-toolkit/predicate';
import { escapeRegExp } from 'es-toolkit/string';

import { DEFAULT_FRAMEWORK, getDefaultStyle, type AnySupportedStyle, type SupportedFramework } from '@/types/docs';
import { getFrameworkPreferenceClient, getStylePreferenceClient } from '@/utils/docs/preferences';
import { POSTHOG_PROJECT_KEY } from '@/utils/posthog-project';

/** PostHog's own placeholder, so values it masks and values masked here read the same in insights. */
const MASKED = '<masked>';

/** A value PostHog serializes into an event payload. */
export type EventValue = string | number | boolean | null | undefined | EventValue[] | EventProperties;

export interface EventProperties {
  [name: string]: EventValue;
}

/** The parts of an outgoing PostHog event that can carry a page URL. */
export interface AnalyticsEvent {
  properties?: EventProperties;
  $set?: EventProperties;
  $set_once?: EventProperties;
}

/** The subset of the PostHog instance the site calls. The snippet's stub queues these until the library loads. */
export interface PostHogClient {
  init(token: string, config: PostHogConfig): void;
}

/** The PostHog options the site sets. */
export interface PostHogConfig {
  api_host: string;
  ui_host: string;
  defaults: string;
  cookieless_mode: 'always';
  capture_dead_clicks: boolean;
  capture_heatmaps: boolean;
  mask_personal_data_properties: boolean;
  custom_personal_data_properties: string[];
  advanced_disable_feature_flags: boolean;
  disable_session_recording: boolean;
  before_send: (event: AnalyticsEvent | null) => AnalyticsEvent | null;
}

declare global {
  interface Window {
    posthog?: PostHogClient;
  }
}

export interface DocsContext {
  docs_framework: SupportedFramework;
  docs_style: AnySupportedStyle;
}

// Stops at the characters that end a query value, or the quote that ends an attribute inside `$elements_chain`. A value
// PostHog already masked starts with `<`, so it is left alone.
const PRIVATE_PARAMETER_PATTERN = new RegExp(
  `([?&](?:${PRIVATE_INSTALLATION_QUERY_PARAMETERS.map(escapeRegExp).join('|')})=)[^&#\\s"'<>]+`,
  'g'
);

/** Replace the value of every private installation query parameter in `text`, wherever a URL appears in it. */
export function maskPrivateParameters(text: string): string {
  return text.replace(PRIVATE_PARAMETER_PATTERN, `$1${MASKED}`);
}

// Shorter values could match ordinary page text.
const MIN_PRIVATE_VALUE_LENGTH = 8;

// How the generated code writes a value into an HTML attribute, and so how the page renders it as text.
function escapeHTMLAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * The private installation values on the current page: as the reader entered them, as the URL encodes them, and as the
 * generated code renders them. The installation store writes every pick to the URL as soon as it settles, so the URL
 * always holds the current values.
 */
export function currentPrivateValues(search = globalThis.location?.search ?? ''): string[] {
  const params = new URLSearchParams(search);

  return PRIVATE_INSTALLATION_QUERY_PARAMETERS.flatMap((name) => {
    const value = params.get(name);
    if (!value || value.length < MIN_PRIVATE_VALUE_LENGTH) return [];

    return [...new Set([value, encodeURIComponent(value), escapeHTMLAttribute(value)])];
  });
}

/**
 * Mask private query parameters, and the current private values themselves. Generated code and the preview render the
 * reader's source URL as page text, which autocapture records as `$el_text` on a dead click or rage click.
 */
export function maskPrivateText(text: string, values: readonly string[]): string {
  return values.reduce((masked, value) => masked.replaceAll(value, MASKED), maskPrivateParameters(text));
}

function maskValue(value: EventValue, values: readonly string[]): EventValue {
  if (isString(value)) return maskPrivateText(value, values);

  if (Array.isArray(value)) return value.map((item) => maskValue(item, values));

  return isPlainObject(value) ? maskProperties(value, values) : value;
}

function maskProperties(properties: EventProperties, values: readonly string[]): EventProperties {
  // Keys too: heatmap batches are keyed by page URL.
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [maskPrivateText(key, values), maskValue(value, values)])
  );
}

/**
 * `before_send` hook. PostHog's `custom_personal_data_properties` masks the current URL and heatmap URLs, but not the
 * referrer, the link addresses autocapture records, or element text, so a private value would still leave the browser
 * on the next page or on a click. This masks it everywhere in the event.
 */
export function maskPrivateEvent<E extends AnalyticsEvent>(event: E | null): E | null {
  if (!event) return event;

  const values = currentPrivateValues();

  return {
    ...event,
    properties: event.properties && maskProperties(event.properties, values),
    $set: event.$set && maskProperties(event.$set, values),
    $set_once: event.$set_once && maskProperties(event.$set_once, values),
  };
}

/** The docs framework and style this reader sees: their saved picks, or the site defaults. */
export function getDocsContext(): DocsContext {
  const framework = getFrameworkPreferenceClient() ?? DEFAULT_FRAMEWORK;
  const style = getStylePreferenceClient(framework) ?? getDefaultStyle(framework);

  return { docs_framework: framework, docs_style: style };
}

/** Properties that describe the page an event happened on. */
function pageContext(): EventProperties {
  return { ...getDocsContext() };
}

/**
 * Stamp the current page context on an event as it is sent. Super properties would go stale: view transitions keep
 * PostHog loaded across pages, and PostHog sends a navigation's `$pageview` before the new page's scripts run.
 */
export function withPageContext<E extends AnalyticsEvent>(event: E | null): E | null {
  if (!event) return event;

  return { ...event, properties: { ...event.properties, ...pageContext() } };
}

export function createPostHogConfig(): PostHogConfig {
  return {
    api_host: '/ph',
    ui_host: 'https://us.posthog.com',
    defaults: '2026-01-30',
    cookieless_mode: 'always',
    capture_dead_clicks: true,
    capture_heatmaps: true,
    // Also masks ad click IDs such as `gclid`. UTM parameters are kept.
    mask_personal_data_properties: true,
    custom_personal_data_properties: [...PRIVATE_INSTALLATION_QUERY_PARAMETERS],
    // The site uses no feature flags, and the /flags request sends the initial referrer unmasked, outside
    // `before_send`. Remote config still loads.
    advanced_disable_feature_flags: true,
    // Replay would record the page text, including the reader's source URL, in payloads `before_send` never sees. Keep
    // it off here even if the project enables it.
    disable_session_recording: true,
    before_send: (event) => maskPrivateEvent(withPageContext(event)),
  };
}

/** Start PostHog once the browser is idle, so it never competes with the page for the main thread. */
export function initAnalytics(): void {
  const load = () => window.posthog?.init(POSTHOG_PROJECT_KEY, createPostHogConfig());

  if ('requestIdleCallback' in window) requestIdleCallback(load);
  else setTimeout(load, 3000);
}
