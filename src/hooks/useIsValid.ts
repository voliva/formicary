import { combine, just, map, switchMap, take, withDefault } from "derive-state";
import { useEffect, useMemo, useState } from "react";
import { ErrorResult, FormRef, getControlState } from "../internal/formRef";
import { Key, Paths } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";

const ALL_KEYS = {};
export function useIsValid<TValues>(
  defaultValue?: boolean,
  keys?: Key<TValues, Paths<TValues>>[]
): boolean | "pending";
export function useIsValid<TValues>(
  formRef: FormRef<TValues>,
  defaultValue?: boolean,
  keys?: Paths<TValues>[]
): boolean | "pending";
export function useIsValid<TValues>(...args: any[]): boolean | "pending" {
  const [formRef, defaultValue = false, keys = [ALL_KEYS] as Paths<TValues>[]] =
    useHookParams<TValues, [boolean | undefined, Paths<TValues>[] | undefined]>(
      args
    );

  const error$ = useMemo(() => {
    const keys$ =
      keys[0] === ALL_KEYS
        ? formRef.registeredKeys.pipe(map((set) => Array.from(set)))
        : just(keys);

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
