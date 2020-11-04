import { useEffect } from 'react';
import { FormRef, getControlState, ControlOptions } from './internal/formRef';
import { getKey, navigateDeepSubject } from './path';

export const useControl = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
) => {
  const key = getKey(options.key);
  useEffect(() => {
    formRef.registerControl(options);
  }, [formRef, options]);

  return {
    setValue: (value: T) =>
      navigateDeepSubject(key, formRef.values$).next(value),
    subscribe: (cb: (value: T) => void) => {
      const sub = navigateDeepSubject(key, formRef.values$).subscribe(cb);
      return () => {
        sub.unsubscribe();
      };
    },
    touch: () =>
      getControlState(formRef, key)
        .getChild('touched')
        .next(true),
  };
};
