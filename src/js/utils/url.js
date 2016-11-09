/**
 * @file url.js
 * @module url
 */
import document from 'global/document';
import window from 'global/window';

/**
 * @typedef {Object} url:URLObject
 *
 * @property {string} protocol
 *           The protocol of the url that was parsed.
 *
 * @property {string} hostname
 *           The hostname of the url that was parsed.
 *
 * @property {string} port
 *           The port of the url that was parsed.
 *
 * @property {string} pathname
 *           The pathname of the url that was parsed.
 *
 * @property {string} search
 *           The search query of the url that was parsed.
 *
 * @property {string} hash
 *           The hash of the url that was parsed.
 *
 * @property {string} host
 *           The host of the url that was parsed.
 */

/**
 * Resolve and parse the elements of a URL.
 *
 * @param  {String} url
 *         The url to parse
 *
 * @return {url:URLObject}
 *         An object of url details
 */
export const parseUrl = function(url) {
  const props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

  // add the url to an anchor and let the browser parse the URL
  let a = document.createElement('a');

  a.href = url;

  // IE8 (and 9?) Fix
  // ie8 doesn't parse the URL correctly until the anchor is actually
  // added to the body, and an innerHTML is needed to trigger the parsing
  const addToBody = (a.host === '' && a.protocol !== 'file:');
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
  const details = {};

  for (let i = 0; i < props.length; i++) {
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
 *
 *
 * @param  {string} url
 *         URL to make absolute
 *
 * @return {string}
 *         Absolute URL
 *
 * @see http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 */
export const getAbsoluteURL = function(url) {
  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    const div = document.createElement('div');

    div.innerHTML = `<a href="${url}">x</a>`;
    url = div.firstChild.href;
  }

  return url;
};

/**
 * Returns the extension of the passed file name. It will return an empty string
 * if passed an invalid path.
 *
 * @param {string} path
 *        The fileName path like '/path/to/file.mp4'
 *
 * @returns {string}
 *          The extension in lower case or an empty string if no
 *          extension could be found.
 */
export const getFileExtension = function(path) {
  if (typeof path === 'string') {
    const splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/i;
    const pathParts = splitPathRe.exec(path);

    if (pathParts) {
      return pathParts.pop().toLowerCase();
    }
  }

  return '';
};

/**
 * Returns whether the url passed is a cross domain request or not.
 *
 * @param {string} url
 *        The url to check.
 *
 * @return {boolean}
 *         Whether it is a cross domain request or not.
 */
export const isCrossOrigin = function(url) {
  const winLoc = window.location;
  const urlInfo = parseUrl(url);

  // IE8 protocol relative urls will return ':' for protocol
  const srcProtocol = urlInfo.protocol === ':' ? winLoc.protocol : urlInfo.protocol;

  // Check if url is for another domain/origin
  // IE8 doesn't know location.origin, so we won't rely on it here
  const crossOrigin = (srcProtocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);

  return crossOrigin;
};
