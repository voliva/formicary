import { useEffect, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { KeySelector, getMapValue } from '../internal/path';
import { ObservableState } from '../observables';

export function useWatch<TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>
): T | undefined {
  const value$ = getMapValue(
    keySelector,
    formRef.values,
    () => new ObservableState()
  );
  const [value, setValue] = useState<T | undefined>(() => {
    if (value$.hasValue()) {
      return value$.getState();
    }
    return undefined;
  });

  useEffect(() => value$.subscribe(setValue), [value$]);

  return value;
}
