import { useEffect, useMemo, useState } from 'react';
import { ErrorResult, FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';
import {
  combine,
  distinctUntilChanged,
  map,
  ObservableState,
  pipe,
  switchMap,
  take,
} from '../observables';

const ALL_KEYS = {};
export const useErrors = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>
) => {
  const keys = keysSelector ? getKeys(keysSelector) : ([ALL_KEYS] as string[]);
  const [errors, setErrors] = useState<
    Record<string, Exclude<ErrorResult, false>>
  >({});

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
                map(v => (v.touched ? v.error$ : FALSE)),
                distinctUntilChanged(),
                switchMap(v => v)
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

  useEffect(() => error$.subscribe(x => setErrors(() => x)), [error$]);

  return errors;
};

const FALSE = new ObservableState(false as false);
