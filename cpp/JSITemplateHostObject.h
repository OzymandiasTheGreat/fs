#ifndef JSITEMPLATEHOSTOBJECT_H
#define JSITEMPLATEHOSTOBJECT_H

#include <jsi/jsi.h>

namespace ozymandias {

using namespace facebook;

class JSI_EXPORT JSITemplateHostObject: public jsi::HostObject {
public:
  explicit JSITemplateHostObject() {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
};

} // namespace ozymandias

#endif /* JSITEMPLATEHOSTOBJECT_H */
