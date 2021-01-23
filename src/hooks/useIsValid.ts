import {
  combine,
  map,
  pipe,
  State,
  switchMap,
  take,
  withDefault,
} from 'derive-state';
import { useEffect, useMemo, useState } from 'react';
import { ErrorResult, FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';

const ALL_KEYS = {};
export const useIsValid = <TValues>(
  formRef: FormRef<TValues>,
  defaultValue: boolean = false,
  keysSelector?: KeysSelector<TValues>
) => {
  const keys = keysSelector ? getKeys(keysSelector) : ([ALL_KEYS] as string[]);

  const error$ = useMemo(() => {
    const keys$ =
      keys[0] === ALL_KEYS
        ? pipe(
            formRef.registeredKeys,
            map(set => Array.from(set))
          )
        : new State(keys);

    return pipe(
      keys$,
      switchMap(keys =>
        combine(
          Object.fromEntries(
            keys.map(key => [
              key,
              pipe(
                getControlState(formRef, key),
                take(1),
                switchMap(v => v.error$),
                withDefault(false)
              ),
            ])
          )
        )
      ),
      map(results =>
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
      pipe(
        error$,
        map(errors => {
          const errorValues = Object.values(errors);
          let hasPending = false;
          const hasError = errorValues.some(error => {
            if (error === 'pending') {
              hasPending = true;
              return false;
            }
            return true;
          });
          return hasError ? false : hasPending ? 'pending' : true;
        })
      ),
    [error$]
  );

  const [isValid, setIsValid] = useState<boolean | 'pending'>(() => {
    if (isValid$.hasValue()) {
      return isValid$.getValue();
    }
    return defaultValue; // TODO does it ever happen? - It did: that's why I need to pass in a default value above
  });

  useEffect(() => isValid$.subscribe(setIsValid), [isValid$]);

  return isValid;
};
