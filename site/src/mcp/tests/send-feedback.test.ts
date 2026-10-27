import { describe, expect, it } from 'vite-plus/test';

import { FEEDBACK_MESSAGE_LIMIT, feedbackProperties } from '../send-feedback';

describe('feedbackProperties', () => {
  it('records the report as plain text without control characters', () => {
    expect(
      feedbackProperties({
        kind: 'missing',
        message: ' No docs\u0000 for DRM\u2028 ',
        page: '/docs/framework/react/guides/drm',
        query: 'drm',
        framework: 'react',
      })
    ).toEqual({
      feedback_kind: 'missing',
      feedback_message: 'No docs for DRM',
      feedback_page: '/docs/framework/react/guides/drm',
      feedback_query: 'drm',
      docs_framework: 'react',
    });
  });

  it('caps the message length', () => {
    const { feedback_message } = feedbackProperties({ kind: 'other', message: 'x'.repeat(5000) });

    expect(feedback_message).toHaveLength(FEEDBACK_MESSAGE_LIMIT);
  });
});
