import { useEffect, useMemo, useState } from 'react';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { FormRef } from '../internal/formRef';
import { navigateDeepSubject } from '../internal/path';

export function useIsPristine<TValues>(formRef: FormRef<TValues>): boolean {
  const [isPristine, setIsPristine] = useState<boolean>(true);

  const isPristine$ = useMemo(
    () =>
      formRef.registeredKeys.pipe(
        switchMap(keys =>
          combineLatest(
            Array.from(keys).map(key => {
              const initialValue$ = navigateDeepSubject(
                key,
                formRef.initialValues$
              );
              const value$ = navigateDeepSubject(key, formRef.values$);
              return combineLatest([initialValue$, value$]).pipe(
                map(([initialValue, value]) => initialValue === value)
              );
            })
          ).pipe(map(results => results.every(pristine => pristine)))
        ),
        distinctUntilChanged()
      ),
    [formRef]
  );

  useEffect(() => {
    const sub = isPristine$.subscribe(setIsPristine);
    return () => sub.unsubscribe();
  }, [isPristine$]);

  return isPristine;
}
