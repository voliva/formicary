import { useEffect } from 'react';
import { ControlOptions } from './internal/control';
import { getKey } from './path';
import { FormRef } from './internal/formRef';

export const useControl = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
) => {
  const key = getKey(options.key);
  useEffect(() => {
    formRef.registerControl(options);
  }, [formRef, options]);

  return {
    setValue: (value: T) => formRef.getControl(key).setValue(value),
    subscribe: (cb: (value: T) => void) =>
      formRef.getControl(key).subscribe(cb),
  };
};
