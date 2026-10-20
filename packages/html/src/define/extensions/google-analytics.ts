import { GoogleAnalyticsExtension } from '../../extensions/google-analytics';
import { safeDefine } from '../../registration/safe-define';

export { GoogleAnalyticsExtension };

safeDefine(GoogleAnalyticsExtension);

declare global {
  interface HTMLElementTagNameMap {
    [GoogleAnalyticsExtension.tagName]: GoogleAnalyticsExtension;
  }
}
