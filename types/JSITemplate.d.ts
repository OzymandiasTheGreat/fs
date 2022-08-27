declare type JSITemplate = {
    greeting: "Hello, World!";
    greet: (name?: string) => string;
    greetAsync: (name: string | undefined, callback: (err: Error | null, greeting: string) => void) => void;
};
declare global {
    function nativeCallSyncHook(): unknown;
    var __JSITemplateProxy: JSITemplate | undefined;
    var __greetJava: ((name: string) => string) | undefined;
    var __greetObjectiveC: ((name: string) => string) | undefined;
}
export declare const JSITemplate: JSITemplate;
export declare const greetJava: ((name: string) => string) | undefined;
export declare const greetObjectiveC: ((name: string) => string) | undefined;
export {};
