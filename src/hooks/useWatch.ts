import { useEffect, useState } from 'react';
import { FormRef } from '../internal/formRef';
import { KeySelector, navigateDeepSubject } from '../internal/path';

export function useWatch<TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  const value$ = navigateDeepSubject(keySelector, formRef.values$);

  useEffect(() => {
    const sub = value$.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [value$]);

  return value;
}
