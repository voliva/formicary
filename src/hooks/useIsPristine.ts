import { useEffect, useMemo, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { getMapValue } from '../internal/path';
import {
  combine,
  distinctUntilChanged,
  map,
  ObservableState,
  pipe,
  switchMap,
} from '../observables';

export function useIsPristine<TValues>(formRef: FormRef<TValues>): boolean {
  const isPristine$ = useMemo(
    () =>
      pipe(
        formRef.registeredKeys,
        switchMap(keys =>
          pipe(
            combine(
              Array.from(keys).map(key => {
                const initialValue$ = getMapValue(
                  key,
                  formRef.initialValues,
                  () => new ObservableState()
                );
                const value$ = getMapValue(
                  key,
                  formRef.values,
                  () => new ObservableState()
                );
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
      return isPristine$.getState();
    }
    return true;
  });

  useEffect(() => isPristine$.subscribe(setIsPristine), [isPristine$]);

  return isPristine;
}
