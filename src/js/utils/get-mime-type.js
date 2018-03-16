import {MimetypesKind} from './mimetypes';
import * as Url from '../utils/url.js';

/**
 * Checks src mimetype, adding it when possible
 *
 * @param {Tech~SourceObject} src
 *        The src object to check
 *
 * @return {Tech~SourceObject}
 *        src Object with known type
 */
const getMimetype = function(src = '') {
  const ext = Url.getFileExtension(src);
  const mimetype = MimetypesKind[ext.toLowerCase()];

  return mimetype || '';
};

export default getMimetype;
