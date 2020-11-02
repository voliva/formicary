import { mergeWithKey } from '@react-rxjs/utils';
import { useEffect } from 'react';
import { Observable } from 'rxjs';
import { debounceTime, scan, startWith, switchMap } from 'rxjs/operators';
import { getKeys, KeysSelector } from '../path';
import { arrayEquals } from './util';

const getError$ = <TValues>(
  error$: Observable<Map<string, Observable<boolean | string[] | 'pending'>>>,
  keys: 'all' | string[]
) =>
  error$.pipe(
    switchMap(controls =>
      mergeWithKey(
        Object.fromEntries(
          keys === 'all'
            ? Array.from(controls.entries())
            : keys
                .filter(key => controls.has(key))
                .map((key: string) => [key, controls.get(key)!] as const)
        )
      )
    ),
    scan((prevErrors, { type: key, payload: errorResult }) => {
      switch (errorResult) {
        case true:
          if (key in prevErrors) {
            const { [key]: _, ...newErrors } = prevErrors;
            return newErrors;
          }
          return prevErrors;
        case 'pending':
          return {
            ...prevErrors,
            [key]: 'pending' as const,
          };
      }
      if (
        !(key in prevErrors) ||
        prevErrors[key] === 'pending' ||
        (typeof errorResult === 'object' &&
          !arrayEquals(prevErrors[key] as string[], errorResult))
      ) {
        const errorValue = typeof errorResult === 'boolean' ? [] : errorResult;
        return {
          ...prevErrors,
          [key]: errorValue,
        };
      }
      return prevErrors;
    }, {} as Record<string, 'pending' | string[]>),
    startWith({} as Record<string, 'pending' | string[]>),
    debounceTime(0)
  );

const ALL_KEYS = Symbol('all');
export const useErrorsCb = <TValues>(
  error$: Observable<Map<string, Observable<boolean | string[] | 'pending'>>>,
  callback: (erros: Record<string, 'pending' | string[]>) => void,
  keysSelector?: KeysSelector<TValues>
) => {
  const keys = keysSelector ? getKeys(keysSelector) : [ALL_KEYS];

  useEffect(() => {
    const sub = getError$(
      error$,
      keys[0] === ALL_KEYS ? 'all' : keys
    ).subscribe(callback);

    return () => sub.unsubscribe();
  }, [error$, ...keys]);
};
