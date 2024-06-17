/**
 * This jsdoc plugin works around some typescript-flavoured jsdoc that isn't actual jsdoc,
 * so docs:api doesn't fail
 */
exports.handlers = {
  jsdocCommentFound: event => {
    // Special case for media-error.js
    event.comment = (event.comment || '').replace(
      '@typedef {{errorType: string, [key: string]: any}} ErrorMetadata',
      '@typedef {Object} ErrorMetadata\n * @property {string} errorType Error type'
    );
  }
};
