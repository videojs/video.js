import { MediaError } from '@videojs/media';

import type { TranslationParams } from '../../i18n/params';
import type { Text } from '../../i18n/text';
import { emptyText, okText } from '../../i18n/text/common';
import {
  abortedText,
  decodeText,
  encryptedText,
  networkText,
  sourceText,
  titleText,
  unexpectedText,
  unplayableText,
} from '../../i18n/text/errors';

/**
 * SVTA 99 [Custom] 001 — an engine reporting that it has no pipeline for something the source requires. Not a
 * `MediaError.MEDIA_ERR_*` value: engines that report SVTA codes surface them on `error.code` directly.
 *
 * The literal rather than an import. `@videojs/spf` defines this as `SVTA_UNSUPPORTED_PLAYBACK_FEATURE` and owns its
 * meaning, but core doesn't depend on spf, and reaching it through `@videojs/media` would pull an engine entry point
 * into a barrel that has no other reason to load one. Same trade `HlsVideoMediaStreamType` makes in the other direction
 * — compatibility by value, stated in a comment, instead of a dependency edge neither package wants.
 */
const SVTA_UNSUPPORTED_PLAYBACK_FEATURE = 99001;

/** @internal */
export type MediaErrorTranslationKey = Extract<
  keyof TranslationParams,
  | 'errors.aborted'
  | 'errors.network'
  | 'errors.decode'
  | 'errors.source'
  | 'errors.encrypted'
  | 'errors.unplayable'
  | 'common.empty'
>;

const MEDIA_ERROR_TRANSLATIONS: Record<number, Text | undefined> = {
  [MediaError.MEDIA_ERR_ABORTED]: abortedText,
  [MediaError.MEDIA_ERR_NETWORK]: networkText,
  [MediaError.MEDIA_ERR_DECODE]: decodeText,
  [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: sourceText,
  [MediaError.MEDIA_ERR_ENCRYPTED]: encryptedText,
  [MediaError.MEDIA_ERR_CUSTOM]: emptyText,
  // Distinct copy from `errors.source`: that one tells a viewer the media may be
  // unavailable or unsupported by their *browser*, which is wrong here. The
  // browser is fine; this player can't play the source.
  [SVTA_UNSUPPORTED_PLAYBACK_FEATURE]: unplayableText,
};

const STANDARD_CODE_UA_MESSAGES: Partial<Record<number, readonly string[]>> = {
  [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]: ['Failed to open media'],
};

function isStandardMediaErrorCode(code: number): boolean {
  return code >= MediaError.MEDIA_ERR_ABORTED && code <= MediaError.MEDIA_ERR_ENCRYPTED;
}

/** @internal */
export function getMediaErrorTranslationKey(code: number): MediaErrorTranslationKey | undefined {
  return MEDIA_ERROR_TRANSLATIONS[code]?.key as MediaErrorTranslationKey | undefined;
}

/** @internal */
export function getErrorDialogTitleText(): Text {
  return titleText;
}

/** @internal */
export function getErrorDialogDismissText(): Text {
  return okText;
}

/** @internal */
export function getErrorDialogUnexpectedText(): Text {
  return unexpectedText;
}

/**
 * Resolves dialog body copy: default phrases for known {@link MediaError} defaults, literal text for custom messages,
 * otherwise the generic fallback key.
 *
 * @internal
 */
export function resolveErrorDialogDescription(
  error: (Pick<MediaError, 'code' | 'message'> & { context?: MediaError['context'] }) | null | undefined,
  cachedMessage?: string | null
): Text | string {
  if (error) {
    const text = MEDIA_ERROR_TRANSLATIONS[error.code];
    const message = error.message?.trim();

    if (message) {
      const defaultForCode = MediaError.defaultMessages[error.code];
      if (text && defaultForCode && message === defaultForCode) return text;

      const uaVariants = STANDARD_CODE_UA_MESSAGES[error.code];
      if (text && isStandardMediaErrorCode(error.code) && !error.context && uaVariants?.includes(message)) return text;

      return message;
    }

    if (text) return text;
  }

  const cached = cachedMessage?.trim();
  if (cached) return cached;

  return unexpectedText;
}
