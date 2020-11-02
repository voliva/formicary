import { useState } from 'react';
import { FormRef } from './internal/formRef';
import { useErrorsCb } from './internal/useErrorsCb';
import { KeysSelector } from './path';

export const useIsValid = <TValues>(
  formRef: FormRef<TValues>,
  defaultValue: boolean = false,
  keysSelector?: KeysSelector<TValues>
) => {
  const [isValid, setIsValid] = useState<boolean | 'pending'>(defaultValue);

  useErrorsCb(
    formRef.error$,
    (errors) => {
      const errorValues = Object.values(errors);
      let hasPending = false;
      const hasError = errorValues.some((error) => {
        if (error === 'pending') {
          hasPending = true;
          return false;
        }
        return true;
      });
      setIsValid(hasError ? false : hasPending ? 'pending' : true);
    },
    keysSelector
  );

  return isValid;
};
