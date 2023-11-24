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
    window.Element.prototype.spatialNavigationSearch = () => {};
  }

  // Resume spatial navigation
  resume() {
    if (window.spatialNavSearch) {
      window.Element.prototype.spatialNavigationSearch = window.spatialNavSearch;
      window.spatialNavSearch = null;
    }
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

