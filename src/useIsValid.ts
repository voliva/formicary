import { useEffect, useMemo, useState } from 'react';
import { merge, of } from 'rxjs';
import { distinctUntilChanged, map, scan, switchMap } from 'rxjs/operators';
import { ErrorResult, FormRef, getControlState } from './internal/formRef';
import { getKeys, KeysSelector } from './path';

const ALL_KEYS = {};
export const useIsValid = <TValues>(
  formRef: FormRef<TValues>,
  defaultValue: boolean = false,
  keysSelector?: KeysSelector<TValues>
) => {
  const keys = keysSelector ? getKeys(keysSelector) : [ALL_KEYS];

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
              switchMap(v => v.error$.pipe(map(payload => ({ key, payload }))))
            )
          )
        ).pipe(
          scan(
            (old, { key, payload }) =>
              old[key] === payload
                ? old
                : {
                    ...old,
                    [key]: payload,
                  },
            {} as Record<string, ErrorResult>
          ),
          distinctUntilChanged()
        )
      )
    );
    return result;
  }, [formRef, ...keys]);

  const isValid$ = useMemo(
    () =>
      error$.pipe(
        map(errors => {
          const errorValues = Object.values(errors);
          let hasPending = false;
          const hasError = errorValues.some(error => {
            if (error === 'pending') {
              hasPending = true;
              return false;
            }
            return Boolean(error);
          });
          return hasError ? false : hasPending ? 'pending' : true;
        })
      ),
    [error$]
  );

  const [isValid, setIsValid] = useState<boolean | 'pending'>(() => {
    let value: boolean | 'pending' = defaultValue;
    const sub = isValid$.subscribe(v => (value = v as any));
    sub.unsubscribe();
    return value;
  });

  useEffect(() => {
    const sub = isValid$.subscribe(setIsValid);
    return () => sub.unsubscribe();
  }, [isValid$]);

  return isValid;
};
