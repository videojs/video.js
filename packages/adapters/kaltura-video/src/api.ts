import { MediaError } from '@videojs/media';
import { isAbortError, isBoolean, isNumber, isPlainObject, isString } from '@videojs/utils/predicate';

/** The fields of a Kaltura entry this media reads. */
export interface KalturaEntry {
  id: string;
  name?: string | undefined;
  /** `KalturaEntryType`: `7` is a live stream. */
  type?: number | undefined;
  /** `KalturaEntryModerationStatus`: `1` is pending moderation and `3` is rejected. */
  moderationStatus?: number | undefined;
}

/** One way to deliver an entry, from `baseEntry.getPlaybackContext`. */
export interface KalturaPlaybackSource {
  /** Delivery format, such as `applehttp` for HLS or `mpegdash` for DASH. */
  format: string;
  url: string;
  deliveryProfileId?: number | undefined;
  /** License servers for protected sources. Empty for clear content. */
  drm: readonly unknown[];
}

/** The access-control verdict and delivery options for one entry, from `baseEntry.getPlaybackContext`. */
export interface KalturaPlaybackContext {
  sources: readonly KalturaPlaybackSource[];
  /** Access-control actions that apply. `type` `1` blocks playback. */
  actions: readonly { type?: unknown }[];
  /** Why access control applied its actions, worded by the publisher. */
  messages: readonly { message?: unknown; code?: unknown }[];
}

/** What one request learns about an entry. */
export interface KalturaEntryResponse {
  entry: KalturaEntry;
  context: KalturaPlaybackContext;
  /** Whether a live entry is broadcasting. `undefined` for other entries. */
  isLive: boolean | undefined;
}

export interface KalturaEntryRequestParams {
  serviceUrl: string;
  partnerId: number;
  entryId: string;
  /** The app's Kaltura Session. Without one, an anonymous widget session is started in the same request. */
  ks?: string | undefined;
  clientTag: string;
  /** The page URL access control evaluates domain restrictions against. */
  referrer?: string | undefined;
  signal?: AbortSignal | undefined;
}

/**
 * Look an entry up with one Kaltura multirequest: a widget session when the app passes no KS, the entry itself, its
 * playback context, and whether it is broadcasting.
 *
 * Rejects with a {@link MediaError} when Kaltura answers with an error, and with the abort reason when `signal` aborts.
 * Kaltura's own error code goes in the error's `context`, and its exception in `data`. Its messages are written for
 * developers, so the error keeps the default message for its code.
 */
export async function requestKalturaEntry(params: KalturaEntryRequestParams): Promise<KalturaEntryResponse> {
  const { serviceUrl, signal } = params;
  const anonymous = !params.ks;
  let results: unknown;

  try {
    const response = await fetch(`${serviceUrl}/api_v3/service/multirequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createMultiRequest(params)),
      ...(signal && { signal }),
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    results = await response.json();
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) throw error;

    throw networkError(error);
  }

  if (!Array.isArray(results)) throw apiError(results);

  const [session, list, context, isLive] = anonymous ? results : [null, ...results];
  if (anonymous && isApiException(session)) throw apiError(session);

  if (isApiException(list)) throw apiError(list);

  const entry = parseEntry(list);
  if (!entry) throw new MediaError(undefined, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, 'ENTRY_ID_NOT_FOUND');

  if (isApiException(context)) throw apiError(context);

  return { entry, context: parseContext(context), isLive: isBoolean(isLive) ? isLive : undefined };
}

function createMultiRequest({ partnerId, entryId, ks, clientTag, referrer }: KalturaEntryRequestParams) {
  // Calls reference earlier results by their 1-based index, as Kaltura's multirequest does.
  const sessionKs = ks ? undefined : '{1:result:ks}';
  const entryIndex = ks ? 1 : 2;
  const entryRef = `{${entryIndex}:result:objects:0:id}`;
  const calls: Record<string, unknown>[] = [
    ...(ks ? [] : [{ service: 'session', action: 'startWidgetSession', widgetId: `_${partnerId}` }]),
    {
      service: 'baseEntry',
      action: 'list',
      ...(sessionKs && { ks: sessionKs }),
      filter: { redirectFromEntryId: entryId },
      responseProfile: { type: 1, fields: 'id,name,type,moderationStatus' },
    },
    {
      service: 'baseEntry',
      action: 'getPlaybackContext',
      ...(sessionKs && { ks: sessionKs }),
      entryId: entryRef,
      contextDataParams: {
        objectType: 'KalturaContextDataParams',
        flavorTags: 'all',
        ...(referrer && { referrer }),
      },
    },
    // Kaltura answers `false` for a live entry that is not broadcasting, and an exception for any other entry.
    {
      service: 'liveStream',
      action: 'isLive',
      ...(sessionKs && { ks: sessionKs }),
      id: entryRef,
      protocol: 'applehttp',
    },
  ];

  return {
    apiVersion: '3.3.0',
    format: 1,
    clientTag,
    partnerId,
    ...(ks && { ks }),
    ...Object.fromEntries(calls.map((call, index) => [String(index + 1), call])),
  };
}

function parseEntry(list: unknown): KalturaEntry | null {
  const [entry] = isPlainObject(list) && Array.isArray(list.objects) ? list.objects : [];
  if (!isPlainObject(entry) || !isString(entry.id)) return null;

  return {
    id: entry.id,
    name: isString(entry.name) ? entry.name : undefined,
    type: isNumber(entry.type) ? entry.type : undefined,
    moderationStatus: isNumber(entry.moderationStatus) ? entry.moderationStatus : undefined,
  };
}

function parseContext(context: unknown): KalturaPlaybackContext {
  const { sources, actions, messages } = isPlainObject(context) ? context : {};

  return {
    sources: (Array.isArray(sources) ? sources : []).flatMap((source): KalturaPlaybackSource[] => {
      if (!isPlainObject(source) || !isString(source.format) || !isString(source.url)) return [];

      return [
        {
          format: source.format,
          url: source.url,
          deliveryProfileId: isNumber(source.deliveryProfileId) ? source.deliveryProfileId : undefined,
          drm: Array.isArray(source.drm) ? source.drm : [],
        },
      ];
    }),
    actions: Array.isArray(actions) ? actions.filter(isPlainObject) : [],
    messages: Array.isArray(messages) ? messages.filter(isPlainObject) : [],
  };
}

function isApiException(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && value.objectType === 'KalturaAPIException';
}

function apiError(exception: unknown): MediaError {
  const code = isPlainObject(exception) && isString(exception.code) ? exception.code : 'KALTURA_API_ERROR';
  const error = new MediaError(undefined, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, true, code);

  error.data = exception;
  return error;
}

function networkError(cause: unknown): MediaError {
  const error = new MediaError(undefined, MediaError.MEDIA_ERR_NETWORK, true, 'KALTURA_API_UNREACHABLE');

  error.data = cause;
  return error;
}
