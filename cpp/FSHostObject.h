#ifndef FSHOSTOBJECT_H
#define FSHOSTOBJECT_H

#include <jsi/jsi.h>

namespace screamingvoid {

using namespace facebook;

class JSI_EXPORT FSHostObject: public jsi::HostObject {
public:
  explicit FSHostObject() {}

public:
  jsi::Value get(jsi::Runtime&, const jsi::PropNameID& name) override;
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& rt) override;
};

} // namespace screamingvoid

#endif /* FSHOSTOBJECT_H */
