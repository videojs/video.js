import window from 'global/window';
import mergeOptions from '../utils/merge-options';

const setupSourceset = function(tech) {

  if (!tech.featuresSourceset) {
    return;
  }

  const el = tech.el();

  // we need to fire sourceset when the player is ready
  // if we find that the media element had a src when it was
  // given to us and that tech element is not in a stalled state
  if (el.src || el.currentSrc && tech.el().initNetworkState_ !== 3) {
    tech.triggerSourceset(el.src || el.currentSrc);
  }

  const proto = window.HTMLMediaElement.prototype;
  let srcDescriptor = {};

  // preserve getters/setters already on `el.src` if they exist
  if (Object.getOwnPropertyDescriptor(el, 'src')) {
    srcDescriptor = Object.getOwnPropertyDescriptor(el, 'src');
  } else if (Object.getOwnPropertyDescriptor(proto, 'src')) {
    srcDescriptor = mergeOptions(srcDescriptor, Object.getOwnPropertyDescriptor(proto, 'src'));
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

  Object.defineProperty(el, 'src', {
    get: srcDescriptor.get.bind(el),
    set: (v) => {
      const retval = srcDescriptor.set.call(el, v);

      tech.triggerSourceset(v);

      return retval;
    },
    configurable: true,
    enumerable: srcDescriptor.enumerable
  });

  const oldSetAttribute = el.setAttribute;

  el.setAttribute = (n, v) => {
    const retval = oldSetAttribute.call(el, n, v);

    if (n === 'src') {
      tech.triggerSourceset(v);
    }

    return retval;
  };

  const oldLoad = el.load;

  el.load = () => {
    const retval = oldLoad.call(el);

    // if `el.src` is set, that source will be loaded
    // otherwise, we can't know for sure what source will be set because
    // source elements will be used but implementing the source selection algorithm
    // is laborious and asynchronous, so,
    // instead return an empty string to basically indicate source may change
    tech.triggerSourceset(el.src || '');

    return retval;
  };
};

export default setupSourceset;
