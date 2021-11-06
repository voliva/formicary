import {
  combine,
  distinctUntilChanged,
  map,
  switchMap,
  withDefault,
} from "derive-state";
import { useEffect, useMemo, useState } from "react";
import { FormRef } from "../internal/formRef";
import { buildObject } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";

export function useFormValue<T, R>(
  mapFn: (value: T) => R,
  eqFn?: (a: R, b: R) => boolean
): R;
export function useFormValue<T, R>(
  formRef: FormRef<T>,
  mapFn: (value: T) => R,
  eqFn?: (a: R, b: R) => boolean
): R;
export function useFormValue<T, R>(...args: any[]): R {
  const [formRef, mapFn, eqFn] = useHookParams<
    T,
    [(value: T) => R, undefined | ((a: R, b: R) => boolean)]
  >(args);
  const valueStream = useMemo(
    () =>
      formRef.registeredKeys
        .pipe(
          map((set) => Array.from(set)),
          switchMap((keys) =>
            combine(
              Object.fromEntries(
                keys.map((key) => [
                  key,
                  formRef.values
                    .get(key)!
                    .pipe(withDefault(undefined), distinctUntilChanged()),
                ])
              )
            )
          ),
          map((formValues) => mapFn(buildObject(formValues))),
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
}
