# Video.js and ReactJS integration

Here are a couple ReactJS player implementations.

## React Functional Component and useEffect Example

```jsx
import React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

export const VideoJS = ( props ) => {

  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);
  const { options, onReady } = props;

  React.useEffect(() => {
    // make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const player = playerRef.current = videojs(videoElement, options, () => {
        console.log("player is ready");
        onReady && onReady(player);
      });
    } else {
      // you can update player here [update player through props]
      // const player = playerRef.current;
      // player.autoplay(options.autoplay);
      // player.src(options.sources);
    }
  }, [options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
}

export default VideoJS;
```

You can then use it like this: (see [options guide][options] for option information)

```jsx
import React from "react";
import VideoJS from './VideoJS' // point to where the functional component is stored

const App = () => {
  const playerRef = React.useRef(null);

  const videoJsOptions = { // lookup the options in the docs for more options
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: '/path/to/video.mp4',
      type: 'video/mp4'
    }]
  }

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    // you can handle player events here
    player.on('waiting', () => {
      console.log('player is waiting');
    });

    player.on('dispose', () => {
      console.log('player will dispose');
    });
  };

  // const changePlayerOptions = () => {
  //   // you can update the player through the Video.js player instance
  //   if (!playerRef.current) {
  //     return;
  //   }
  //   // [update player through instance's api]
  //   playerRef.current.src([{src: 'http://ex.com/video.mp4', type: 'video/mp4'}]);
  //   playerRef.current.autoplay(false);
  // };

  return (
    <>
      <div>Rest of app here</div>

      <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />

      <div>Rest of app here</div>
    </>
  );
}
```

## React Class Component Example

It just instantiates the Video.js player on `componentDidMount` and destroys it on `componentWillUnmount`.

```jsx
import React from 'react';
import videojs from 'video.js'
import video.js/dist/video-js.css

export default class VideoPlayer extends React.Component {
  componentDidMount() {
    // instantiate Video.js
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
      <div>
        <div data-vjs-player>
          <video ref={ node => this.videoNode = node } className="video-js"></video>
        </div>
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

    /* Remove React root when component is destroyed */
    this.on("dispose", () => {
      ReactDOM.unmountComponentAtNode(this.el())
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
    // instantiate Video.js
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
