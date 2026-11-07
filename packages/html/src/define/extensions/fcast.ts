import { FCastExtension } from '../../extensions/fcast';
import { safeDefine } from '../../registration/safe-define';

export { FCastExtension };

safeDefine(FCastExtension);

declare global {
  interface HTMLElementTagNameMap {
    [FCastExtension.tagName]: FCastExtension;
  }
}
