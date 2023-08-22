export default MediaLoader;
/**
 * The `MediaLoader` is the `Component` that decides which playback technology to load
 * when a player is initialized.
 *
 * @extends Component
 */
declare class MediaLoader extends Component {
    /**
     * Create an instance of this class.
     *
     * @param { import('../player').default } player
     *        The `Player` that this class should attach to.
     *
     * @param {Object} [options]
     *        The key/value store of player options.
     *
     * @param {Function} [ready]
     *        The function that is run when this component is ready.
     */
    constructor(player: import('../player').default, options?: any, ready?: Function);
}
import Component from "../component.js";
//# sourceMappingURL=loader.d.ts.map