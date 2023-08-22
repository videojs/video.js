/**
 * Mimetypes
 */
export type MimetypesKind = any;
export namespace MimetypesKind {
    const opus: string;
    const ogv: string;
    const mp4: string;
    const mov: string;
    const m4v: string;
    const mkv: string;
    const m4a: string;
    const mp3: string;
    const aac: string;
    const caf: string;
    const flac: string;
    const oga: string;
    const wav: string;
    const m3u8: string;
    const mpd: string;
    const jpg: string;
    const jpeg: string;
    const gif: string;
    const png: string;
    const svg: string;
    const webp: string;
}
export function getMimetype(src?: string): string;
export function findMimetype(player: import('../player').default, src: string): string;
/**
 * ~Kind
 */
export type Mimetypes = any;
//# sourceMappingURL=mimetypes.d.ts.map