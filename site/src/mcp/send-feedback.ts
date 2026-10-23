import type { McpEventProperties } from './analytics';

export const FEEDBACK_KINDS = ['missing', 'incorrect', 'confusing', 'bug', 'other'] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const FEEDBACK_MESSAGE_LIMIT = 2000;
const FEEDBACK_FIELD_LIMIT = 300;

export interface FeedbackInput {
  kind: FeedbackKind;
  message: string;
  page?: string;
  query?: string;
  framework?: string;
}

// Control characters, except tab and newline, and the Unicode line and paragraph separators.
function isControlCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0) ?? 0;

  return (
    (codePoint <= 0x1f && codePoint !== 0x09 && codePoint !== 0x0a && codePoint !== 0x0d) ||
    codePoint === 0x7f ||
    codePoint === 0x2028 ||
    codePoint === 0x2029
  );
}

// Feedback is unauthenticated free text that people and agents read later, so it is stored as inert plain text.
function clean(value: string, limit: number): string {
  return Array.from(value)
    .filter((character) => !isControlCharacter(character))
    .slice(0, limit)
    .join('')
    .trim();
}

/** The event properties one feedback report records. */
export function feedbackProperties(input: FeedbackInput): McpEventProperties {
  const properties: McpEventProperties = {
    feedback_kind: input.kind,
    feedback_message: clean(input.message, FEEDBACK_MESSAGE_LIMIT),
  };

  if (input.page) properties.feedback_page = clean(input.page, FEEDBACK_FIELD_LIMIT);

  if (input.query) properties.feedback_query = clean(input.query, FEEDBACK_FIELD_LIMIT);

  if (input.framework) properties.docs_framework = clean(input.framework, FEEDBACK_FIELD_LIMIT);

  return properties;
}

export const FEEDBACK_RECEIPT =
  'Thanks — the Video.js docs team reviews these reports. This is not a support channel and nobody will reply here. For a bug in Video.js itself, the user can open an issue at https://github.com/videojs/video.js/issues/new/choose.';
