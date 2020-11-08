import { useEffect, useMemo, useState } from 'react';
import { merge, of } from 'rxjs';
import { distinctUntilChanged, map, scan, switchMap } from 'rxjs/operators';
import { ErrorResult, FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';

const ALL_KEYS = {};
export const useErrors = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>
) => {
  const keys = keysSelector ? getKeys(keysSelector) : [ALL_KEYS];
  const [errors, setErrors] = useState<
    Record<string, Exclude<ErrorResult, false>>
  >({});

  const error$ = useMemo(() => {
    const keys$ =
      keys[0] === ALL_KEYS
        ? formRef.registeredKeys.pipe(map(set => Array.from(set)))
        : of(keys as string[]);
    const result = keys$.pipe(
      switchMap(keys =>
        merge(
          ...keys.map(key =>
            getControlState(formRef, key).pipe(
              switchMap(v =>
                v.touched
                  ? v.error$.pipe(map(payload => ({ key, payload })))
                  : of<{ key: string; payload: false }>({
                      key,
                      payload: false,
                    })
              )
            )
          )
        ).pipe(
          scan((old, { key, payload }) => {
            if (payload === false) {
              if (key in old) {
                const { [key]: _, ...newValue } = old;
                return newValue;
              }
              return old;
            }
            return old[key] === payload
              ? old
              : {
                  ...old,
                  [key]: payload,
                };
          }, {} as Record<string, Exclude<ErrorResult, false>>),
          distinctUntilChanged()
        )
      )
    );
    return result;
  }, [formRef, ...keys]);

  useEffect(() => {
    const sub = error$.subscribe(setErrors);
    return () => sub.unsubscribe();
  }, [error$]);

  return errors;
};
