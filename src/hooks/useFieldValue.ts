import { useEffect, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { getMapValue, KeySelector } from '../internal/path';
import { useHookParams } from '../internal/useHookParams';

export function useFieldValue<TValues, T>(
  keySelector: KeySelector<TValues, T>
): T | undefined;
export function useFieldValue<TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>
): T | undefined;
export function useFieldValue<TValues, T>(...args: any[]): T | undefined {
  const [formRef, keySelector] = useHookParams<
    TValues,
    [KeySelector<TValues, T>]
  >(args);

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
