import { FormRef } from './internal/formRef';
import { getKeys, KeysSelector } from './path';

export const resetForm = <T>(
  formRef: FormRef<T>,
  keysSelector?: KeysSelector<T>
): void => {
  if (!keysSelector) {
    return formRef.reset();
  }
  const keys = getKeys(keysSelector);
  keys.forEach(key => formRef.reset(key));
};
