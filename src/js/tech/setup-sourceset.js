import window from 'global/window';

/**
 * This function is used to fire a sourceset when there is something
 * similar to `mediaEl.load()` being called. It will try to find the `src`
 * and if there it cannot there was no `sourceset` and it will not fire one.
 *
 * @param {Html5} tech
 *        The tech object that sourceset was setup on
 */
const sourcesetLoad = (tech) => {
  const el = tech.el();

  // if `el.src` is set, that source will be loaded.
  if (el.src) {
    tech.triggerSourceset(el.src);
    return;
  }

  /**
   * Since there isn't a src property on the media element, source elements will be used for
   * implementing the source selection algorithm. This happens asynchronously and
   * for most cases were there is more than one source we cannot tell what source will
   * be loaded, without re-implementing the source selection algorithm. At this time we are not
   * going to do that. There are three special cases that we do handle here though:
   *
   * 1. If there are no sources, do not fire `sourceset`.
   * 2. If there is only one `<source>` with a `src` property/attribute that is our `src`
   * 3. If there is more than one `<source>` but all of them have the same `src` url.
   *    That will be our src.
   */
  const sources = tech.$$('source');
  const srcUrls = [];
  let src = '';

  // if there are no sources, do not fire sourceset
  if (!sources.length) {
    return;
  }

  // only count valid/non-duplicate source elements
  for (let i = 0; i < sources.length; i++) {
    const url = sources[i].src;

    if (srcUrls.indexOf(url) === -1) {
      srcUrls.push(url);
    }
  }

  // there is only one valid source element url
  // use that
  if (srcUrls.length === 1) {
    src = srcUrls[0];
  }

  tech.triggerSourceset(src);
};

/**
 * Get the browsers property descriptor for the innerHTML
 * property. This will allow us to overwrite it without
 * destroying native functionality.
 *
 * @param {HTMLMediaElement} el
 *        The tech element that should be used to get the descriptor
 *
 * @return {Object}
 *          The property descriptor for innerHTML.
 */
const getInnerHTMLDescriptor = (el) => {
  const proto = window.Element.prototype;
  let innerDescriptor = {};

  // preserve getters/setters already on `el.src` if they exist
  if (Object.getOwnPropertyDescriptor(el, 'innerHTML')) {
    innerDescriptor = Object.getOwnPropertyDescriptor(el, 'innerHTML');
  } else if (Object.getOwnPropertyDescriptor(proto, 'innerHTML')) {
    innerDescriptor = Object.getOwnPropertyDescriptor(proto, 'innerHTML');
  }

  if (!innerDescriptor.get) {
    innerDescriptor.get = function() {
      return el.cloneNode.innerHTML;
    };
  }

  if (!innerDescriptor.set) {
    innerDescriptor.set = function(v) {
      window.Element.prototype.insertAdjacentHTML.call(el, 'afterbegin', v);

      return v;
    };
  }

  if (typeof innerDescriptor.enumerable === 'undefined') {
    innerDescriptor.enumerable = true;
  }

  return innerDescriptor;
};

/**
 * Get the browsers property descriptor for the src
 * property. This will allow us to overwrite it without
 * destroying native functionality.
 *
 * @param {HTMLMediaElement} el
 *        The tech element that should be used to get the descriptor
 *
 * @return {Object}
 *          The property descriptor for `src`.
 */
const getSrcDescriptor = (el) => {
  const proto = window.HTMLMediaElement.prototype;
  let srcDescriptor = {};

  // preserve getters/setters already on `el.src` if they exist
  if (Object.getOwnPropertyDescriptor(el, 'src')) {
    srcDescriptor = Object.getOwnPropertyDescriptor(el, 'src');
  } else if (Object.getOwnPropertyDescriptor(proto, 'src')) {
    srcDescriptor = Object.getOwnPropertyDescriptor(proto, 'src');
  }

  if (!srcDescriptor.get) {
    srcDescriptor.get = function() {
      return proto.getAttribute.call(el, 'src');
    };
  }

  if (!srcDescriptor.set) {
    srcDescriptor.set = function(v) {
      return proto.setAttribute.call(el, 'src', v);
    };
  }

  if (typeof srcDescriptor.enumerable === 'undefined') {
    srcDescriptor.enumerable = true;
  }

  return srcDescriptor;
};

/**
 * Patches browser internal functions so that we can tell syncronously
 * if a `<source>` was appended to the media element. For some reason this
 * will cause a `sourceset` if the the media element is ready and has yet to
 * be given a source. It does this by patching the following functions/properties:
 *
 * - `append()` - can be used to add a `<source>` element to the media element
 * - `appendChild()` - can be used to add a `<source>` element to the media element
 * - `insertAdjacentHTML()` -  can be used to add a `<source>` element to the media element
 * - `innerHTML` -  can be used to add a `<source>` element to the media element
 *
 * @param {Html5} tech
 *        The tech object that sourceset is being setup on.
 */
const firstSourceAppend = function(tech) {
  const el = tech.el();
  const oldAppend = el.append;
  const oldAppendChild = el.appendChild;
  const oldInsertAdjacentHTML = el.insertAdjacentHTML;
  const innerDescriptor = getInnerHTMLDescriptor(el);

  el.appendChild = function() {
    const retval = oldAppendChild.apply(el, arguments);

    sourcesetLoad(tech);

    return retval;
  };

  if (oldAppend) {
    el.append = function() {
      const retval = oldAppend.apply(el, arguments);

      sourcesetLoad(tech);

      return retval;
    };
  }

  el.insertAdjacentHTML = function() {
    const retval = oldInsertAdjacentHTML.apply(el, arguments);

    sourcesetLoad(tech);

    return retval;
  };

  Object.defineProperty(el, 'innerHTML', {
    get: innerDescriptor.get.bind(el),
    set() {
      const retval = innerDescriptor.set.call(el, arguments);

      sourcesetLoad(tech);

      return retval;
    },
    configurable: true,
    enumerable: innerDescriptor.enumerable
  });

  // on the first sourceset, we need to revert
  // our changes
  tech.one('sourceset', () => {
    el.appendChild = oldAppendChild;
    if (oldAppend) {
      el.append = oldAppend;
    }
    el.insertAdjacentHTML = oldInsertAdjacentHTML;

    Object.defineProperty(el, 'innerHTML', {
      get: innerDescriptor.get.bind(el),
      set: innerDescriptor.set.bind(el),
      configurable: true,
      enumerable: innerDescriptor.enumerable
    });
  });
};

/**
 * setup `sourceset` handling on the `Html5` tech. This function
 * patches the following element properties/functions:
 *
 * - `src` - to determine when `src` is set
 * - `setAttribute()` - to determine when `src` is set
 * - `load()` - this re-triggers the source selection algorithm, and can
 *              cause a sourceset.
 *
 * If there is no source when we are adding `sourceset` support we also
 * patch the functions listed in `firstSourceAppend`.
 *
 * @param {Html5} tech
 *        The tech to patch
 */
const setupSourceset = function(tech) {
  if (!tech.featuresSourceset) {
    return;
  }

  const el = tech.el();
  const srcDescriptor = getSrcDescriptor(tech);
  const oldSetAttribute = el.setAttribute;
  const oldLoad = el.load;

  // we need to fire sourceset when the player is ready
  // if we find that the media element had a src when it was
  // given to us and that tech element is not in a stalled state
  if (el.src || el.currentSrc && el.initNetworkState_ !== 3) {
    tech.triggerSourceset(el.src || el.currentSrc);
  }

  // for some reason adding a source element when a mediaElement has no source
  // calls `load` internally right away. We need to handle that.
  if (!el.src && !el.currentSrc && !tech.$$('source').length) {
    firstSourceAppend(tech);
  }

  Object.defineProperty(el, 'src', {
    get: srcDescriptor.get.bind(el),
    set: (v) => {
      const retval = srcDescriptor.set.call(el, v);

      // we use the getter here to get the actual value set on
      // src
      tech.triggerSourceset(el.src);

      return retval;
    },
    configurable: true,
    enumerable: srcDescriptor.enumerable
  });

  el.setAttribute = (n, v) => {
    const retval = oldSetAttribute.call(el, n, v);

    if (n === 'src') {
      tech.triggerSourceset(el.getAttribute('src'));
    }

    return retval;
  };

  el.load = () => {
    const retval = oldLoad.call(el);

    sourcesetLoad(tech);

    return retval;
  };

};

export default setupSourceset;
