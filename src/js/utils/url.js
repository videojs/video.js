/**
 * @file url.js
 */
import document from 'global/document';
import window from 'global/window';

/**
 * Resolve and parse the elements of a URL
 *
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 * @method parseUrl
 */
export const parseUrl = function(url) {
  const props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

  // add the url to an anchor and let the browser parse the URL
  let a = document.createElement('a');
  a.href = url;

  // IE8 (and 9?) Fix
  // ie8 doesn't parse the URL correctly until the anchor is actually
  // added to the body, and an innerHTML is needed to trigger the parsing
  let addToBody = (a.host === '' && a.protocol !== 'file:');
  let div;
  if (addToBody) {
    div = document.createElement('div');
    div.innerHTML = `<a href="${url}"></a>`;
    a = div.firstChild;
    // prevent the div from affecting layout
    div.setAttribute('style', 'display:none; position:absolute;');
    document.body.appendChild(div);
  }

  // Copy the specific URL properties to a new object
  // This is also needed for IE8 because the anchor loses its
  // properties when it's removed from the dom
  let details = {};
  for (var i = 0; i < props.length; i++) {
    details[props[i]] = a[props[i]];
  }

  // IE9 adds the port to the host property unlike everyone else. If
  // a port identifier is added for standard ports, strip it.
  if (details.protocol === 'http:') {
    details.host = details.host.replace(/:80$/, '');
  }
  if (details.protocol === 'https:') {
    details.host = details.host.replace(/:443$/, '');
  }

  if (addToBody) {
    document.body.removeChild(div);
  }

  return details;
};

/**
 * Get absolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 *
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 * @private
 * @method getAbsoluteURL
 */
export const getAbsoluteURL = function(url){
  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    let div = document.createElement('div');
    div.innerHTML = `<a href="${url}">x</a>`;
    url = div.firstChild.href;
  }

  return url;
};

/**
 * Returns the extension of the passed file name. It will return an empty string if you pass an invalid path
 *
 * @param {String}    path    The fileName path like '/path/to/file.mp4'
 * @returns {String}          The extension in lower case or an empty string if no extension could be found.
 * @method getFileExtension
 */
export const getFileExtension = function(path) {
  if(typeof path === 'string'){
    let splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/i;
    let pathParts = splitPathRe.exec(path);

    if (pathParts) {
      return pathParts.pop().toLowerCase();
    }
  }

  return '';
};

/**
 * Returns whether the url passed is a cross domain request or not.
 *
 * @param {String} url The url to check
 * @return {Boolean}   Whether it is a cross domain request or not
 * @method isCrossOrigin
 */
export const isCrossOrigin = function(url) {
  let winLoc = window.location;
  let urlInfo = parseUrl(url);

  // IE8 protocol relative urls will return ':' for protocol
  let srcProtocol = urlInfo.protocol === ':' ? winLoc.protocol : urlInfo.protocol;

  // Check if url is for another domain/origin
  // IE8 doesn't know location.origin, so we won't rely on it here
  let crossOrigin = (srcProtocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);

  return crossOrigin;
};
