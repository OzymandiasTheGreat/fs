#include "JSITemplateHostObject.h"
#include "Utils/JSIMacros.h"
#include <jsi/jsi.h>
#include <thread>

namespace ozymandias {

using namespace std;
using namespace facebook::jsi;

// TODO: Create macros for this so we don't have to repeat ourselves for each JSI func?

vector<PropNameID> JSITemplateHostObject::getPropertyNames(Runtime& runtime) {
	vector<PropNameID> result;

	result.push_back(PropNameID::forUtf8(runtime, "greeting"));
	result.push_back(PropNameID::forUtf8(runtime, "greet"));
	result.push_back(PropNameID::forUtf8(runtime, "greetAsync"));

	return result;
}

Value JSITemplateHostObject::get(Runtime& runtime, const PropNameID& propNameId) {
	auto propName = propNameId.utf8(runtime);

  JSI_HOSTOBJECT_STRING("greeting", "Hello, World!");
  JSI_HOSTOBJECT_METHOD("greet", 1, {
    string name;
    if (arguments[0].isString()) {
      name = arguments[0].asString(runtime).utf8(runtime);
    } else {
      name = "World";
    }
    return Value(runtime, String::createFromUtf8(runtime, "Hello, " + name + "!"));
  });
  JSI_HOSTOBJECT_METHOD("greetAsync", 2, {
    if (!arguments[1].isObject() && !arguments[1].asObject(runtime).isFunction(runtime)) {
      throw runtime_error("Callback must be a function");
    }
    auto callback = make_shared<Function>(arguments[1].asObject(runtime).asFunction(runtime));
    string name;
    if (arguments[0].isString()) {
      name = arguments[0].asString(runtime).utf8(runtime);
    } else {
      name = "World";
    }
    auto runner = [&runtime](const string &name, const shared_ptr<Function> &callback) {
      callback->call(runtime, Value::null(), Value(runtime, String::createFromUtf8(runtime, "Hello, " + name + "!")));
    };
    thread executor(runner, name, callback);
    executor.detach();

    return Value::undefined();
  });

	return Value::undefined();
}

} // namespace ozymandias
