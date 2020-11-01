import { useEffect, useState } from 'react';
import { ControlOptions } from './internal/control';
import { getKey } from './path';
import { FormRef } from './internal/formRef';
import { useErrors } from './useErrors';

export const useControl = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
) => {
  const key = getKey(options.key);
  useEffect(() => {
    formRef.registerControl(options);
  }, [formRef, options]);

  const [touched, setTouched] = useState(false);
  const errors = useErrors(formRef, [key]);
  const error = touched ? errors[key] : null;

  return {
    setValue: (value: T) => formRef.getControl(key).setValue(value),
    subscribe: (cb: (value: T) => void) =>
      formRef.getControl(key).subscribe(cb),
    onBlur: () => setTouched(true),
    error,
  };
};
