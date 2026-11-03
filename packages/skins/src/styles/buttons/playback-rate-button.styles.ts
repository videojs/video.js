import { styles } from 'vjsc/styles';

export default styles({
  file: 'buttons.css',
  prefix: 'media-playback-rate-button',
  rules: {
    root: {
      // `text-fit: shrink` scales the label down only when it would overflow,
      // so "1×" keeps the control's text size while "1.75×" fits the round
      // button. Where it isn't supported, the button's published rate length
      // gives the same result: full size up to four characters ("1.5×"), then
      // smaller. The button never changes size.
      utilities: [
        'tabular-nums not-supports-[text-fit:shrink]:text-[length:min(1em,calc(4em/(var(--media-playback-rate-length,3)_+_1)))]',
        "after:content-[attr(data-rate)_'×'] after:w-[80%] after:min-w-0 after:whitespace-nowrap after:text-center after:[text-fit:shrink]",
      ],
    },
  },
});
