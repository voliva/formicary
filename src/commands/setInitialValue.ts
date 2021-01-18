import { FormRef } from '../internal/formRef';
import { KeySelector, getMapValue } from '../internal/path';
import { ObservableState } from '../observables';

export const setInitialValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) =>
  getMapValue(
    keySelector,
    formRef.initialValues,
    () => new ObservableState()
  ).setState(value);
