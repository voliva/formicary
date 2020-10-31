import { mergeWithKey } from '@react-rxjs/utils';
import { useEffect, useState } from 'react';
import { debounceTime, scan, startWith, switchMap } from 'rxjs/operators';
import { KeysSelector, getKeys } from '../path';
import { FormRef } from './formRef';
import { arrayEquals } from './util';

const ALL_KEYS = Symbol('all');
export const useErrorsCb = <TValues>(
  formRef: FormRef<TValues>,
  callback: (erros: Record<string, 'pending' | string[]>) => void,
  keysSelector?: KeysSelector<TValues>
) => {
  const keys = keysSelector ? getKeys(keysSelector) : [ALL_KEYS];

  useEffect(() => {
    const sub = formRef.error$
      .pipe(
        switchMap(controls =>
          mergeWithKey(
            Object.fromEntries(
              keys[0] === ALL_KEYS
                ? Array.from(controls.entries())
                : keys.map((key: string) => [key, controls.get(key)!] as const)
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
            const errorValue =
              typeof errorResult === 'boolean' ? [] : errorResult;
            return {
              ...prevErrors,
              [key]: errorValue,
            };
          }
          return prevErrors;
        }, {} as Record<string, 'pending' | string[]>),
        startWith({}),
        debounceTime(0)
      )
      .subscribe(callback);

    return () => sub.unsubscribe();
  }, [formRef, ...keys]);
};
