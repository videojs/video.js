/**
* Player Component - Class that manages spatial navigation
*
* @file spatial-navigation.js
*/

class SpatialNavigation {

  /**
   * Constructs a SpatialNavigation instance with initial settings.
   * Initializes key codes for navigation, sets up the player instance,
   * and prepares the spatial navigation system.
   *
   * @class
   * @param {Object} player - The Video.js player instance to which the spatial navigation is attached.
   * @param {Component|null} initialFocusedComponent - The component that should initially have focus
   *                                                   when the spatial navigation system starts.
   *                                                   If null or not provided, no component will be initially focused.
   */
  constructor(player, initialFocusedComponent) {
    const self = this;

    this.ARROW_KEY_CODE = {37: 'left', 38: 'up', 39: 'right', 40: 'down'};
    this.player = player;
    this.components = new Set();
    this.focusableComponents = [];
    this.isListening = false;
    this.isPaused = false;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.currentFocus = initialFocusedComponent || null;
    this.player.ready(function() {
      self.start();
      // Set the initial focused element or default to null
    });
  }

  /**
   * Starts the spatial navigation by adding a keydown event listener to the video container.
   * This method ensures that the event listener is added only once.
   */
  start() {
    if (!this.isListening) {
      this.player.el().addEventListener('keydown', this.onKeyDown);
      this.isListening = true;
    }
  }

  /**
   * Stops the spatial navigation by removing the keydown event listener from the video container.
   * Also sets the `isListening` flag to false.
   */
  stop() {
    this.player.el().removeEventListener('keydown', this.onKeyDown);
    this.isListening = false;
  }

  /**
   * Responds to keydown events for spatial navigation.
   *
   * Checks if navigation is active and handles arrow key inputs to move in the respective direction.
   *
   * @param {KeyboardEvent} e - The keydown event.
   */
  onKeyDown(e) {
    if (!this.isPaused) {
      const direction = this.ARROW_KEY_CODE[e.keyCode];

      if (direction) {
        this.move(direction);
        e.preventDefault();
      }
    }
  }

  /**
   * Pauses the spatial navigation functionality.
   * This method sets a flag that can be used to temporarily disable the navigation logic.
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resumes the spatial navigation functionality if it has been paused.
   * This method resets the pause flag, re-enabling the navigation logic.
   */
  resume() {
    this.isPaused = false;
  }

  getComponents() {
    const player = this.player;
    const focusableComponents = [];

    function searchForChildrenCandidates(componentsArray) {
      for (const i of componentsArray) {
        if (i.hasOwnProperty('el_') && i.getIsFocusable() && i.getIsAvailableToBeFocused()) {
          focusableComponents.push(i);
        }
        if (i.hasOwnProperty('children_') && i.children_ .length > 0) {
          searchForChildrenCandidates(i.children_);
        }
      }
    }

    for (const [key, value] of Object.entries(player)) {
      if (key && value && value.hasOwnProperty('el_') && key !== 'player_') {
        if (player[key].getIsFocusable() && player[key].getIsAvailableToBeFocused()) {
          focusableComponents.push(value);
        } else if (value.hasOwnProperty('children_') && player[key].children_.length > 0) {
          searchForChildrenCandidates(player[key].children_);
        }
      }
    }

    this.focusableComponents = focusableComponents;
    return this.focusableComponents;
  }

  add(component) {
    const focusableComponents = [...this.focusableComponents];

    if (component.hasOwnProperty('el_') && component.getIsFocusable() && component.getIsAvailableToBeFocused()) {
      focusableComponents.push(component);
    }

    this.focusableComponents = focusableComponents;
  }

  remove(component) {
    for (let i = 0; i < this.focusableComponents.length; i++) {
      if (this.focusableComponents[i].name_ === component.name_) {
        this.focusableComponents.splice(i, 1);
      }
    }
  }

  clear() {
    this.focusableComponents = [];
  }

  move(direction) {}

  // TODO METHODS
  // // add focusable component
  // add(component: Component): void;
  // // remove focusable component
  // remove(component: Component): void;
  // // clear current list of focusable components
  // clear(): void;
}

export default SpatialNavigation;
