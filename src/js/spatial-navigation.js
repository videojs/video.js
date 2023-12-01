/**
* Player Component - Class that manages spatial navigation
*
* @file spatial-navigation.js
*/

class SpatialNavigation {

  /**
     * Constructs a SpatialNavigation instance with initial settings.
     *
     * @class
     * @param {Component|null} initialFocusedComponent - The component that should initially have focus
     *                                                   when the spatial navigation system starts.
     *                                                   If null or not provided, no component will be initially focused.
     */
  constructor(initialFocusedComponent) {
    // const ARROW_KEY_CODE = {37: 'left', 38: 'up', 39: 'right', 40: 'down'};
    this.components = new Set();
    this.isListening = false;
    this.pause = false;
    // Set the initial focused element or default to null
    this.currentFocus = initialFocusedComponent || null;
  }

  /**
     * Starts the spatial navigation by adding a keydown event listener to the video container.
     * This method ensures that the event listener is added only once.
     */
  start() {
    if (!this.isListening) {
      this.videoContainer.addEventListener('keydown', this.onKeyDown);
      this.isListening = true;
    }
  }

  /**
     * Stops the spatial navigation by removing the keydown event listener from the video container.
     * Also sets the `isListening` flag to false.
     */
  stop() {
    this.videoContainer.removeEventListener('keydown', this.onKeyDown);
    this.isListening = false;
  }

  onKeyDown(e) {

  }

  /**
     * Pauses the spatial navigation functionality.
     * This method sets a flag that can be used to temporarily disable the navigation logic.
     */
  pause() {
    this.pause = true;
  }

  /**
     * Resumes the spatial navigation functionality if it has been paused.
     * This method resets the pause flag, re-enabling the navigation logic.
     */
  resume() {
    this.pause = false;
  }

  getComponents() {
    const player = window.player;
    let focusableComponents = [];

    function searchForChildrenCandidates(componentsArray) {
      for (let i of componentsArray) {
        if (i.hasOwnProperty('el_') && i.getIsFocusable() && i.getIsAvailableToBeFocused()) {
          focusableComponents.push(i.el_);
        }
        if (i.hasOwnProperty('children_') && i.children_ .length > 0) {
          searchForChildrenCandidates(i.children_);
        }
      }
    }

    for (const [key, value] of Object.entries(player)) {
      if (key && value && value.hasOwnProperty('el_') && key !== 'player_') {
        if (player[key].getIsFocusable() && player[key].getIsAvailableToBeFocused()) {
          focusableComponents.push(value.el_);
        } else if (value.hasOwnProperty('children_') && player[key].children_.length > 0) {
          searchForChildrenCandidates(player[key].children_);
        }
      }
    }

    return focusableComponents;
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

