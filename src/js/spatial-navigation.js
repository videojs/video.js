/**
* Player Component - Class that manages spatial navigation
*
* @file spatial-navigation.js
*/

class SpatialNavigation {
  // Start listen of keydown events
  start() {
    if (window.spatialNavKeyListener.listener) {
      window.addEventListener("keydown", window.spatialNavKeyListener.listener);
      window.spatialNavKeyListener.listener = null;
    }
  }

  // Stop listen key down events
  stop() {
    const keydownEventListeners = getEventListeners(window).keydown;

    function getSpatialNavEventIndex() {
      let SpatialNavEventIndex = null;

      for (let i = 0; i < keydownEventListeners.length; i++) {
        if (keydownEventListeners[i].listener) {
          const keyDownFunctionString = "const currentKeyMode = (parent && parent.__spatialNavigation__.keyMode)";

          if (keydownEventListeners[i].listener.toString().includes(keyDownFunctionString)) {
            SpatialNavEventIndex = i;
          }
        }
      }

      return SpatialNavEventIndex;
    }

    let SpatialNavEventIndex = getSpatialNavEventIndex();

    if ((typeof SpatialNavEventIndex) === "number") {
      window.spatialNavKeyListener = getEventListeners(window).keydown[SpatialNavEventIndex];
      window.removeEventListener("keydown", getEventListeners(window).keydown[SpatialNavEventIndex].listener);
    }
  }

  // Temporary pause spatial navigation
  pause() {
    window.spatialNavSearch = window.Element.prototype.spatialNavigationSearch;
    window.Element.prototype.spatialNavigationSearch = () => { };
  }

  // Resume spatial navigation
  resume() {
    if (window.spatialNavSearch) {
      window.Element.prototype.spatialNavigationSearch = window.spatialNavSearch;
      window.spatialNavSearch = null;
    }
  }

  // Get current focusable components:
  // getComponents(): Set<Component>;
  // { selector: 'a, .focusable' }
  getComponents() {
    let mapOfBoundRect = null;

    /**
   * Get the DOMRect of an element
   * @function getBoundingClientRect
   * @param {Node} element 
   * @returns {DOMRect}
   */
    function getBoundingClientRect(element) {
      // memoization
      let rect = mapOfBoundRect && mapOfBoundRect.get(element);
      if (!rect) {
        const boundingClientRect = element.getBoundingClientRect();
        rect = {
          top: Number(boundingClientRect.top.toFixed(2)),
          right: Number(boundingClientRect.right.toFixed(2)),
          bottom: Number(boundingClientRect.bottom.toFixed(2)),
          left: Number(boundingClientRect.left.toFixed(2)),
          width: Number(boundingClientRect.width.toFixed(2)),
          height: Number(boundingClientRect.height.toFixed(2))
        };
        mapOfBoundRect && mapOfBoundRect.set(element, rect);
      }
      return rect;
    }

    /**
   * Decide whether this element is entirely or partially visible within the viewport.
   * @function hitTest
   * @param element {Node}
   * @returns {boolean}
   */
    function hitTest(element) {
      const elementRect = getBoundingClientRect(element);
      if (element.nodeName !== 'IFRAME' && (elementRect.top < 0 || elementRect.left < 0 ||
        elementRect.top > element.ownerDocument.documentElement.clientHeight || elementRect.left > element.ownerDocument.documentElement.clientWidth))
        return false;

      let offsetX = parseInt(element.offsetWidth) / 10;
      let offsetY = parseInt(element.offsetHeight) / 10;

      offsetX = isNaN(offsetX) ? 1 : offsetX;
      offsetY = isNaN(offsetY) ? 1 : offsetY;

      const hitTestPoint = {
        // For performance, just using the three point(middle, leftTop, rightBottom) of the element for hit testing
        middle: [(elementRect.left + elementRect.right) / 2, (elementRect.top + elementRect.bottom) / 2],
        leftTop: [elementRect.left + offsetX, elementRect.top + offsetY],
        rightBottom: [elementRect.right - offsetX, elementRect.bottom - offsetY]
      };

      for (const point in hitTestPoint) {
        const elemFromPoint = element.ownerDocument.elementFromPoint(...hitTestPoint[point]);
        if (element === elemFromPoint || element.contains(elemFromPoint)) {
          return true;
        }
      }
      return false;
    }

    /**
   * Decide whether this element is partially or completely visible to user agent.
   * @function isVisible
   * @param element {Node}
   * @returns {boolean}
   */
    function isVisible(element) {
      return (!element.parentElement) || (isVisibleStyleProperty(element) && hitTest(element));
    }

    /**
   * Decide whether an element is a scrollable container or not.
   * @see {@link https://drafts.csswg.org/css-overflow-3/#scroll-container}
   * @function isScrollContainer
   * @param element {Node}
   * @returns {boolean}
   */
    function isScrollContainer(element) {
      const elementStyle = window.getComputedStyle(element, null);
      const overflowX = elementStyle.getPropertyValue('overflow-x');
      const overflowY = elementStyle.getPropertyValue('overflow-y');

      return ((overflowX !== 'visible' && overflowX !== 'clip' && isOverflow(element, 'left')) ||
        (overflowY !== 'visible' && overflowY !== 'clip' && isOverflow(element, 'down'))) ?
        true : false;
    }

    /**
   * Decide the style property of this element is specified whether it's visible or not.
   * @function isVisibleStyleProperty
   * @param element {CSSStyleDeclaration}
   * @returns {boolean}
   */
    function isVisibleStyleProperty(element) {
      const elementStyle = window.getComputedStyle(element, null);
      const thisVisibility = elementStyle.getPropertyValue('visibility');
      const thisDisplay = elementStyle.getPropertyValue('display');
      const invisibleStyle = ['hidden', 'collapse'];

      return (thisDisplay !== 'none' && !invisibleStyle.includes(thisVisibility));
    }

    /**
   * Decide whether this element is scrollable or not.
   * NOTE: If the value of 'overflow' is given to either 'visible', 'clip', or 'hidden', the element isn't scrollable.
   *       If the value is 'hidden', the element can be only programmically scrollable. (https://drafts.csswg.org/css-overflow-3/#valdef-overflow-hidden)
   * @function isScrollable
   * @param element {Node}
   * @param dir {SpatialNavigationDirection} - The directional information for the spatial navigation (e.g. LRUD)
   * @returns {boolean}
   */
    function isScrollable(element, dir) { // element, dir
      if (element && typeof element === 'object') {
        if (dir && typeof dir === 'string') { // parameter: dir, element
          if (isOverflow(element, dir)) {
            // style property
            const elementStyle = window.getComputedStyle(element, null);
            const overflowX = elementStyle.getPropertyValue('overflow-x');
            const overflowY = elementStyle.getPropertyValue('overflow-y');

            switch (dir) {
              case 'left':
              /* falls through */
              case 'right':
                return (overflowX !== 'visible' && overflowX !== 'clip' && overflowX !== 'hidden');
              case 'up':
              /* falls through */
              case 'down':
                return (overflowY !== 'visible' && overflowY !== 'clip' && overflowY !== 'hidden');
            }
          }
          return false;
        } else { // parameter: element
          return (element.nodeName === 'HTML' || element.nodeName === 'BODY') ||
            (isScrollContainer(element) && isOverflow(element));
        }
      }
    }

    /**
     * Decide whether an element is overflow or not.
     * @function isOverflow
     * @param element {Node}
     * @param dir {SpatialNavigationDirection} - The directional information for the spatial navigation (e.g. LRUD)
     * @returns {boolean}
     */
    function isOverflow(element, dir) {
      if (element && typeof element === 'object') {
        if (dir && typeof dir === 'string') { // parameter: element, dir
          switch (dir) {
            case 'left':
            /* falls through */
            case 'right':
              return (element.scrollWidth > element.clientWidth);
            case 'up':
            /* falls through */
            case 'down':
              return (element.scrollHeight > element.clientHeight);
          }
        } else { // parameter: element
          return (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight);
        }
        return false;
      }
    }

    /**
   * Decide whether an element is a tag without href attribute or not.
   *
   * @function isAtagWithoutHref
   * @param element {Node}
   * @returns {boolean}
   */
    function isAtagWithoutHref(element) {
      return (element.tagName === 'A' && element.getAttribute('href') === null && element.getAttribute('tabIndex') === null);
    }

    /**
     * Decide whether an element is actually disabled or not.
     *
     * @function isActuallyDisabled
     * @param element {Node}
     * @returns {boolean}
     *
     * @see {@link https://html.spec.whatwg.org/multipage/semantics-other.html#concept-element-disabled}
     */
    function isActuallyDisabled(element) {
      if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTGROUP', 'OPTION', 'FIELDSET'].includes(element.tagName))
        return (element.disabled);
      else
        return false;
    }

    /**
     * Decide whether the element is expressly inert or not.
     * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#expressly-inert}
     * @function isExpresslyInert
     * @param element {Node}
     * @returns {boolean}
     */
    function isExpresslyInert(element) {
      return ((element.inert) && (!element.ownerDocument.documentElement.inert));
    }

    /**
     * Decide whether the element is being rendered or not.
     * 1. If an element has the style as "visibility: hidden | collapse" or "display: none", it is not being rendered.
     * 2. If an element has the style as "opacity: 0", it is not being rendered.(that is, invisible).
     * 3. If width and height of an element are explicitly set to 0, it is not being rendered.
     * 4. If a parent element is hidden, an element itself is not being rendered.
     * (CSS visibility property and display property are inherited.)
     * @see {@link https://html.spec.whatwg.org/multipage/rendering.html#being-rendered}
     * @function isBeingRendered
     * @param element {Node}
     * @returns {boolean}
     */
    function isBeingRendered(element) {
      if (!isVisibleStyleProperty(element.parentElement))
        return false;
      if (!isVisibleStyleProperty(element) || (element.style.opacity === '0') ||
        (window.getComputedStyle(element).height === '0px' || window.getComputedStyle(element).width === '0px'))
        return false;
      return true;
    }

    /**
     * Decide whether an element is focusable for spatial navigation.
     * 1. If element is the browsing context (document, iframe), then it's focusable,
     * 2. If the element is scrollable container (regardless of scrollable axis), then it's focusable,
     * 3. The value of tabIndex >= 0, then it's focusable,
     * 4. If the element is disabled, it isn't focusable,
     * 5. If the element is expressly inert, it isn't focusable,
     * 6. Whether the element is being rendered or not.
     *
     * @function isFocusable
     * @param element {Node}
     * @returns {boolean}
     *
     * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#focusable-area}
     */
    function isFocusable(element) {
      if ((element.tabIndex < 0) || isAtagWithoutHref(element) || isActuallyDisabled(element) || isExpresslyInert(element) || !isBeingRendered(element))
        return false;
      else if ((!element.parentElement) || (isScrollable(element) && isOverflow(element)) || (element.tabIndex >= 0))
        return true;
    }

    /**
     * Find focusable elements within the spatial navigation container.
     * @see {@link https://drafts.csswg.org/css-nav-1/#dom-element-focusableareas}
     * @function focusableAreas
     * @param option {FocusableAreasOptions} - 'mode' attribute takes 'visible' or 'all' for searching the boundary of focusable elements.
     *                                          Default value is 'visible'.
     * @returns {sequence<Node>} All focusable elements or only visible focusable elements within the container
     */
    function focusableAreas(option = { mode: 'visible' }) {
      const container = document.body;
      const focusables = Array.prototype.filter.call(container.getElementsByTagName('*'), isFocusable);
      return (option.mode === 'all') ? focusables : focusables.filter(isVisible);
    }

    return focusableAreas();
  }

  // TODO METHODS
  // // add focusable component
  // add(component: Component): void;
  // // remove focusable component
  // remove(component: Component): void;
  // // clear current list of focusable components
  // clear(): void;
  // // run spatial navigation Heuristics (re-use https://github.com/WICG/spatial-navigation/blob/main/polyfill/spatial-navigation-polyfill.js#L147)
  // move(direction: SpatialNavigationDirection): void;
}

export default SpatialNavigation;

