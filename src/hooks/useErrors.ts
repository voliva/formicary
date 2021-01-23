import {
  combine,
  distinctUntilChanged,
  map,
  pipe,
  State,
  switchMap,
  withDefault,
} from 'derive-state';
import { useEffect, useMemo, useState } from 'react';
import { ErrorResult, FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';

const ALL_KEYS = {};
export const useErrors = <TValues>(
  formRef: FormRef<TValues>,
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
                map(v => (v.touched ? v.error$ : FALSE)),
                withDefault(FALSE),
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

  const [errors, setErrors] = useState<
    Record<string, Exclude<ErrorResult, false>>
  >(() => {
    if (error$.hasValue()) {
      return error$.getValue();
    }
    return {}; // TODO does this ever happen? - It did: that's why I need to pass in a default value above
  });

  useEffect(() => error$.subscribe(x => setErrors(() => x)), [error$]);

  return errors;
};

const FALSE = new State(false as false);