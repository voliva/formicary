import { FormRef } from '../internal/formRef';
import { getMapValue, KeySelector } from '../internal/path';
import { ObservableState } from '../observables';

export const readField = <T, V>(
  formRef: FormRef<T>,
  key: KeySelector<T, V>
): V | undefined => {
  try {
    return getMapValue(
      key,
      formRef.values,
      () => new ObservableState()
    ).getState();
  } catch (ex) {
    return undefined;
  }
};
