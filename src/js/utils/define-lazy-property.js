/**
 * Object.defineProperty but "lazy", which means that the value is only set after
 * it retrieved the first time, rather than being set right away.
 *
 * @param {Object} obj the object to set the property on
 * @param {string} key the key for the property to set
 * @param {Function} getValue the function used to get the value when it is needed.
 * @param {boolean} setter wether a setter shoould be allowed or not
 */
const defineLazyProperty = function(obj, key, getValue, setter = true) {
  const set = (value) =>
    Object.defineProperty(obj, key, {value, enumerable: true, writable: true});

  const options = {
    configurable: true,
    enumerable: true,
    get() {
      const value = getValue();

      set(value);

      return value;
    }
  };

  if (setter) {
    options.set = set;
  }

  return Object.defineProperty(obj, key, options);
};

export default defineLazyProperty;
