import { styles } from 'vjsc/styles';

const errorDialogOpen = 'has-[[role=alertdialog][data-open]]';
const errorDialogShown = 'has-[[role=alertdialog][data-open]:not([data-ending-style])]';
// Only the controls surface carries both attributes.
const controls = '[&_[data-interactive][data-visible]]';

export default styles({
  file: 'audio/skin.css',
  prefix: 'audio-skin',
  rules: {
    root: {
      scopeRoot: true,
      utilities: [
        'h-auto! overflow-visible! bg-transparent! after:hidden',
        // Visible media is an embed iframe in React and an element with `controls` in light DOM HTML.
        `${errorDialogOpen}:[&>:is(iframe,[controls])]:overflow-clip ${errorDialogOpen}:[&>:is(iframe,[controls])]:rounded-media-player`,
        // Under the error dialog the bar fades out only after a bar-sized dialog has faded in over it.
        `${controls}:transition-[opacity,visibility] ${controls}:duration-0`,
        `${errorDialogShown}:${controls}:invisible ${errorDialogShown}:${controls}:opacity-0`,
        `${errorDialogShown}:${controls}:delay-[var(--media-duration-slower)] ${errorDialogShown}:${controls}:duration-media-fast`,
      ],
      variants: {
        'shadow-dom': [
          `${errorDialogOpen}:[&>slot::slotted(*)]:overflow-clip`,
          `${errorDialogOpen}:[&>slot::slotted(*)]:rounded-media-player`,
        ],
      },
    },
  },
});
