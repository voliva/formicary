import { useEffect, useMemo, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { getMapValue } from '../internal/path';
import { combine, distinctUntilChanged, map, switchMap } from 'derive-state';

export function useIsPristine<TValues>(formRef: FormRef<TValues>): boolean {
  const isPristine$ = useMemo(
    () =>
      formRef.registeredKeys
        .pipe(
          switchMap(keys =>
            combine(
              Array.from(keys).map(key => {
                const initialValue$ = getMapValue(key, formRef.initialValues);
                const value$ = getMapValue(key, formRef.values);
                return combine({
                  initialValue: initialValue$,
                  value: value$,
                }).pipe(
                  map(({ initialValue, value }) => initialValue === value)
                );
              })
            ).pipe(map(results => results.every(pristine => pristine)))
          ),
          distinctUntilChanged()
        )
        .capture(),
    [formRef]
  );

  const [isPristine, setIsPristine] = useState<boolean>(() => {
    if (isPristine$.hasValue()) {
      return isPristine$.getValue();
    }
    return true;
  });

  useEffect(() => {
    isPristine$.subscribe(setIsPristine);
    return () => isPristine$.close();
  }, [isPristine$]);

  return isPristine;
}
