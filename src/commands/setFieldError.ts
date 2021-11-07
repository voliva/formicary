import { ErrorResult, FormRef, getControlState } from "../internal/formRef";
import { Paths } from "../internal/path";

export const setFieldError = <TValues>(
  formRef: FormRef<TValues>,
  key: Paths<TValues>,
  error: ErrorResult
) => {
  try {
    getControlState(formRef, key).getValue().manualError.emit(error);
  } catch (ex) {
    console.warn("Can't set error: Field not registered", ex);
  }
};
