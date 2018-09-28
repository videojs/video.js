/**
 * @file log.js
 * @module log
 */
import CreateLogger from './create-logger.js';

const log = CreateLogger('VIDEOJS');
const createLogger = log.createLogger;

export default log;
export { createLogger };
