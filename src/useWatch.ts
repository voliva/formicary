import { useEffect, useState } from 'react';
import { exhaustMap, filter } from 'rxjs/operators';
import { FormRef } from './internal/formRef';
import { getKey, KeySelector } from './path';

export function useWatch<TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  const key = getKey(keySelector);

  useEffect(() => {
    const sub = formRef.value$
      .pipe(
        filter(controls => controls.has(key)),
        exhaustMap(controls => controls.get(key)!)
      )
      .subscribe(setValue);

    return () => sub.unsubscribe();
  }, [key]);

  return value;
}
