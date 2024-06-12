/**
 * @file spatial-navigation.js
 */
import EventTarget from './event-target';
import SpatialNavKeyCodes from './utils/spatial-navigation-key-codes';

/** @import Component from './component' */
/** @import Player from './player' */

// The number of seconds the `step*` functions move the timeline.
const STEP_SECONDS = 5;

/**
 * Spatial Navigation in Video.js enhances user experience and accessibility on smartTV devices,
 * enabling seamless navigation through interactive elements within the player using remote control arrow keys.
 * This functionality allows users to effortlessly navigate through focusable components.
 *
 * @extends EventTarget
 */
class SpatialNavigation extends EventTarget {

  /**
   * Constructs a SpatialNavigation instance with initial settings.
   * Sets up the player instance, and prepares the spatial navigation system.
   *
   * @class
   * @param {Player} player - The Video.js player instance to which the spatial navigation is attached.
   */
  constructor(player) {
    super();
    this.player_ = player;
    this.focusableComponents = [];
    this.isListening_ = false;
    this.isPaused_ = false;
    this.onKeyDown_ = this.onKeyDown_.bind(this);
    this.lastFocusedComponent_ = null;
  }

  /**
   * Starts the spatial navigation by adding a keydown event listener to the video container.
   * This method ensures that the event listener is added only once.
   */
  start() {
    // If the listener is already active, exit early.
    if (this.isListening_) {
      return;
    }

    // Add the event listener since the listener is not yet active.
    this.player_.on('keydown', this.onKeyDown_);
    this.player_.on('modalKeydown', this.onKeyDown_);
    // Listen for source change events
    this.player_.on('loadedmetadata', () => {
      this.focus(this.updateFocusableComponents()[0]);
    });
    this.player_.on('modalclose', () => {
      this.refocusComponent();
    });
    this.player_.on('focusin', this.handlePlayerFocus_.bind(this));
    this.player_.on('focusout', this.handlePlayerBlur_.bind(this));
    this.isListening_ = true;
  }

  /**
   * Stops the spatial navigation by removing the keydown event listener from the video container.
   * Also sets the `isListening_` flag to false.
   */
  stop() {
    this.player_.off('keydown', this.onKeyDown_);
    this.isListening_ = false;
  }

  /**
   * Responds to keydown events for spatial navigation and media control.
   *
   * Determines if spatial navigation or media control is active and handles key inputs accordingly.
   *
   * @param {KeyboardEvent} event - The keydown event to be handled.
   */
  onKeyDown_(event) {
    // Determine if the event is a custom modalKeydown event
    const actualEvent = event.originalEvent ? event.originalEvent : event;

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(actualEvent.key)) {
      // Handle directional navigation
      if (this.isPaused_) {
        return;
      }
      actualEvent.preventDefault();

      // "ArrowLeft" => "left" etc
      const direction = actualEvent.key.substring(5).toLowerCase();

      this.move(direction);
    } else if (SpatialNavKeyCodes.isEventKey(actualEvent, 'play') || SpatialNavKeyCodes.isEventKey(actualEvent, 'pause') ||
      SpatialNavKeyCodes.isEventKey(actualEvent, 'ff') || SpatialNavKeyCodes.isEventKey(actualEvent, 'rw')) {
      // Handle media actions
      actualEvent.preventDefault();
      const action = SpatialNavKeyCodes.getEventName(actualEvent);

      this.performMediaAction_(action);
    } else if (SpatialNavKeyCodes.isEventKey(actualEvent, 'Back') && event.target && event.target.closeable()) {
      actualEvent.preventDefault();
      event.target.close();
    }
  }

  /**
   * Performs media control actions based on the given key input.
   *
   * Controls the playback and seeking functionalities of the media player.
   *
   * @param {string} key - The key representing the media action to be performed.
   *   Accepted keys: 'play', 'pause', 'ff' (fast-forward), 'rw' (rewind).
   */
  performMediaAction_(key) {
    if (this.player_) {
      switch (key) {
      case 'play':
        if (this.player_.paused()) {
          this.player_.play();
        }
        break;
      case 'pause':
        if (!this.player_.paused()) {
          this.player_.pause();
        }
        break;
      case 'ff':
        this.userSeek_(this.player_.currentTime() + STEP_SECONDS);
        break;
      case 'rw':
        this.userSeek_(this.player_.currentTime() - STEP_SECONDS);
        break;
      default:
        break;
      }
    }
  }

  /**
   * Prevent liveThreshold from causing seeks to seem like they
   * are not happening from a user perspective.
   *
   * @param {number} ct
   *        current time to seek to
   */
  userSeek_(ct) {
    if (this.player_.liveTracker && this.player_.liveTracker.isLive()) {
      this.player_.liveTracker.nextSeekedFromUser();
    }

    this.player_.currentTime(ct);
  }

  /**
   * Pauses the spatial navigation functionality.
   * This method sets a flag that can be used to temporarily disable the navigation logic.
   */
  pause() {
    this.isPaused_ = true;
  }

  /**
   * Resumes the spatial navigation functionality if it has been paused.
   * This method resets the pause flag, re-enabling the navigation logic.
   */
  resume() {
    this.isPaused_ = false;
  }

  /**
   * Handles Player Blur.
   *
   * @param {string|Event|Object} event
   *        The name of the event, an `Event`, or an object with a key of type set to
   *        an event name.
   *
   * Calls for handling of the Player Blur if:
   * *The next focused element is not a child of current focused element &
   * The next focused element is not a child of the Player.
   * *There is no next focused element
   */
  handlePlayerBlur_(event) {
    const nextFocusedElement = event.relatedTarget;
    let isChildrenOfPlayer = null;
    const currentComponent = this.getCurrentComponent(event.target);

    if (nextFocusedElement) {
      isChildrenOfPlayer = Boolean(nextFocusedElement.closest('.video-js'));

      // If nextFocusedElement is the 'TextTrackSettings' component
      if (nextFocusedElement.classList.contains('vjs-text-track-settings') && !this.isPaused_) {
        this.searchForTrackSelect_();
      }
    }

    if (!(event.currentTarget.contains(event.relatedTarget)) && !isChildrenOfPlayer || !nextFocusedElement) {
      if (currentComponent.name() === 'CloseButton') {
        this.refocusComponent();
      } else {
        this.pause();

        if (currentComponent && currentComponent.el()) {
          // Store last focused component
          this.lastFocusedComponent_ = currentComponent;
        }
      }
    }
  }

  /**
   * Handles the Player focus event.
   *
   * Calls for handling of the Player Focus if current element is focusable.
   */
  handlePlayerFocus_() {
    if (this.getCurrentComponent() && this.getCurrentComponent().getIsFocusable()) {
      this.resume();
    }
  }

  /**
   * Gets a set of focusable components.
   *
   * @return {Array}
   *         Returns an array of focusable components.
   */
  updateFocusableComponents() {
    const player = this.player_;
    const focusableComponents = [];

    /**
     * Searches for children candidates.
     *
     * Pushes Components to array of 'focusableComponents'.
     * Calls itself if there is children elements inside iterated component.
     *
     * @param {Array} componentsArray - The array of components to search for focusable children.
     */
    function searchForChildrenCandidates(componentsArray) {
      for (const i of componentsArray) {
        if (i.hasOwnProperty('el_') && i.getIsFocusable() && i.getIsAvailableToBeFocused(i.el())) {
          focusableComponents.push(i);
        }
        if (i.hasOwnProperty('children_') && i.children_.length > 0) {
          searchForChildrenCandidates(i.children_);
        }
      }
    }

    // Iterate inside all children components of the player.
    player.children_.forEach((value) => {
      if (value.hasOwnProperty('el_')) {
        // If component has required functions 'getIsFocusable' & 'getIsAvailableToBeFocused', is focusable & available to be focused.
        if (value.getIsFocusable && value.getIsAvailableToBeFocused && value.getIsFocusable() && value.getIsAvailableToBeFocused(value.el())) {
          focusableComponents.push(value);
          return;
          // If component has posible children components as candidates.
        } else if (value.hasOwnProperty('children_') && value.children_.length > 0) {
          searchForChildrenCandidates(value.children_);
          // If component has posible item components as candidates.
        } else if (value.hasOwnProperty('items') && value.items.length > 0) {
          searchForChildrenCandidates(value.items);
          // If there is a suitable child element within the component's DOM element.
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
    /**
     * Recursively searches for a suitable child node that can be focused within a given component.
     * It first checks if the provided node itself can be focused according to the component's
     * `getIsFocusable` and `getIsAvailableToBeFocused` methods. If not, it recursively searches
     * through the node's children to find a suitable child node that meets the focusability criteria.
     *
     * @param {HTMLElement} node - The DOM node to start the search from.
     * @return {HTMLElement|null} The first child node that is focusable and available to be focused,
     * or `null` if no suitable child is found.
     */
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

    return searchForSuitableChild(component.el());
  }

  /**
   * Gets the currently focused component from the list of focusable components.
   * If a target element is provided, it uses that element to find the corresponding
   * component. If no target is provided, it defaults to using the document's currently
   * active element.
   *
   * @param {HTMLElement} [target] - The DOM element to check against the focusable components.
   *                                 If not provided, `document.activeElement` is used.
   * @return {Component|null} - Returns the focused component if found among the focusable components,
   *                            otherwise returns null if no matching component is found.
   */
  getCurrentComponent(target) {
    this.updateFocusableComponents();
    // eslint-disable-next-line
    const curComp = target || document.activeElement;
    if (this.focusableComponents.length) {
      for (const i of this.focusableComponents) {
        // If component Node is equal to the current active element.
        if (i.el() === curComp) {
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

    if (component.hasOwnProperty('el_') && component.getIsFocusable() && component.getIsAvailableToBeFocused(component.el())) {
      focusableComponents.push(component);
    }

    this.focusableComponents = focusableComponents;
    // Trigger the notification manually
    this.trigger({type: 'focusableComponentsChanged', focusableComponents: this.focusableComponents});
  }

  /**
   * Removes component from the array of focusable components.
   *
   * @param {Component} component - The component to be removed from the focusable components array.
   */
  remove(component) {
    for (let i = 0; i < this.focusableComponents.length; i++) {
      if (this.focusableComponents[i].name() === component.name()) {
        this.focusableComponents.splice(i, 1);
        // Trigger the notification manually
        this.trigger({type: 'focusableComponentsChanged', focusableComponents: this.focusableComponents});
        return;
      }
    }
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
      this.trigger({type: 'focusableComponentsChanged', focusableComponents: this.focusableComponents});
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
      this.isInDirection_(currentPositions.boundingClientRect, component.getPositions().boundingClientRect, direction));

    const bestCandidate = this.findBestCandidate_(currentPositions.center, candidates, direction);

    if (bestCandidate) {
      this.focus(bestCandidate);
    } else {
      this.trigger({type: 'endOfFocusableComponents', direction, focusedComponent: currentFocusedComponent});
    }
  }

  /**
   * Finds the best candidate on the current center position,
   * the list of candidates, and the specified navigation direction.
   *
   * @param {Object} currentCenter The center position of the current focused component element.
   * @param {Array} candidates An array of candidate components to receive focus.
   * @param {string} direction The direction of navigation ('up', 'down', 'left', 'right').
   * @return {Object|null} The component that is the best candidate for receiving focus.
   */
  findBestCandidate_(currentCenter, candidates, direction) {
    let minDistance = Infinity;
    let bestCandidate = null;

    for (const candidate of candidates) {
      const candidateCenter = candidate.getPositions().center;
      const distance = this.calculateDistance_(currentCenter, candidateCenter, direction);

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
  isInDirection_(srcRect, targetRect, direction) {
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
   * Focus the last focused component saved before blur on player.
   */
  refocusComponent() {
    if (this.lastFocusedComponent_) {
      // If use is not active, set it to active.
      if (!this.player_.userActive()) {
        this.player_.userActive(true);
      }

      this.updateFocusableComponents();

      // Search inside array of 'focusableComponents' for a match of name of
      // the last focused component.
      for (let i = 0; i < this.focusableComponents.length; i++) {
        if (this.focusableComponents[i].name() === this.lastFocusedComponent_.name()) {
          this.focus(this.focusableComponents[i]);
          return;
        }
      }
    } else {
      this.focus(this.updateFocusableComponents()[0]);
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
    if (component.getIsAvailableToBeFocused(component.el())) {
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
  calculateDistance_(center1, center2, direction) {
    const dx = Math.abs(center1.x - center2.x);
    const dy = Math.abs(center1.y - center2.y);

    let distance;

    switch (direction) {
    case 'right':
    case 'left':
      // Higher weight for vertical distance in horizontal navigation.
      distance = dx + (dy * 100);
      break;
    case 'up':
      // Strongly prioritize vertical proximity for UP navigation.
      // Adjust the weight to ensure that elements directly above are favored.
      distance = (dy * 2) + (dx * 0.5);
      break;
    case 'down':
      // More balanced weight for vertical and horizontal distances.
      // Adjust the weights here to find the best balance.
      distance = (dy * 5) + dx;
      break;
    default:
      distance = dx + dy;
    }

    return distance;
  }

  /**
   * This gets called by 'handlePlayerBlur_' if 'spatialNavigation' is enabled.
   * Searches for the first 'TextTrackSelect' inside of modal to focus.
   *
   * @private
   */
  searchForTrackSelect_() {
    const spatialNavigation = this;

    for (const component of (spatialNavigation.updateFocusableComponents())) {
      if (component.constructor.name === 'TextTrackSelect') {
        spatialNavigation.focus(component);
        break;
      }
    }
  }
}

export default SpatialNavigation;
