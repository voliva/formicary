import { FormRef } from "../internal/formRef";
import {
  getKeyValues,
  getMapValue,
  Paths,
  ValueOfPath,
} from "../internal/path";

export const setInitialValue = <TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  key: P,
  value: ValueOfPath<TValues, P>
) => getMapValue(key, formRef.initialValues).setValue(value);

export const setFormInitialValue = <TValues, T>(
  formRef: FormRef<TValues>,
  value: T
) => {
  Object.entries(getKeyValues(value)).forEach(([key, value]) => {
    getMapValue(key, formRef.initialValues).setValue(value);
  });
};
