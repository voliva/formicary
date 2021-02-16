import { useEffect, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { getMapValue, KeySelector } from '../internal/path';

export function useWatch<TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>
): T | undefined {
  const value$ = getMapValue(keySelector, formRef.values);
  const [value, setValue] = useState<T | undefined>(() => {
    if (value$.hasValue()) {
      return value$.getValue();
    }
    return undefined;
  });

  useEffect(() => value$.subscribe(setValue), [value$]);

  return value;
}
