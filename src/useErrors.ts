import { useState } from 'react';
import { FormRef } from './internal/formRef';
import { useErrorsCb } from './internal/useErrorsCb';
import { KeysSelector } from './path';

export const useErrors = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>
) => {
  const [errors, setErrors] = useState<Record<string, 'pending' | string[]>>(
    {}
  );

  useErrorsCb(formRef.touchedError$, setErrors, keysSelector);

  return errors;
};
