# video.js and ReactJS integration

Here's a basic ReactJS player implementation.

It just instantiates the video.js player on `componentDidMount` and destroys it on `componentWillUnmount`.

```jsx
import React from 'react';
import videojs from 'video.js'

export default class VideoPlayer extends React.Component {
  componentDidMount() {
    // instantiate video.js
    this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
      console.log('onPlayerReady', this)
    });
  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      this.player.dispose()
    }
  }

  // wrap the player in a div with a `data-vjs-player` attribute
  // so videojs won't create additional wrapper in the DOM
  // see https://github.com/videojs/video.js/pull/3856
  render() {
    return (
      <div data-vjs-player>
        <video ref={ node => this.videoNode = node } className="video-js"></video>
      </div>
    )
  }
}
```

You can then use it like this: (see [options guide][options] for option information)

```jsx
const videoJsOptions = {
  autoplay: true,
  controls: true,
  sources: [{
    src: '/path/to/video.mp4',
    type: 'video/mp4'
  }]
}

return <VideoPlayer { ...videoJsOptions } />
```

Dont forget to include the video.js CSS, located at `video.js/dist/video-js.css`.

[options]: /docs/guides/options.md


## Using a React Component as a Video JS Component

```jsx
/**
 * EpisodeList.js
 *
 * This is just a plain ol' React component.
 * the vjsComponent methods, player methods etc. are available via
 * the vjsComponent prop (`this.props.vjsComponent`)
 */
import React, { Component, PropTypes } from 'react';

class EpisodeList extends Component {
  render() {
    return (
      <div>
        <h1>{this.props.body}</h1>
      </div>
    );
  }
}


/**
 * vjsEpisodeList.js
 *
 * Here is where we register a Video JS Component and
 * mount the React component to it when the player is ready.
 */
import EpisodeList from './EpisodeList';
import ReactDOM from 'react-dom';
import videojs from 'video.js';

const vjsComponent = videojs.getComponent('Component');

class vjsEpisodeList extends vjsComponent {

  constructor(player, options) {
    super(player, options);

    /* Bind the current class context to the mount method */
    this.mount = this.mount.bind(this);

    /* When player is ready, call method to mount React component */
    player.ready(() => {
      this.mount();
    });
  }

  /**
   * We will render out the React EpisodeList component into the DOM element
   * generated automatically by the VideoJS createEl() method.
   *
   * We fetch that generated element using `this.el()`, a method provided by the
   * vjsComponent class that this class is extending.
   */
  mount() {
    ReactDOM.render(<EpisodeList vjsComponent={this} body="Episodes" />, this.el() );
  }
}

/**
 * Make sure to register the vjsComponent so Video JS knows it exists
 */
vjsComponent.registerComponent('vjsEpisodeList', vjsEpisodeList);

export default vjsEpisodeList;


/**
 * VideoPlayer.js
 * Check the above example for how to integrate the rest of this class.
 */

// ...
  componentDidMount() {
    // instantiate video.js
    this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
      console.log('onPlayerReady', this)
    });

    /**
     * Fetch the controlBar component and add the new vjsEpisodeList component as a child
     * You can pass options here if desired in the second object.
     */
    this.player.getChild('controlBar').addChild('vjsEpisodeList', {});
  }
// ...
```
