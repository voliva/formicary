import { useEffect, useMemo, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { getMapValue } from '../internal/path';
import {
  combine,
  distinctUntilChanged,
  map,
  pipe,
  switchMap,
} from 'derive-state';

export function useIsPristine<TValues>(formRef: FormRef<TValues>): boolean {
  const isPristine$ = useMemo(
    () =>
      pipe(
        formRef.registeredKeys,
        switchMap(keys =>
          pipe(
            combine(
              Array.from(keys).map(key => {
                const initialValue$ = getMapValue(key, formRef.initialValues);
                const value$ = getMapValue(key, formRef.values);
                return pipe(
                  combine({ initialValue: initialValue$, value: value$ }),
                  map(({ initialValue, value }) => initialValue === value)
                );
              })
            ),
            map(results => results.every(pristine => pristine))
          )
        ),
        distinctUntilChanged()
      ),
    [formRef]
  );

  const [isPristine, setIsPristine] = useState<boolean>(() => {
    if (isPristine$.hasValue()) {
      return isPristine$.getValue();
    }
    return true;
  });

  useEffect(() => isPristine$.subscribe(setIsPristine), [isPristine$]);

  return isPristine;
}
