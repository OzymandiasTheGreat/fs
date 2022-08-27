#include "FSHostObject.h"
#include "Utils/Uint8Array.h"
#include "Utils/JSIMacros.h"
#include <jsi/jsi.h>
#include <thread>
#include <boost/iostreams/device/file_descriptor.hpp>

namespace screamingvoid {

using namespace std;
using namespace facebook::jsi;

vector<PropNameID> FSHostObject::getPropertyNames(Runtime& runtime) {
	vector<PropNameID> result;

	result.push_back(PropNameID::forUtf8(runtime, "greeting"));
	result.push_back(PropNameID::forUtf8(runtime, "greet"));
	result.push_back(PropNameID::forUtf8(runtime, "greetAsync"));
  result.push_back(PropNameID::forUtf8(runtime, "read"));

	return result;
}

Value FSHostObject::get(Runtime& runtime, const PropNameID& propNameId) {
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
  JSI_HOSTOBJECT_METHOD("read", 1, {
    auto path = JSI_ARG_STRING(0);
    boost::iostreams::file_descriptor_source fd(path, ios_base::in);
    auto len = fd.seek(0, ios::seekdir::end);
    auto buf = Uint8Array(runtime, (size_t) len);
    fd.seek(0, ios::seekdir::beg);
    fd.read((char *) buf.toArray(runtime), len);
    return Value(runtime, buf);
  });

	return Value::undefined();
}

} // namespace screamingvoid
