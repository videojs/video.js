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
    this.ARROW_KEY_CODE = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
    this.player = player;
    this.components = new Set();
    this.focusableComponents = [];
    this.isListening = false;
    this.isPaused = false;
    this.eventListeners = [];
    this.onKeyDown = this.onKeyDown.bind(this);
    this.currentFocus = initialFocusedComponent || null;
    this.lastFocusedComponent = null;
  }

  /**
   * Starts the spatial navigation by adding a keydown event listener to the video container.
   * This method ensures that the event listener is added only once.
   */
  start() {
    if (!this.isListening) {
      this.player.el().addEventListener('keydown', this.onKeyDown);
      this.isListening = true;
      // this set focus is currently here just for testing purposes
      this.focus(this.getComponents()[0]);
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
   * Handles Player Blur.
   *
   */
  handlePlayerBlur(component) {
    if (component.name() === 'CloseButton') {
      this.refocusComponent();
    } else {
      this.pause();

      if (component && component.el_) {
        this.lastFocusedComponent = component;
      }
    }
  }

  /**
   * Handles Player Focus.
   *
   */
  handlePlayerFocus() {
    this.resume();
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
        if (i.hasOwnProperty('el_') && i.getIsFocusable(i.el_) && i.getIsAvailableToBeFocused(i.el_)) {
          focusableComponents.push(i);
        }
        if (i.hasOwnProperty('children_') && i.children_.length > 0) {
          searchForChildrenCandidates(i.children_);
        }
      }
    }

    player.children_.forEach((value) => {
      if (value.hasOwnProperty('el_')) {
        if (value.getIsFocusable && value.getIsAvailableToBeFocused && value.getIsFocusable(value.el_) && value.getIsAvailableToBeFocused(value.el_)) {
          focusableComponents.push(value);
        } else if (value.hasOwnProperty('children_') && value.children_.length > 0) {
          searchForChildrenCandidates(value.children_);
        } else if (value.hasOwnProperty('items') && value.items.length > 0) {
          searchForChildrenCandidates(value.items);
        } else if (this.findSuitableDOMChild(value)) {
          focusableComponents.push(value);
        }
      }
    });

    this.focusableComponents = focusableComponents;
    return this.focusableComponents;
  }

  /**
   * Finds a suitable child element within the provided component's DOM element.
   *
   * @param {Object} component - The component containing the DOM element to search within.
   * @return {HTMLElement|null} Returns the suitable child element if found, or null if not found.
   */
  findSuitableDOMChild(component) {
    function searchForSuitableChild(node) {
      if (component.getIsFocusable(node) && component.getIsAvailableToBeFocused(node)) {
        return node;
      }

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const suitableChild = searchForSuitableChild(child);

        if (suitableChild) {
          return suitableChild;
        }
      }

      return null;
    }

    return searchForSuitableChild(component.el_);
  }

  /**
   * Gets the current focused component.
   *
   * @return {Component}
   *         Returns a focused component.
   */
  getCurrentComponent() {
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
    // Trigger the notification manually
    this.notifyListeners('focusableComponentsChanged', { focusableComponents: this.focusableComponents });

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
    // Trigger the notification manually
    this.notifyListeners('focusableComponentsChanged', { focusableComponents: this.focusableComponents });
  }

  /**
   * Clears array of focusable components.
   */
  clear() {
    // Check if the array is already empty to avoid unnecessary event triggering
    if (this.focusableComponents.length > 0) {
      // Clear the array
      this.focusableComponents = [];

      // Trigger the notification manually
      this.notifyListeners('focusableComponentsChanged', { focusableComponents: this.focusableComponents });
    }
  }

  /**
   * Navigates to the next focusable component based on the specified direction.
   *
   * @param {string} direction 'up', 'down', 'left', 'right'
   */
  move(direction) {
    const currentFocusedComponent = this.getCurrentComponent();

    if (!currentFocusedComponent) {
      return;
    }

    const currentPositions = currentFocusedComponent.getPositions();
    const candidates = this.focusableComponents.filter(component =>
      component !== currentFocusedComponent &&
      this.isInDirection(currentPositions.boundingClientRect, component.getPositions().boundingClientRect, direction));

    const bestCandidate = this.findBestCandidate(currentPositions.center, candidates, direction);

    if (bestCandidate) {
      this.focus(bestCandidate);
    } else {
      this.notifyListeners('endOfFocusableComponents', { direction, focusedElement: currentFocusedComponent });
    }
  }

  /**
   * Finds the best candidate on the current center position,
   * the list of candidates, and the specified navigation direction.
   *
   * @param {Object} currentCenter The center position of the current focused component element.
   * @param {Array} candidates An array of candidate components to receive focus.
   * @param {string} direction The direction of navigation ('up', 'down', 'left', 'right').
   * @return The component that is the best candidate for receiving focus.
   */
  findBestCandidate(currentCenter, candidates, direction) {
    let minDistance = Infinity;
    let bestCandidate = null;

    for (const candidate of candidates) {
      const candidateCenter = candidate.getPositions().center;
      const distance = this.calculateDistance(currentCenter, candidateCenter, direction);

      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Determines if a target rectangle is in the specified navigation direction
   * relative to a source rectangle.
   *
   * @param {Object} srcRect The bounding rectangle of the source element.
   * @param {Object} targetRect The bounding rectangle of the target element.
   * @param {string} direction The navigation direction ('up', 'down', 'left', 'right').
   * @return {boolean} True if the target is in the specified direction relative to the source.
   */
  isInDirection(srcRect, targetRect, direction) {
    switch (direction) {
    case 'right':
      return targetRect.left >= srcRect.right;
    case 'left':
      return targetRect.right <= srcRect.left;
    case 'down':
      return targetRect.top >= srcRect.bottom;
    case 'up':
      return targetRect.bottom <= srcRect.top;
    default:
      return false;
    }
  }

  /**
   * Focus last focused component saved before blur on player.
   */
  refocusComponent() {
    if (this.lastFocusedComponent) {
      if (!this.player.userActive()) {
        this.player.userActive(true);
      }
      this.getComponents();

      for (let i = 0; i < this.focusableComponents.length; i++) {
        if (this.focusableComponents[i].name_ === this.lastFocusedComponent.name_) {
          this.focus(this.focusableComponents[i]);
        }
      }
    } else {
      this.focus(this.getComponents()[0]);
    }
  }

  /**
   * Focuses on a given component.
   * If the component is available to be focused, it focuses on the component.
   * If not, it attempts to find a suitable DOM child within the component and focuses on it.
   *
   * @param {Component} component - The component to be focused.
   */
  focus(component) {
    if (component.getIsAvailableToBeFocused(component.el_)) {
      component.focus();
    } else if (this.findSuitableDOMChild(component)) {
      this.findSuitableDOMChild(component).focus();
    }
  }

  /**
   * Calculates the distance between two points, adjusting the calculation based on
   * the specified navigation direction.
   *
   * @param {Object} center1 The center point of the first element.
   * @param {Object} center2 The center point of the second element.
   * @param {string} direction The direction of navigation ('up', 'down', 'left', 'right').
   * @return {number} The calculated distance between the two centers.
   */
  calculateDistance(center1, center2, direction) {
    const dx = Math.abs(center1.x - center2.x);
    const dy = Math.abs(center1.y - center2.y);

    let distance;

    switch (direction) {
    case 'right':
    case 'left':
      // Higher weight for vertical distance in horizontal navigation
      distance = dx + (dy * 100);
      break;
    case 'up':
      // Strongly prioritize vertical proximity for UP navigation
      // Adjust the weight to ensure that elements directly above are favored
      distance = (dy * 2) + (dx * 0.5);
      break;
    case 'down':
      // More balanced weight for vertical and horizontal distances
      // Adjust the weights here to find the best balance
      distance = (dy * 5) + dx;
      break;
    default:
      distance = dx + dy;
    }

    return distance;
  }

  /**
   * Adds an event listener for a specific event.
   *
   * @param {string} eventName - The name of the event to listen for.
   * @param {Function} callback - The callback function to be executed when the event occurs.
   */
  addEventListener(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }

    this.eventListeners[eventName].push(callback);
  }

  /**
   * Notifies listeners for a specific event.
   *
   * @param {string} eventName - The name of the event to notify listeners for.
   * @param {Object} [eventDetails={}] - Additional details to include in the event object.
   */
  notifyListeners(eventName, eventDetails = {}) {
    const listeners = this.eventListeners[eventName];

    if (listeners) {
      const event = new CustomEvent(eventName, {
        detail: eventDetails
      });

      listeners.forEach(listener => {
        if (typeof listener === 'function') {
          listener(event);
        }
      });
    }
  }
}

export default SpatialNavigation;
