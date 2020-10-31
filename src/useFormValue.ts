import { useEffect, useState } from 'react';
import { merge } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { FormRef } from './internal/formRef';
import { getKeys, KeysSelector } from './path';
import { readForm } from './readForm';

const ALL_KEYS = Symbol('all');
export function useFormValue<TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>
): TValues | undefined {
  const [value, setValue] = useState<TValues | undefined>(undefined);
  const keys = keysSelector ? getKeys(keysSelector) : [ALL_KEYS];

  useEffect(() => {
    const sub = formRef.value$
      .pipe(
        switchMap(controls =>
          merge(
            keys[0] === ALL_KEYS
              ? Array.from(controls.values())
              : keys.map(key => controls.get(key)!).filter(v => !!v) // TODO wait for incoming ones?
          )
        ),
        debounceTime(0),
        map(() => readForm(formRef))
      )
      .subscribe(setValue);

    return () => sub.unsubscribe();
  }, [formRef, ...keys]);

  return value;
}
