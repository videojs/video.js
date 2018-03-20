import window from 'global/window';
const sourcesetLoad = (tech) => {
  const el = tech.el();
  // if `el.src` is set, that source will be loaded
  // otherwise, we can't know for sure what source will be set because
  // source elements will be used but implementing the source selection algorithm
  // is laborious and asynchronous, so,
  // instead return an empty string to basically indicate source may change
  let src = el.src || '';

  // if their is only one source
  // we can know that it is that source
  if (!src) {
    const sources = tech.$$('source');
    const srcUrls = [];

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
  }
  tech.triggerSourceset(src);
};

const getInnerHTMLDescriptor = (tech) => {
  const el = tech.el();
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

const getSrcDescriptor = (tech) => {
  const el = tech.el();
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
      return proto.getAttribute.call(tech, 'src');
    };
  }

  if (!srcDescriptor.set) {
    srcDescriptor.set = function(v) {
      return proto.setAttribute.call(tech, 'src', v);
    };
  }

  if (typeof srcDescriptor.enumerable === 'undefined') {
    srcDescriptor.enumerable = true;
  }

  return srcDescriptor;
};

const patchSourceSet = function(tech) {
  if (!tech.featuresSourceset) {
    return;
  }

  const el = tech.el();

  // we need to fire sourceset when the player is ready
  // if we find that the media element had a src when it was
  // given to us and that tech element is not in a stalled state
  if (el.src || el.currentSrc && el.initNetworkState_ !== 3) {
    tech.triggerSourceset(el.src || el.currentSrc);
  }

  // for some reason adding a source element when a mediaElement has no source
  // calls `load` internally right away. We need to handle that.
  if (!el.src && !el.currentSrc && !tech.$$('source').length) {
    const oldAppend = el.append;
    const oldAppendChild = el.appendChild;
    const oldInsertAdjacentHTML = el.insertAdjacentHTML;

    if (oldAppend) {
      el.appendChild = function() {
        const retval = oldAppendChild.apply(el, arguments);

        sourcesetLoad(tech);

        return retval;
      };
    }

    el.append = function() {
      const retval = oldAppend.apply(el, arguments);

      sourcesetLoad(tech);

      return retval;
    };

    el.insertAdjacentHTML = function() {
      const retval = oldInsertAdjacentHTML.apply(el, arguments);

      sourcesetLoad(tech);

      return retval;
    };

    const innerDescriptor = getInnerHTMLDescriptor(tech);

    Object.defineProperty(el, 'innerHTML', {
      get: innerDescriptor.get.bind(el),
      set: (v) => {
        const retval = innerDescriptor.set.call(el, v);

        sourcesetLoad(tech);

        return retval;
      },
      configurable: true,
      enumerable: innerDescriptor.enumerable
    });

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
  }

  const srcDescriptor = getSrcDescriptor(tech);

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

  const oldSetAttribute = el.setAttribute;

  el.setAttribute = (n, v) => {
    const retval = oldSetAttribute.call(el, n, v);

    if (n === 'src') {
      tech.triggerSourceset(el.getAttribute('src'));
    }

    return retval;
  };

  const oldLoad = el.load;

  el.load = () => {
    const retval = oldLoad.call(el);

    sourcesetLoad(tech);

    return retval;
  };

};

export default patchSourceSet;
