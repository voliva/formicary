import {
  combine,
  distinctUntilChanged,
  just,
  map,
  switchMap,
  withDefault,
} from "derive-state";
import { useEffect, useMemo, useState } from "react";
import { ErrorResult, FormRef, getControlState } from "../internal/formRef";
import { getKeys, Key, KeysSelector, Paths } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";

type Errors<T extends string> = {
  [K in T]: string[] | "pending";
};

/// With formRef ///
// no keys
export function useErrors<TValues>(
  formRef: FormRef<TValues>
): Partial<Errors<Paths<TValues>>>;

// string path
export function useErrors<TValues, P extends Paths<TValues>[]>(
  formRef: FormRef<TValues>,
  ...paths: P
): Errors<P[number]>;

// key selector
export function useErrors<TValues>(
  formRef: FormRef<TValues>,
  keysSelector: KeysSelector<TValues, any>
): Errors<string>;

/// Without formRef ///
// no keys
export function useErrors(): Errors<string>;

// untyped string
export function useErrors<P extends string[]>(...paths: P): Errors<P[number]>;

// string path through keyFn
export function useErrors<K extends Key<any, any, any>[]>(
  ...keys: K
): Errors<K[number] extends Key<any, infer P, any> ? P : string>;

// key selector
export function useErrors<TValues>(
  keysSelector: KeysSelector<TValues, any>
): Errors<string>;

export function useErrors<TValues>(...args: any[]): Errors<string> {
  const [formRef, ...keys] = useHookParams<
    TValues,
    [KeysSelector<TValues, any>] | string[] | []
  >(args);

  const error$ = useMemo(() => {
    const keys$ =
      keys.length === 0
        ? formRef.registeredKeys.pipe(map((set) => Array.from(set)))
        : just(getKeys(keys) as Paths<TValues>[]);

    return keys$
      .pipe(
        switchMap((keys) =>
          combine(
            Object.fromEntries(
              keys.map((key) => [
                key,
                getControlState(formRef, key).pipe(
                  map((v) => (v.touched ? v.error$ : FALSE)),
                  withDefault(FALSE),
                  distinctUntilChanged(),
                  switchMap((v) => v)
                ),
              ])
            )
          )
        ),
        map((results) =>
          Object.fromEntries(
            Object.entries(results).filter(([, value]) => value !== false) as [
              string,
              Exclude<ErrorResult, false>
            ][]
          )
        )
      )
      .capture();
  }, [formRef, ...keys]);

  const [errors, setErrors] = useState<
    Record<string, Exclude<ErrorResult, false>>
  >(() => {
    if (error$.hasValue()) {
      return error$.getValue();
    }
    return {}; // TODO does this ever happen? - It did: that's why I need to pass in a default value above
  });

  useEffect(() => {
    error$.subscribe((x) => setErrors(() => x));
    return () => error$.close();
  }, [error$]);

  return errors;
}

const FALSE = just<false>(false);
