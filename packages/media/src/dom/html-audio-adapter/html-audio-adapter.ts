import type { Audio, AudioEvents } from '../../core/types';
import { HTMLMediaAdapter, type HTMLMediaTargetLike } from '../html-media-adapter';

/** @internal */
export class HTMLAudioAdapter extends HTMLMediaAdapter<HTMLMediaTargetLike, AudioEvents> implements Audio {}
