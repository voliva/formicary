import { FormRef } from '../internal/formRef';
import { KeySelector, getMapValue, getKeyValues } from '../internal/path';
import { ObservableState } from '../observables';

export const setFieldValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) => {
  const value$ = getMapValue(
    keySelector,
    formRef.values,
    () => new ObservableState()
  );
  value$.setState(value);
};

export const setFormValue = <TValues, T>(
  formRef: FormRef<TValues>,
  value: T
) => {
  Object.entries(getKeyValues(value)).forEach(([key, value]) => {
    getMapValue(key, formRef.values, () => new ObservableState()).setState(
      value
    );
  });
};
