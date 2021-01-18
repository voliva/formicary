import { useEffect, useMemo, useState } from 'react';
import { ErrorResult, FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';
import {
  combine,
  map,
  ObservableState,
  pipe,
  switchMap,
  take,
} from '../observables';

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
        : new ObservableState(keys);

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
                switchMap(v => v.error$)
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
      return isValid$.getState();
    }
    return defaultValue; // TODO does it ever happen?
  });

  useEffect(() => isValid$.subscribe(setIsValid), [isValid$]);

  return isValid;
};

const FALSE = new ObservableState(false as false);
