# Video.js and Vue integration

Here's a basic Vue player implementation.

It just instantiates the Video.js player on `mounted` and destroys it on `beforeDestroy`.

```vue
<template>
    <div>
        <video ref="videoPlayer" class="video-js"></video>
    </div>
</template>

<script>
import videojs from 'video.js';

export default {
    name: "VideoPlayer",
    props: {
        options: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            player: null
        }
    },
    mounted() {
        this.player = videojs(this.$refs.videoPlayer, this.options, function onPlayerReady() {
            console.log('onPlayerReady', this);
        })
    },
    beforeDestroy() {
        if (this.player) {
            this.player.dispose()
        }
    }
}
</script>
```

You can then use it like this: (see [options guide][options] for option information)

```vue
<template>
  <div>
		<video-player :options="videoOptions"/>
	</div>
</template>

<script>
import VideoPlayer from "@/components/VideoPlayer.vue";

export default {
	name: "VideoExample",
	components: {
		VideoPlayer
	},
	data() {
		return {
			videoOptions: {
				autoplay: true,
				controls: true,
				sources: [
					{
						src:
							"/path/to/video.mp4",
						  type: "video/mp4"
					}
				]
			}
		};
	}
};
```

Don't forget to include the Video.js CSS, located at `video.js/dist/video-js.css`.

[options]: /docs/guides/options.md
