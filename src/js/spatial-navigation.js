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

  /**
   * Gets a set of focusable components.
   *
   * @return {Array}
   *         Returns an array of focusable components.
   */
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

  /**
   * Gets the current focused component.
   *
   * @return {Component}
   *         Returns a focused component.
   */
  getCurretComponent() {
    this.getComponents();

    if (this.focusableComponents.length) {
      for (const i of this.focusableComponents) {
        // eslint-disable-next-line
        if (i.el_ === document.activeElement) {
          return i;
        }
      }
    }
  }

  /**
   * Gets the best candiate out of the focusable components.
   *
   * @return {Component}
   *         Returns best candidate focusable component.
   */
  findBestCandidate(direction) {
    this.getCurretComponent();

    switch (direction) {
    case 'left':
    case 'right':
    case 'up':
    case 'down':
    default:
      return null;
    }
  }

  /**
   * Adds a component to the array of focusable components.
   *
   * @param {Component} component
   *        The `Component` to be added.
   */
  add(component) {
    const focusableComponents = [...this.focusableComponents];

    if (component.hasOwnProperty('el_') && component.getIsFocusable() && component.getIsAvailableToBeFocused()) {
      focusableComponents.push(component);
    }

    this.focusableComponents = focusableComponents;
  }

  /**
   * Removes component from the array of focusable components.
   *
   * @param {Component} component
   */
  remove(component) {
    for (let i = 0; i < this.focusableComponents.length; i++) {
      if (this.focusableComponents[i].name_ === component.name_) {
        this.focusableComponents.splice(i, 1);
      }
    }
  }

  /**
   * Clears array of focusable components.
   */
  clear() {
    this.focusableComponents = [];
  }

  move(direction) {
    this.getComponents();

    const currentFocusedComponent = this.getCurretComponent();

    if (!currentFocusedComponent) {
      return;
    }

    const currentRect = currentFocusedComponent.el_.getBoundingClientRect();
    let bestCandidate = null;
    let minDistance = Infinity;

    for (const component of this.focusableComponents) {
      if (component === currentFocusedComponent) {
        continue;
      }

      const rect = component.el_.getBoundingClientRect();

      let distance;

      switch (direction) {
      case 'right':
        if (rect.left > currentRect.right) {
          distance = rect.left - currentRect.right;
        }
        break;
      case 'left':
        if (rect.right < currentRect.left) {
          distance = currentRect.left - rect.right;
        }
        break;
      case 'down':
        if (rect.top > currentRect.bottom) {
          distance = rect.top - currentRect.bottom;
        }
        break;
      case 'up':
        if (rect.bottom < currentRect.top) {
          distance = currentRect.top - rect.bottom;
        }
        break;
      }

      if (distance !== undefined && distance < minDistance) {
        minDistance = distance;
        bestCandidate = component;
      }
    }

    if (bestCandidate) {
      bestCandidate.focus();
    }
  }

  // TODO METHODS
  // // add focusable component
  // add(component: Component): void;
  // // remove focusable component
  // remove(component: Component): void;
  // // clear current list of focusable components
  // clear(): void;
}

export default SpatialNavigation;
