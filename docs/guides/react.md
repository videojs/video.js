# video.js and ReactJS integration

Here's a basic ReactJS player implementation.

It just instantiate the video.js player on `componentDidMount` and destroy it on `componentWillUnmount`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';

import videojs from 'video.js'

// this loads video.js CSS using webpack loaders
require('!style-loader!css-loader!video.js/dist/video-js.css')

export default class VideoPlayer extends React.Component {
  componentDidMount() {
    // get the <video> DOM node
    const videoNode = ReactDOM.findDOMNode(this).querySelector('video');

    // instantiate video.js
    this.player = videojs(videoNode, this.props, function onPlayerReady() {
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
        <video className="video-js"></video>
      </div>
    )
  }
}
```

You can then use it like this :

```jsx
// see https://github.com/videojs/video.js/blob/master/docs/guides/options.md
const videoJsOptions = {
  autoPlay: true,
  controls: true,
  sources: [{
    src: '/path/to/video.mp4',
    type: 'video/mp4'
  }]
}

return <VideoPlayer { ...videoJsOptions } />
```
