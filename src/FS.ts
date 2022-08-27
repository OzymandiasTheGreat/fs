import { NativeModules, Platform } from 'react-native';

type FS = {
  greeting: "Hello, World!";
  greet: (name?: string) => string;
  greetAsync: (name: string | undefined, callback: (err: Error | null, greeting: string) => void) => void;
  read: (path: string) => Uint8Array;
};

// global func declaration for JSI functions
declare global {
  function nativeCallSyncHook(): unknown;
  var __FSProxy: FS | undefined;
  var __greetJava: ((name: string) => string) | undefined;
  var __greetObjectiveC: ((name: string) => string) | undefined;
}

// Check if the constructor exists. If not, try installing the JSI bindings.
if (global.__FSProxy == null) {
  // Get the native FS ReactModule
  const FSModule = NativeModules.FS;
  if (FSModule == null) {
    let message =
      'Failed to install screamingvoid__fs: The native `FS` Module could not be found.';
    message +=
      '\n* Make sure screamingvoid__fs is correctly autolinked (run `npx react-native config` to verify)';
    if (Platform.OS === 'ios' || Platform.OS === 'macos') {
      message += '\n* Make sure you ran `pod install` in the ios/ directory.';
    }
    if (Platform.OS === 'android') {
      message += '\n* Make sure gradle is synced.';
    }
    // check if Expo
    const ExpoConstants =
      NativeModules.NativeUnimoduleProxy?.modulesConstants?.ExponentConstants;
    if (ExpoConstants != null) {
      if (ExpoConstants.appOwnership === 'expo') {
        // We're running Expo Go
        throw new Error(
          'screamingvoid__fs is not supported in Expo Go! Use EAS (`expo prebuild`) or eject to a bare workflow instead.'
        );
      } else {
        // We're running Expo bare / standalone
        message += '\n* Make sure you ran `expo prebuild`.';
      }
    }

    message += '\n* Make sure you rebuilt the app.';
    throw new Error(message);
  }

  // Check if we are running on-device (JSI)
  if (global.nativeCallSyncHook == null || FSModule.install == null) {
    throw new Error(
      'Failed to install screamingvoid__fs: React Native is not running on-device. FS can only be used when synchronous method invocations (JSI) are possible. If you are using a remote debugger (e.g. Chrome), switch to an on-device debugger (e.g. Flipper) instead.'
    );
  }

  // Call the synchronous blocking install() function
  const result = FSModule.install();
  if (result !== true)
    throw new Error(
      `Failed to install screamingvoid__fs: The native FS Module could not be installed! Looks like something went wrong when installing JSI bindings: ${result}`
    );

  // Check again if the constructor now exists. If not, throw an error.
  if (global.__FSProxy == null)
    throw new Error(
      'Failed to install screamingvoid__fs, the native initializer function does not exist. Are you trying to use FS from different JS Runtimes?'
    );
}

export const FS = global.__FSProxy;
export const greetJava = global.__greetJava;
export const greetObjectiveC = global.__greetObjectiveC;
