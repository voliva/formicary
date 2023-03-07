export { getFieldChanges } from "./commands/getFieldChanges";
export { getFieldValue } from "./commands/getFieldValue";
export { getFormErrors } from "./commands/getFormErrors";
export { getFormValue } from "./commands/getFormValue";
export { resetForm } from "./commands/resetForm";
export { setFieldValue, setFormValue } from "./commands/setFieldValue";
export {
  setInitialValue,
  setFormInitialValue,
} from "./commands/setInitialValue";
export {
  getInitialValue,
  getFormInitialValue,
} from "./commands/getInitialValue";
export { touchFields } from "./commands/touchFields";
export { setFieldError } from "./commands/setFieldError";
export { unregisterControl } from "./commands/unregisterControl";
export * from "./hooks";
export * from "./validators";
export * from "./context";

export { FormRef } from "./internal/formRef";
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
