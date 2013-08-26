/**
 * dox output to jsondoc
 * @param  {Object} comments dox parsed comments
 * @return {Object}          jsondoc object
 */
module.exports = function (comments) {
  var doc = {
    entries: [],
    types: {}
  };
  var entryTypeTags = ['method', 'class', 'function', 'event', 'property', 'declaration'];

  comments.forEach(function(comment, index){
    var entry = {
      name: comment.ctx && comment.ctx.name || '',
      type: comment.ctx && comment.ctx.type,
      description: comment.description
    };

    comment.tags.forEach(function(tag){
      // type tags
      if (entryTypeTags.indexOf(tag.type) !== -1) {
        entry.type = tag.type;
        if (tag.string) {
          entry.name = tag.string;
        }
        doc.types
      // params
      } else if (tag.type == 'param') {
        tag.optional =  parseOptionalParam(tag);
        entry.params = entry.params || [];
        entry.params.push(tag);
      // returns
      } else if (tag.type == 'return' || tag.type == 'returns') {
        entry.returns = entry.returns || [];
        entry.returns.push(tag);
      // throws
      } else if (tag.type == 'throws') {
        entry.throws = entry.throws || [];
        entry.throws.push(tag);
      // name
      } else if (tag.type == 'name') {
        entry.name = tag.string;
      // see
      } else if (tag.type == 'see') {
        entry.see = tag.local || tag.url;
      // version
      } else if (tag.type == 'version') {
        entry.version = tag.string;
      // deprecated
      } else if (tag.type == 'deprecated') {
        entry.deprecated = true;
      // author
      } else if (tag.type == 'author') {
        entry.author = tag.string;
      // extends
      } else if (tag.type == 'extends' || tag.type == 'augments') {
        entry.extends = tag.string;
      // allow unhandled tags
      } else {
        entry[tag.type] = tag.string || true;
      }
    });

    // if (type == 'method' || type == 'function') {
    //   nameWithParams = name + '('+paramStr.join(', ')+')';
    // } else {
    //   nameWithParams = name;
    // }

    // nameTarget = nameWithParams.toLowerCase().replace(/[,.\[\]\(\)]/g, '').replace(/\s+/g, '-');

    doc.types[entry.type] = doc.types[entry.type] || [];
    doc.types[entry.type].push(entry);

    doc.entries.push(entry);
  });

  /**
   * determine if parameter is optional
   * look for `[name]`, `type=`, or `type?`
   *
   * @private
   * @see https://github.com/visionmedia/dox/pull/105
   */
  function parseOptionalParam(tag) {
    var typesJoined = (tag.types) ? tag.types.join('|') : [];
    return !!(tag.name.slice(0,1) == '[' || ['=','?'].indexOf(typesJoined.slice(-1)) != -1);
  }

  return doc;
}
