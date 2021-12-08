import { FormRef } from "../internal/formRef";
import {
  getKeyValues,
  getMapValue,
  Paths,
  ValueOfPath,
} from "../internal/path";

export const setFieldValue = <TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  key: P,
  // TODO not getting exported correctly
  value?: ValueOfPath<TValues, P> | undefined | null
) => {
  getMapValue(key, formRef.values).setValue(value);
};

export const setFormValue = <TValues, T>(
  formRef: FormRef<TValues>,
  value: T
) => {
  Object.entries(getKeyValues(value)).forEach(([key, value]) => {
    getMapValue(key, formRef.values).setValue(value);
  });
};
