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
import { Key, Paths } from "../internal/path";

const ALL_KEYS = {};
export const useErrors = <TValues>(
  formRef: FormRef<TValues>,
  keys: Key<TValues, Paths<TValues>>[] = [ALL_KEYS] as Key<
    TValues,
    Paths<TValues>
  >[]
) => {
  const error$ = useMemo(() => {
    const keys$ =
      keys[0] === ALL_KEYS
        ? formRef.registeredKeys.pipe(map((set) => Array.from(set)))
        : just(keys);

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
};

const FALSE = just<false>(false);
