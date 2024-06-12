/**
 * @file url.js
 * @module url
 */
import document from 'global/document';
import window from 'global/window';

/**
 * Resolve and parse the elements of a URL.
 *
 * @function
 * @param    {string} url
 *           The url to parse
 *
 * @return   {URL}
 *           An object of url details
 */
export const parseUrl = function(url) {
  return new URL(url, document.baseURI);
};

/**
 * Get absolute version of relative URL.
 *
 * @function
 * @param    {string} url
 *           URL to make absolute
 *
 * @return   {string}
 *           Absolute URL
 */
export const getAbsoluteURL = function(url) {
  return (new URL(url, document.baseURI)).href;
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
 * @param    {URL} [winLoc]
 *           the domain to check the url against, defaults to window.location
 *
 * @return   {boolean}
 *           Whether it is a cross domain request or not.
 */
export const isCrossOrigin = function(url, winLoc = window.location) {
  return parseUrl(url).origin !== winLoc.origin;
};
