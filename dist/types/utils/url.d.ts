export function parseUrl(url: string): url;
export function getAbsoluteURL(url: string): string;
export function getFileExtension(path: string): string;
export function isCrossOrigin(url: string, winLoc?: {
    protocol?: string;
    host?: string;
}): boolean;
/**
 * :URLObject
 */
export type url = {
    /**
     *           The protocol of the url that was parsed.
     */
    protocol: string;
    /**
     *           The hostname of the url that was parsed.
     */
    hostname: string;
    /**
     *           The port of the url that was parsed.
     */
    port: string;
    /**
     *           The pathname of the url that was parsed.
     */
    pathname: string;
    /**
     *           The search query of the url that was parsed.
     */
    search: string;
    /**
     *           The hash of the url that was parsed.
     */
    hash: string;
    /**
     *           The host of the url that was parsed.
     */
    host: string;
};
//# sourceMappingURL=url.d.ts.map