export { getFieldChanges } from "./commands/getFieldChanges";
export { readField } from "./commands/readField";
export { readForm } from "./commands/readForm";
export { resetForm } from "./commands/resetForm";
export { setFieldValue, setFormValue } from "./commands/setFieldValue";
export {
  setInitialValue,
  setFormInitialValue,
} from "./commands/setInitialValue";
export { touchFields } from "./commands/touchFields";
export { setFieldError } from "./commands/setFieldError";
export * from "./hooks";
export * from "./validators";
export * from "./context";

export { FormRef } from "./internal/formRef";
export { FormRef as FakeFormRef } from "./fakeFormRef";
export { subfield } from "./internal/subfield";
export { Paths, ValueOfPath, createKeyFn } from "./internal/path";

/* TODO
- Remove/cleanup unused fields (need refcount?)
- getErrors command
  => Investigate scroll into view after touch fields
- Array fields
- Better control of touched
  * show error if a dependency causes that field to go on error, even when left untouched
- Global validations
- On submit validations
- Custom typings for FormRef (as an opaque token)
*/
