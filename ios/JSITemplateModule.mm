#import "JSITemplateModule.h"

#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import <jsi/jsi.h>

#import "../cpp/JSITemplateHostObject.h"
#import "../cpp/Utils/JSIMacros.h"

@implementation JSITemplateModule

RCT_EXPORT_MODULE(JSITemplate)

- (NSString *)greetObjectiveC:(NSString *)name {
    return [NSString stringWithFormat:@"%@%@%@", @"Hello, ", name, @"!"];
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
    NSLog(@"Installing JSI bindings for react-native-jsi-template...");
    RCTBridge* bridge = [RCTBridge currentBridge];
    RCTCxxBridge* cxxBridge = (RCTCxxBridge*)bridge;
    if (cxxBridge == nil) {
        return @false;
    }

    using namespace facebook;

    auto jsiRuntime = (jsi::Runtime*) cxxBridge.runtime;
    if (jsiRuntime == nil) {
        return @false;
    }
    auto& runtime = *jsiRuntime;

    auto hostObject = std::make_shared<ozymandias::JSITemplateHostObject>();
    auto object = jsi::Object::createFromHostObject(runtime, hostObject);
    runtime.global().setProperty(runtime, "__JSITemplateProxy", std::move(object));
    
    auto greetObjectiveC = jsi::Function::createFromHostFunction(runtime,
                                                                 PropNameID::forUtf8(runtime,
                                                                                     "greetObjectiveC"),
                                                                 1,
                                                                 [self](jsi::Runtime &runtime,
                                                                        jsi::Value const&,
                                                                        jsi::Value const *arguments,
                                                                        size_t argc) -> jsi::Value {
        NSString *name = [NSString stringWithUTF8String:JSI_ARG_STRING(0).data()];
        NSString *greeting = [self greetObjectiveC:name];
        return jsi::Value(runtime, JSI_STRING([greeting UTF8String]));
    });
    runtime.global().setProperty(runtime, "__greetObjectiveC", std::move(greetObjectiveC));

    NSLog(@"Successfully installed JSI bindings for react-native-jsi-template!");
    return @true;
}

@end
