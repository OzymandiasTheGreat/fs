declare type FS = {
    greeting: "Hello, World!";
    greet: (name?: string) => string;
    greetAsync: (name: string | undefined, callback: (err: Error | null, greeting: string) => void) => void;
    read: (path: string) => Uint8Array;
};
declare global {
    function nativeCallSyncHook(): unknown;
    var __FSProxy: FS | undefined;
    var __greetJava: ((name: string) => string) | undefined;
    var __greetObjectiveC: ((name: string) => string) | undefined;
}
export declare const FS: FS;
export declare const greetJava: ((name: string) => string) | undefined;
export declare const greetObjectiveC: ((name: string) => string) | undefined;
export {};
