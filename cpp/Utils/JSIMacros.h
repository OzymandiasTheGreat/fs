#ifndef JSIMACROS_H
#define JSIMACROS_H

#include <jsi/jsi.h>

using namespace facebook::jsi;

#define JSI_ARG_FUNCTION(index) arguments[index].asObject(runtime).asFunction(runtime)
#define JSI_ARG_INT(index) static_cast<int> arguments[index].asNumber()
#define JSI_ARG_UINT32(index) static_cast<uint32_t> arguments[index].asNumber()
#define JSI_ARG_STRING(index) arguments[index].asString(runtime).utf8(runtime)
#define JSI_ARG_OBJECT(index) arguments[index].asObject(runtime)

#define JSI_NUMBER(value) Value(static_cast<double> value)
#define JSI_STRING(value) String::createFromUtf8(runtime, value)
#define JSI_BOOL(value) Value(value)

#define JSI_THROW(message) throw JSError(runtime, message)

#define JSI_FUNCTION(name, count, code) \
Function::createFromHostFunction(runtime, PropNameID::forUtf8(runtime, name), count, [](Runtime &runtime, Value const&, Value const *arguments, size_t argc) -> Value \
  code \
)\

#define JSI_HOSTOBJECT_METHOD(name, count, code) \
  if (propName == name) {\
    return JSI_FUNCTION(name, count, code);\
  }
#define JSI_HOSTOBJECT_STRING(name, value) \
  if (propName == name) {\
    return JSI_STRING(value);\
  }
#define JSI_HOSTOBJECT_NUMBER(name, value) \
  if (propName == name) {\
    return JSI_NUMBER(value);\
  }

#endif // JSIMACROS_H
