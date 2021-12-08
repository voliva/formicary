import { combine, just, map, switchMap, take, withDefault } from "derive-state";
import { useEffect, useMemo, useState } from "react";
import { ErrorResult, FormRef, getControlState } from "../internal/formRef";
import { getKeys, Key, KeysSelector, Paths } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";

/// With formRef ///
// no keys
export function useIsValid<TValues>(
  formRef: FormRef<TValues>,
  defaultValue?: boolean
): boolean | "pending";

// string path
export function useIsValid<TValues, P extends Paths<TValues>[]>(
  formRef: FormRef<TValues>,
  defaultValue: boolean | undefined,
  ...paths: P
): boolean | "pending";

// key selector
export function useIsValid<TValues>(
  formRef: FormRef<TValues>,
  defaultValue: boolean | undefined,
  keysSelector: KeysSelector<TValues, any>
): boolean | "pending";

/// Without formRef ///
// no keys
export function useIsValid(defaultValue?: boolean): boolean | "pending";

// untyped string
export function useIsValid<P extends string[]>(
  defaultValue: boolean | undefined,
  ...paths: P
): boolean | "pending";

// string path through keyFn
export function useIsValid<K extends Key<any, any, any>[]>(
  defaultValue: boolean | undefined,
  ...keys: K
): boolean | "pending";

// key selector
export function useIsValid<TValues>(
  defaultValue: boolean | undefined,
  keysSelector: KeysSelector<TValues, any>
): boolean | "pending";

export function useIsValid<TValues>(...args: any[]): boolean | "pending" {
  const [formRef, defaultValue = false, ...keys] = useHookParams<
    TValues,
    [boolean | undefined, ...([KeysSelector<TValues, any>] | string[] | [])]
  >(args);

  const error$ = useMemo(() => {
    const keys$ =
      keys.length === 0
        ? formRef.registeredKeys.pipe(map((set) => Array.from(set)))
        : just(getKeys(keys) as Paths<TValues>[]);

    return keys$.pipe(
      switchMap((keys) =>
        combine(
          Object.fromEntries(
            keys.map((key) => [
              key,
              getControlState(formRef, key).pipe(
                take(1),
                switchMap((v) => v.error$),
                withDefault(false)
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
    );
  }, [formRef, ...keys]);

  const isValid$ = useMemo(
    () =>
      error$
        .pipe(
          map((errors) => {
            const errorValues = Object.values(errors);
            let hasPending = false;
            const hasError = errorValues.some((error) => {
              if (error === "pending") {
                hasPending = true;
                return false;
              }
              return true;
            });
            return hasError ? false : hasPending ? "pending" : true;
          })
        )
        .capture(),
    [error$]
  );

  const [isValid, setIsValid] = useState<boolean | "pending">(() => {
    if (isValid$.hasValue()) {
      return isValid$.getValue();
    }
    return defaultValue; // TODO does it ever happen? - It did: that's why I need to pass in a default value above
  });

  useEffect(() => {
    isValid$.subscribe(setIsValid);
    return () => isValid$.close();
  }, [isValid$]);

  return isValid;
}
