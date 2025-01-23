/**
 * The jsdoc plugin that will convert types like {typeof ClassName} into {Class<ClassName>}
 */
exports.handlers = {
  jsdocCommentFound: event => {
    const templateMatch = /@template {(.*)} ([A-Z])\n/.exec(event.comment || '');

    if (templateMatch) {
      const className = templateMatch[1];
      const templateName = templateMatch[2];

      event.comment = event.comment.replace(new RegExp(`{(.*\\b)(${templateName})(\\b.*)}`, 'g'), `{$1typeof ${className}$3}`);
    }

    // \{.*\bT\b.*\}
    event.comment = (event.comment || '').replace(/\{.*typeof\s+([^\s\|]+).*\}/g, typeExpression => {
      return typeExpression.replace(/typeof\s+([^\s\|\}]+)/g, (expression, className) => {
        return 'Class<' + className + '>';
      });
    });
  }
};
