import { FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';

export const resetForm = <T>(
  formRef: FormRef<T>,
  keysSelector?: KeysSelector<T>
): void => {
  const { values, initialValues } = formRef;

  const keys = keysSelector ? getKeys(keysSelector) : Array.from(values.keys());
  keys.forEach(key => {
    if (!values.has(key) || !initialValues.has(key)) {
      return;
    }
    values.get(key)!.setValue(initialValues.get(key)!.getValue());
    const control = getControlState(formRef, key);
    const controlValue = control.getValue();
    if (controlValue.touched) {
      control.setValue({
        ...controlValue,
        touched: false,
      });
    }
  });
};
