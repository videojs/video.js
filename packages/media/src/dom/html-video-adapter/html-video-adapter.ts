import type { WebKitDocument, WebKitPresentationMode, WebKitVideoElement } from '@videojs/utils/dom';
import { isFunction } from '@videojs/utils/predicate';

import type { Video, VideoEvents, VideoTargetLike } from '../../core/types';
import { HTMLMediaAdapter, type HTMLMediaTargetLike } from '../html-media-adapter';

export interface HTMLVideoTargetLike extends VideoTargetLike, HTMLMediaTargetLike {}

export class HTMLVideoAdapter extends HTMLMediaAdapter<HTMLVideoTargetLike, VideoEvents> implements Video {
  get poster() {
    return this.target?.poster ?? '';
  }

  set poster(value: string) {
    if (this.target) this.target.poster = value;
  }

  get playsInline() {
    return this.target?.playsInline ?? false;
  }

  set playsInline(value: boolean) {
    if (this.target) this.target.playsInline = value;
  }

  get videoWidth() {
    return this.target?.videoWidth ?? 0;
  }

  get videoHeight() {
    return this.target?.videoHeight ?? 0;
  }

  get disablePictureInPicture() {
    return this.target?.disablePictureInPicture ?? false;
  }

  set disablePictureInPicture(value: boolean) {
    if (this.target) this.target.disablePictureInPicture = value;
  }

  get webkitCurrentPlaybackTargetIsWireless() {
    return (this.target as WebKitVideoElement | null)?.webkitCurrentPlaybackTargetIsWireless;
  }

  get webkitPresentationMode() {
    return (this.target as WebKitVideoElement | null)?.webkitPresentationMode;
  }

  get webkitSetPresentationMode(): ((mode: WebKitPresentationMode) => void) | undefined {
    const target = this.target as unknown as WebKitVideoElement | null;
    const fn = target?.webkitSetPresentationMode;

    return isFunction(fn) ? fn.bind(target) : undefined;
  }

  get isPictureInPicture(): boolean {
    const el = this.target as HTMLVideoElement | null;

    return (
      (!!el && globalThis.document?.pictureInPictureElement === el) ||
      this.webkitPresentationMode === 'picture-in-picture'
    );
  }

  get isFullscreen(): boolean {
    const el = this.target as HTMLVideoElement | null;
    if (!el) return false;

    if (this.webkitPresentationMode === 'fullscreen') return true;

    const doc = globalThis.document as WebKitDocument;

    return doc?.fullscreenElement === el || doc?.webkitFullscreenElement === el;
  }

  async requestPictureInPicture() {
    if (!this.target) return Promise.reject();

    return this.target.requestPictureInPicture();
  }

  async exitPictureInPicture() {
    if (!this.target) return Promise.reject();

    return globalThis.document?.exitPictureInPicture();
  }

  requestFullscreen() {
    if (!this.target) return Promise.reject();

    return this.target.requestFullscreen();
  }

  exitFullscreen() {
    if (!this.target) return Promise.reject();

    return globalThis.document?.exitFullscreen();
  }
}
