/**
 * The jsdoc plugin that will convert types like {typeof ClassName} into {Class<ClassName>}
 */
exports.handlers = {
  jsdocCommentFound: event => {
    event.comment = (event.comment || '').replace(/\{.*typeof\s+([^\s\|]+).*\}/g, typeExpression => {
      return typeExpression.replace(/typeof\s+([^\s\|\}]+)/g, (expression, className) => {
        return 'Class<' + className + '>';
      });
    });
  }
};
