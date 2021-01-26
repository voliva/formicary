import {
  combine,
  distinctUntilChanged,
  map,
  pipe,
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
      pipe(
        formRef.registeredKeys,
        map(set => Array.from(set)),
        switchMap(keys =>
          combine(
            Object.fromEntries(
              keys.map(key => [
                key,
                pipe(
                  formRef.values.get(key)!,
                  withDefault(undefined),
                  distinctUntilChanged()
                ),
              ])
            )
          )
        ),
        map(formValues => mapFn(buildObject(formValues))),
        distinctUntilChanged(eqFn)
      ),
    [formRef]
  );
  const [state, setState] = useState(() =>
    valueStream.hasValue() ? valueStream.getValue() : ({} as any)
  );

  useEffect(() => valueStream.subscribe(setState), [valueStream]);

  return state;
};
