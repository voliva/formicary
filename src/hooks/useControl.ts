import { useEffect, useState } from 'react';
import { ControlOptions, FormRef } from '../internal/formRef';
import { useControlSubscription } from './useControlSubscription';

export const useControl = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
) => {
  const { subscribe, ...control } = useControlSubscription(formRef, options);
  const [state, setState] = useState<T>(options.initialValue);

  useEffect(() => subscribe(setState), []);

  return {
    ...control,
    value: state,
  };
};
