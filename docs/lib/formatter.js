var formatter = {};

formatter.format = function (docfile) {
  var result = [];

  docfile.methods = [];
  docfile.properties = [];
  docfile.events = [];

  docfile.javadoc.forEach(function(javadoc, index){

    var type = (javadoc.ctx && javadoc.ctx.type);
    var name = (javadoc.ctx && typeof javadoc.ctx.name === 'string') ? javadoc.ctx.name : '';
    var nameTarget = '';
    var nameWithParams = '';

    var description = ''
    var paramStr = [];
    var paramTags = [];
    var returnTags = [];
    var throwsTags = [];
    var tagDeprecated = false
    var tagName = ''
    var tagClass = ''
    var tagFunction = ''
    var tagMethod = ''
    var tagEvent = ''
    var tagSee = ''
    var tagVersion = ''
    var tagAuthor = ''
    var tagExtends = '';
    var tagAncestorName = '';

    javadoc.tags.forEach(function(tag){

      if (tag.type == 'param') {
        tag.joinedTypes = tag.types.join('|');

        // determin if parameter is optional
        var lastTypeChar = tag.joinedTypes.slice(-1);
        // tag.optional = tag.name.slice(0,1) === '[' || lastTypeChar === '=' || lastTypeChar === '?';

        if (lastTypeChar === '=' || lastTypeChar === '?') {
          tag.optional = true;
          tag.joinedTypes = tag.joinedTypes.slice(0,-1);
        }

        if (tag.name.slice(0,1) === '[') {
          tag.optional = true;
        }

        paramTags.push(tag);
        paramStr.push(tag.name);

      } else if (tag.type == 'return' || tag.type == 'returns') {
        tag.joinedTypes = tag.types.join('|');
        returnTags.push(tag);
      } else if (tag.type == 'throws') {
        tag.joinedTypes = tag.types.join('|');
        throwsTags.push(tag);
      } else if (tag.type == 'method') {
        type = 'method';
        tagMethod = tag.string;
      } else if (tag.type == 'class') {
        type = 'class';
        tagClass = tag.string;
      } else if (tag.type == 'function') {
        type = 'function';
        tagFunction = tag.string;
      } else if (tag.type == 'event') {
        type = 'event';
        tagEvent = tag.string;
      } else if (tag.type == 'name') {
        tagName = tag.string;
      } else if (tag.type == 'see') {
        tagSee = tag.local;
      } else if (tag.type == 'version') {
        tagVersion = tag.string;
      } else if (tag.type == 'deprecated') {
        tagDeprecated = true;
      } else if (tag.type == 'author') {
        tagAuthor = tag.string;
      } else if (tag.type == 'extends' || tag.type == 'augments') {
        tagExtends = tag.string;
        tagAncestorName = tag.string.replace(javadoc.ctx.receiver+'.', '');
      }
    });

    name = tagName !== '' ? tagName : tagMethod !== '' ? tagMethod : tagClass !== '' ? tagClass : tagFunction !== '' ? tagFunction : tagEvent !== '' ? tagEvent : name;
    description = javadoc.description.full
                      .replace(/\nh1/, '#')
                      .replace(/\nh2/, '##')
                      .replace(/\nh3/, '###')
                      .replace(/\nh4/, '####')
                      .replace(/\nh5/, '#####')
                      .replace(/\nh6/, '######')
                      .replace(/^h1/, '#')
                      .replace(/^h2/, '##')
                      .replace(/^h3/, '###')
                      .replace(/^h4/, '####')
                      .replace(/^h5/, '#####')
                      .replace(/^h6/, '######');


    if (type == 'method' || type == 'function') {
      nameWithParams = name + '('+paramStr.join(', ')+')';
    } else {
      nameWithParams = name;
    }

    nameTarget = nameWithParams.toLowerCase().replace(/[,.\[\]\(\)]/g, '').replace(/\s+/g, '-');

    docfile.javadoc[index] = {
      name: name
      , paramStr: paramStr.join(', ')
      , paramTags: paramTags
      , returnTags: returnTags
      , throwsTags: throwsTags
      , author: tagAuthor
      , version: tagVersion
      , see: tagSee
      , deprecated: tagDeprecated
      , type: type
      , isMethod: type === 'method'
      , isFunction: type === 'function'
      , isClass: type === 'class'
      , extends: tagExtends
      , ancestorName: tagAncestorName
      , description: description
      , ignore: javadoc.ignore
      , raw: javadoc
      , nameTarget: nameTarget
      , nameWithParams: nameWithParams
    };

    if (type === 'method') {
      docfile.methods.push(tagMethod);
    }

    if (type === 'event') {
      docfile.events.push(tagEvent);
    }

  });

  return docfile;
}

module.exports = formatter;
