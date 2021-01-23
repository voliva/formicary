import { FormRef } from '../internal/formRef';
import { getMapValue, KeySelector } from '../internal/path';

export const setInitialValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) => getMapValue(keySelector, formRef.initialValues).setValue(value);
