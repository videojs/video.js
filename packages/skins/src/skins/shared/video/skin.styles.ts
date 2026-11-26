import { styles } from 'vjsc/styles';

import { childEmbedFill, slottedEmbedFill } from '../../../styles/layout/container.styles';

export default styles({
  file: 'video/skin.css',
  prefix: 'video-skin',
  rules: {
    root: {
      // The skin root shares the container's scope root, so its rules must also match `:scope`.
      scopeRoot: true,
      utilities: ['pointer-fine:not-data-controls-visible:cursor-none', ...childEmbedFill],
      variants: {
        'shadow-dom': slottedEmbedFill,
      },
    },
  },
});
