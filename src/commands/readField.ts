import { FormRef } from '../internal/formRef';
import { getMapValue, KeySelector } from '../internal/path';

export const readField = <T, V>(
  formRef: FormRef<T>,
  key: KeySelector<T, V>
): V | undefined => {
  try {
    return getMapValue(key, formRef.values).getValue();
  } catch (ex) {
    return undefined;
  }
};
