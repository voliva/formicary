import { FormRef } from './internal/formRef';
import { getKey, KeySelector } from './path';

export const setFieldValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) => formRef.getControl(getKey(keySelector)).setValue(value);
