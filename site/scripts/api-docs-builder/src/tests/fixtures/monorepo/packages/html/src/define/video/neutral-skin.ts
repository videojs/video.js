/**
 * Mock HTML neutral video skin element.
 *
 * Exercises: multiple skins per preset, skin detection via SkinElement inheritance.
 */
import { SkinElement } from '../../presets/skin';

export class NeutralVideoSkinElement extends SkinElement {
  static readonly tagName = 'video-neutral-skin';
}
