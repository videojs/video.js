/**
 * Player Component - Class that manages spatial navigation
 *
 * @file spatial-navigation.js
 */

class SpatialNavigation {
  // Temporary pause spatial navigation
  pause() {
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

  // Resume spatial navigation
  resume() {
    window.addEventListener("keydown", window.spatialNavKeyListener.listener);
    return;
  }

  // // current focusable components:
  // getComponents(): Set<Component>;
  // // start list keydown events
  // start(): void;
  // // stop listen key down events
  // stop(): void;
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
