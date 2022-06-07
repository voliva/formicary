import { FormRef, getControlState } from "../internal/formRef";
import { Paths } from "../internal/path";

export const resetForm = <T>(formRef: FormRef<T>, keys?: Paths<T>[]): void => {
  const { values, initialValues } = formRef;

  const allKeys = keys ?? (Array.from(values.keys()) as Paths<T>[]);
  allKeys.forEach((key) => {
    if (!values.has(key) || !initialValues.has(key)) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    values.get(key)!.setValue(initialValues.get(key)!.getValue());
    const control = getControlState(formRef, key);
    const controlValue = control.getValue();
    if (controlValue.touched) {
      control.setValue({
        ...controlValue,
        touched: formRef.defaultTouched,
      });
    }
  });
};
