import { FormRef } from '../internal/formRef';
import { getKeyValues, getMapValue, KeySelector } from '../internal/path';

export const setFieldValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) => {
  const value$ = getMapValue(keySelector, formRef.values);
  value$.setValue(value);
};

export const setFormValue = <TValues, T>(
  formRef: FormRef<TValues>,
  value: T
) => {
  Object.entries(getKeyValues(value)).forEach(([key, value]) => {
    getMapValue(key, formRef.values).setValue(value);
  });
};
