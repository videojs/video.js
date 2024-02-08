/**
 * @file caption-settings-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';

/**
 * The menu item for caption track settings menu
 *
 * @extends TextTrackMenuItem
 */
class CaptionSettingsMenuItem extends TextTrackMenuItem {

  /**
   * Creates an instance of this class.
   *
   * @param { import('../../player').default } player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   */
  constructor(player, options) {
    options.track = {
      player,
      kind: options.kind,
      label: options.kind + ' settings',
      selectable: false,
      default: false,
      mode: 'disabled'
    };

    // CaptionSettingsMenuItem has no concept of 'selected'
    options.selectable = false;

    options.name = 'CaptionSettingsMenuItem';

    super(player, options);
    this.addClass('vjs-texttrack-settings');
    this.controlText(', opens ' + options.kind + ' settings dialog');
  }

  /**
   * This gets called when an `CaptionSettingsMenuItem` is "clicked". See
   * {@link ClickableComponent} for more detailed information on what a click can be.
   *
   * @param {Event} [event]
   *        The `keydown`, `tap`, or `click` event that caused this function to be
   *        called.
   *
   * @listens tap
   * @listens click
   */
  handleClick(event) {
    this.player().getChild('textTrackSettings').open();
    const spatialNavigation = this.player_.spatialNavigation;
    const isSpatialNavlistening = spatialNavigation && spatialNavigation.isListening && !spatialNavigation.isPaused;

    if (isSpatialNavlistening) {
      this.searchForTrackSelect();
    }
  }

  /**
   * This gets called by 'handleClick' if 'spatialNavigation' is enabled.
   * Searches for the first 'TextTrackSelect' inside of modal to focus.
   */
  searchForTrackSelect() {
    const spatialNavigation = this.player().spatialNavigation;
    let componentToFocus = null;

    for (const component of (spatialNavigation.getComponents())) {
      if (component.constructor.name === 'TextTrackSelect') {
        componentToFocus = component;
        break;
      }
    }

    if (componentToFocus) {
      spatialNavigation.focus(componentToFocus);
    }
  }

  /**
   * Update control text and label on languagechange
   */
  handleLanguagechange() {
    this.$('.vjs-menu-item-text').textContent = this.player_.localize(this.options_.kind + ' settings');

    super.handleLanguagechange();
  }
}

Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
export default CaptionSettingsMenuItem;
