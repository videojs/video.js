import { safeDefine } from '../../registration/safe-define';
import { FCastButtonElement } from '../../ui/fcast-button/element';

safeDefine(FCastButtonElement);

declare global {
  interface HTMLElementTagNameMap {
    [FCastButtonElement.tagName]: FCastButtonElement;
  }
}
