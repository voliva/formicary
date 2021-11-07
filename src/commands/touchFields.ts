import { FormRef, getControlState } from "../internal/formRef";
import { Paths } from "../internal/path";

export const touchFields = <TValues>(
  formRef: FormRef<TValues>,
  keys?: Paths<TValues>[],
  touch = true
) => {
  const allKeys = keys ?? formRef.registeredKeys.getValue();
  allKeys.forEach((key) => {
    const control$ = getControlState(formRef, key);
    const controlValue = control$.getValue();
    if (controlValue.touched !== touch) {
      control$.setValue({
        ...controlValue,
        touched: touch,
      });
    }
  });
};
