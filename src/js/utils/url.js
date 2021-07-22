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
 * @function
 * @param    {String} url
 *           The url to parse
 *
 * @return   {url:URLObject}
 *           An object of url details
 */
export const parseUrl = function(url) {
  // This entire method can be replace with URL once we are able to drop IE11

  const props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

  // add the url to an anchor and let the browser parse the URL
  const a = document.createElement('a');

  a.href = url;

  // Copy the specific URL properties to a new object
  // This is also needed for IE because the anchor loses its
  // properties when it's removed from the dom
  const details = {};

  for (let i = 0; i < props.length; i++) {
    details[props[i]] = a[props[i]];
  }

  // IE adds the port to the host property unlike everyone else. If
  // a port identifier is added for standard ports, strip it.
  if (details.protocol === 'http:') {
    details.host = details.host.replace(/:80$/, '');
  }

  if (details.protocol === 'https:') {
    details.host = details.host.replace(/:443$/, '');
  }

  if (!details.protocol) {
    details.protocol = window.location.protocol;
  }

  /* istanbul ignore if */
  if (!details.host) {
    details.host = window.location.host;
  }

  return details;
};

/**
 * Get absolute version of relative URL. Used to tell Flash the correct URL.
 *
 * @function
 * @param    {string} url
 *           URL to make absolute
 *
 * @return   {string}
 *           Absolute URL
 *
 * @see      http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 */
export const getAbsoluteURL = function(url) {
  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    // add the url to an anchor and let the browser parse the URL
    const a = document.createElement('a');

    a.href = url;

    url = a.href;
  }

  return url;
};

/**
 * Returns the extension of the passed file name. It will return an empty string
 * if passed an invalid path.
 *
 * @function
 * @param    {string} path
 *           The fileName path like '/path/to/file.mp4'
 *
 * @return  {string}
 *           The extension in lower case or an empty string if no
 *           extension could be found.
 */
export const getFileExtension = function(path) {
  if (typeof path === 'string') {
    const splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/;
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
 * @function
 * @param    {string} url
 *           The url to check.
 *
 * @param    {Object} [winLoc]
 *           the domain to check the url against, defaults to window.location
 *
 * @param    {string} [winLoc.protocol]
 *           The window location protocol defaults to window.location.protocol
 *
 * @param    {string} [winLoc.host]
 *           The window location host defaults to window.location.host
 *
 * @return   {boolean}
 *           Whether it is a cross domain request or not.
 */
export const isCrossOrigin = function(url, winLoc = window.location) {
  const urlInfo = parseUrl(url);

  // IE8 protocol relative urls will return ':' for protocol
  const srcProtocol = urlInfo.protocol === ':' ? winLoc.protocol : urlInfo.protocol;

  // Check if url is for another domain/origin
  // IE8 doesn't know location.origin, so we won't rely on it here
  const crossOrigin = (srcProtocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);

  return crossOrigin;
};
