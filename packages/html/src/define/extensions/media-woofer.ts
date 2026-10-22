import { MediaWooferExtension } from '../../extensions/media-woofer';
import { safeDefine } from '../../registration/safe-define';

export { MediaWooferExtension };

safeDefine(MediaWooferExtension);

declare global {
  interface HTMLElementTagNameMap {
    [MediaWooferExtension.tagName]: MediaWooferExtension;
  }
}
