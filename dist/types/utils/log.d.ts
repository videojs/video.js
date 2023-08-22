export default log;
declare const log: {
    (...args: any[]): void;
    createLogger(subname: any): any;
    levels: any;
    level(lvl?: string): string;
    history: {
        (): any[];
        filter(fname: string): any[];
        clear(): void;
        disable(): void;
        enable(): void;
    };
    error(...args: any[]): any;
    warn(...args: any[]): any;
    debug(...args: any[]): any;
};
export const createLogger: (subname: any) => any;
//# sourceMappingURL=log.d.ts.map