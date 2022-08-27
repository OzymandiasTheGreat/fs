package me.screamingvoid.fs;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = FSModule.NAME)
public class FSModule extends ReactContextBaseJavaModule {
  public static final String NAME = "FS";

  public FSModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    try {
      Log.i(NAME, "Loading C++ library...");
      System.loadLibrary("fs");

      JavaScriptContextHolder jsContext = getReactApplicationContext().getJavaScriptContextHolder();

      Log.i(NAME, "Installing JSI Bindings for screamingvoid__fs...");
      nativeInstall(jsContext.get(), this);
      Log.i(NAME, "Successfully installed JSI Bindings for screamingvoid__fs!");

      return true;
    } catch (Exception exception) {
      Log.e(NAME, "Failed to install JSI Bindings for screamingvoid__fs!", exception);
      return false;
    }
  }

  private static native void nativeInstall(long jsiPtr, Object thiz);

  public String greetJava(String name) {
    return "Hello, " + name + "!";
  }
}
