/**
 * Remove parts of files from outputs. Everything between a pair of `/* start-delete-from-build *\u002f`
 * and `/* end-delete-from-build *\u002f` comments
 *
 * Based on https://github.com/se-panfilov/rollup-plugin-strip-code
 */

import { createFilter } from '@rollup/pluginutils';

const START_COMMENT = 'start-delete-from-build';
const END_COMMENT = 'end-delete-from-build';

/**
 * Remove lines of code surrounded by comments
 *
 * @param {Object} [options] Options
 * @param {string} [options.include] Files to inlcude
 * @param {string} [options.exclude] Files to exclude
 * @param {string} [options.startComment] Starting keywork, default start-delete-from-build
 * @param {string} [options.endComment] Eding keywork, default end-delete-from-build
 * @param {RegExp} [options.pattern] Custom regex
 * @return void
 */
export default function excludeLines(options = {}) {
  // assume that the myPlugin accepts options of `options.include` and `options.exclude`
  const filter = createFilter(options.include, options.exclude);

  return {
    transform(code, id) {
      if (!filter(id)) {
        return;
      }

      const startComment = options.startComment || START_COMMENT;
      const endComment = options.endComment || END_COMMENT;
      const defaultPattern = new RegExp(`([\\t ]*\\/\\* ?${startComment} ?\\*\\/)[\\s\\S]*?(\\/\\* ?${endComment} ?\\*\\/[\\t ]*\\n?)`, 'g');

      return code.replace(options.pattern || defaultPattern, '');
    }
  };
}
