/**
 * @file log.js
 * @module log
 */
import createLogger from './create-logger.js';

const log = createLogger('VIDEOJS');
const { logByType } = log;

export default log;
export { logByType, createLogger };
