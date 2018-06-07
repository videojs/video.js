import window from 'global/window';
import document from 'global/document';
import mergeOptions from '../utils/merge-options';
import {getAbsoluteURL} from '../utils/url';

/**
 * This function is used to fire a sourceset when there is something
 * similar to `mediaEl.load()` being called. It will try to find the source via
 * the `src` attribute and then the `<source>` elements. It will then fire `sourceset`
 * with the source that was found or empty string if we cannot know. If it cannot
 * find a source then `sourceset` will not be fired.
 *
 * @param {Html5} tech
 *        The tech object that sourceset was setup on
 *
 * @return {boolean}
 *         returns false if the sourceset was not fired and true otherwise.
 */
const sourcesetLoad = (tech) => {
  const el = tech.el();

  // if `el.src` is set, that source will be loaded.
  if (el.hasAttribute('src')) {
    tech.triggerSourceset(el.src);
    return true;
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
    return false;
  }

  // only count valid/non-duplicate source elements
  for (let i = 0; i < sources.length; i++) {
    const url = sources[i].src;

    if (url && srcUrls.indexOf(url) === -1) {
      srcUrls.push(url);
    }
  }

  // there were no valid sources
  if (!srcUrls.length) {
    return false;
  }

  // there is only one valid source element url
  // use that
  if (srcUrls.length === 1) {
    src = srcUrls[0];
  }

  tech.triggerSourceset(src);
  return true;
};

/**
 * our implementation of an `innerHTML` descriptor for browsers
 * that do not have one.
 */
const innerHTMLDescriptorPolyfill = Object.defineProperty({}, 'innerHTML', {
  get() {
    return this.cloneNode(true).innerHTML;
  },
  set(v) {
    // make a dummy node to use innerHTML on
    const dummy = document.createElement(this.nodeName.toLowerCase());

    // set innerHTML to the value provided
    dummy.innerHTML = v;

    // make a document fragment to hold the nodes from dummy
    const docFrag = document.createDocumentFragment();

    // copy all of the nodes created by the innerHTML on dummy
    // to the document fragment
    while (dummy.childNodes.length) {
      docFrag.appendChild(dummy.childNodes[0]);
    }

    // remove content
    this.innerText = '';

    // now we add all of that html in one by appending the
    // document fragment. This is how innerHTML does it.
    window.Element.prototype.appendChild.call(this, docFrag);

    // then return the result that innerHTML's setter would
    return this.innerHTML;
  }
});

/**
 * Get a property descriptor given a list of priorities and the
 * property to get.
 */
const getDescriptor = (priority, prop) => {
  let descriptor = {};

  for (let i = 0; i < priority.length; i++) {
    descriptor = Object.getOwnPropertyDescriptor(priority[i], prop);

    if (descriptor && descriptor.set && descriptor.get) {
      break;
    }
  }

  descriptor.enumerable = true;
  descriptor.configurable = true;

  return descriptor;
};

const getInnerHTMLDescriptor = (tech) => getDescriptor([
  tech.el(),
  window.HTMLMediaElement.prototype,
  window.Element.prototype,
  innerHTMLDescriptorPolyfill
], 'innerHTML');

/**
 * Patches browser internal functions so that we can tell synchronously
 * if a `<source>` was appended to the media element. For some reason this
 * causes a `sourceset` if the the media element is ready and has no source.
 * This happens when:
 * - The page has just loaded and the media element does not have a source.
 * - The media element was emptied of all sources, then `load()` was called.
 *
 * It does this by patching the following functions/properties when they are supported:
 *
 * - `append()` - can be used to add a `<source>` element to the media element
 * - `appendChild()` - can be used to add a `<source>` element to the media element
 * - `insertAdjacentHTML()` -  can be used to add a `<source>` element to the media element
 * - `innerHTML` -  can be used to add a `<source>` element to the media element
 *
 * @param {Html5} tech
 *        The tech object that sourceset is being setup on.
 */
const firstSourceWatch = function(tech) {
  const el = tech.el();

  // make sure firstSourceWatch isn't setup twice.
  if (el.resetSourceWatch_) {
    return;
  }

  const old = {};
  const innerDescriptor = getInnerHTMLDescriptor(tech);
  const appendWrapper = (appendFn) => (...args) => {
    const retval = appendFn.apply(el, args);

    sourcesetLoad(tech);

    return retval;
  };

  ['append', 'appendChild', 'insertAdjacentHTML'].forEach((k) => {
    if (!el[k]) {
      return;
    }

    // store the old function
    old[k] = el[k];

    // call the old function with a sourceset if a source
    // was loaded
    el[k] = appendWrapper(old[k]);
  });

  Object.defineProperty(el, 'innerHTML', mergeOptions(innerDescriptor, {
    set: appendWrapper(innerDescriptor.set)
  }));

  el.resetSourceWatch_ = () => {
    el.resetSourceWatch_ = null;
    Object.keys(old).forEach((k) => {
      el[k] = old[k];
    });

    Object.defineProperty(el, 'innerHTML', innerDescriptor);
  };

  // on the first sourceset, we need to revert our changes
  tech.one('sourceset', el.resetSourceWatch_);
};

/**
 * our implementation of a `src` descriptor for browsers
 * that do not have one.
 */
const srcDescriptorPolyfill = Object.defineProperty({}, 'src', {
  get() {
    if (this.hasAttribute('src')) {
      return getAbsoluteURL(window.Element.prototype.getAttribute.call(this, 'src'));
    }

    return '';
  },
  set(v) {
    window.Element.prototype.setAttribute.call(this, 'src', v);

    return v;
  }
});

const getSrcDescriptor = (tech) => getDescriptor([tech.el(), window.HTMLMediaElement.prototype, srcDescriptorPolyfill], 'src');

/**
 * setup `sourceset` handling on the `Html5` tech. This function
 * patches the following element properties/functions:
 *
 * - `src` - to determine when `src` is set
 * - `setAttribute()` - to determine when `src` is set
 * - `load()` - this re-triggers the source selection algorithm, and can
 *              cause a sourceset.
 *
 * If there is no source when we are adding `sourceset` support or during a `load()`
 * we also patch the functions listed in `firstSourceWatch`.
 *
 * @param {Html5} tech
 *        The tech to patch
 */
const setupSourceset = function(tech) {
  if (!tech.featuresSourceset) {
    return;
  }

  const el = tech.el();

  // make sure sourceset isn't setup twice.
  if (el.resetSourceset_) {
    return;
  }

  const srcDescriptor = getSrcDescriptor(tech);
  const oldSetAttribute = el.setAttribute;
  const oldLoad = el.load;

  Object.defineProperty(el, 'src', mergeOptions(srcDescriptor, {
    set: (v) => {
      const retval = srcDescriptor.set.call(el, v);

      // we use the getter here to get the actual value set on src
      tech.triggerSourceset(el.src);

      return retval;
    }
  }));

  el.setAttribute = (n, v) => {
    const retval = oldSetAttribute.call(el, n, v);

    if ((/src/i).test(n)) {
      tech.triggerSourceset(el.src);
    }

    return retval;
  };

  el.load = () => {
    const retval = oldLoad.call(el);

    // if load was called, but there was no source to fire
    // sourceset on. We have to watch for a source append
    // as that can trigger a `sourceset` when the media element
    // has no source
    if (!sourcesetLoad(tech)) {
      tech.triggerSourceset('');
      firstSourceWatch(tech);
    }

    return retval;
  };

  if (el.currentSrc) {
    tech.triggerSourceset(el.currentSrc);
  } else if (!sourcesetLoad(tech)) {
    firstSourceWatch(tech);
  }

  el.resetSourceset_ = () => {
    el.resetSourceset_ = null;
    el.load = oldLoad;
    el.setAttribute = oldSetAttribute;
    Object.defineProperty(el, 'src', srcDescriptor);
    if (el.resetSourceWatch_) {
      el.resetSourceWatch_();
    }
  };
};

export default setupSourceset;
