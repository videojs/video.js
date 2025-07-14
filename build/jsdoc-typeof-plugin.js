/**
 * The jsdoc plugin to transform some typescript jsdoc to actual jsdoc, so doc generation works.
 */
exports.handlers = {
  jsdocCommentFound: event => {
    // @template {ClassName} T ; {T} -> {typeof ClassName}
    const templateMatch = /@template {(typeof )?(.*)} ([A-Z])\n/.exec(event.comment || '');

    if (templateMatch) {
      const className = templateMatch[2];
      const templateName = templateMatch[3];

      event.comment = event.comment.replace(new RegExp(`{(.*\\b)(${templateName})(\\b.*)}`, 'g'), `{$1typeof ${className}$3}`);
    }

    // {typeof ClassName} -> {Class<ClassName>}
    event.comment = (event.comment || '').replace(/\{.*typeof\s+([^\s\|]+).*\}/g, typeExpression => {
      return typeExpression.replace(/typeof\s+([^\s\|\}]+)/g, (expression, className) => {
        return 'Class<' + className + '>';
      });
    });
  }
};
