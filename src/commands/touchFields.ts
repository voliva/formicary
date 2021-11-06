import { FormRef, getControlState } from "../internal/formRef";
import { getKeys, KeysSelector } from "../internal/path";

export const touchFields = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>,
  touch = true
) => {
  const keys = keysSelector
    ? getKeys(keysSelector)
    : formRef.registeredKeys.getValue();
  keys.forEach((key: string) => {
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
