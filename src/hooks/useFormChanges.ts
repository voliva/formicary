import {
  combine,
  distinctUntilChanged,
  map,
  switchMap,
  withDefault,
} from 'derive-state';
import { useEffect, useMemo, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { buildObject } from '../internal/path';

export const useFormChanges = <T, R>(
  formRef: FormRef<T>,
  mapFn: (value: T) => R,
  eqFn?: (a: R, b: R) => boolean
): R => {
  const valueStream = useMemo(
    () =>
      formRef.registeredKeys
        .pipe(
          map(set => Array.from(set)),
          switchMap(keys =>
            combine(
              Object.fromEntries(
                keys.map(key => [
                  key,
                  formRef.values
                    .get(key)!
                    .pipe(withDefault(undefined), distinctUntilChanged()),
                ])
              )
            )
          ),
          map(formValues => mapFn(buildObject(formValues))),
          distinctUntilChanged(eqFn)
        )
        .capture(),
    [formRef]
  );

  const [state, setState] = useState(() =>
    valueStream.hasValue() ? valueStream.getValue() : ({} as any)
  );

  useEffect(() => {
    valueStream.subscribe(setState);
    return () => valueStream.close();
  }, [valueStream]);

  return state;
};
