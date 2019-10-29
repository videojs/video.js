/**
 * @file dom-data.js
 * @module dom-data
 */

import log from './log.js';
import * as Guid from './guid.js';
import window from 'global/window';

let FakeWeakMap;

if (!window.WeakMap) {
  FakeWeakMap = class {
    constructor() {
      this.vdata = 'vdata' + Math.floor(window.performance && window.performance.now() || Date.now());
      this.data = {};
    }

    set(key, value) {
      const access = key[this.vdata] || Guid.newGUID();

      if (!key[this.vdata]) {
        key[this.vdata] = access;
      }

      this.data[access] = value;

      return this;
    }

    get(key) {
      const access = key[this.vdata];

      // we have data, return it
      if (access) {
        return this.data[access];
      }

      // we don't have data, return nothing.
      // return undefined explicitly as that's the contract for this method
      log('We have no data for this element', key);
      return undefined;
    }

    has(key) {
      const access = key[this.vdata];

      return access in this.data;
    }

    delete(key) {
      const access = key[this.vdata];

      if (access) {
        delete this.data[access];
        delete key[this.vdata];
      }
    }
  };
}

/**
 * Element Data Store.
 *
 * Allows for binding data to an element without putting it directly on the
 * element. Ex. Event listeners are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 *
 * @type {Object}
 * @private
 */
export default window.WeakMap ? new WeakMap() : new FakeWeakMap();
