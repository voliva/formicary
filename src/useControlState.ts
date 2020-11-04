import { useEffect, useState } from 'react';
import { ControlOptions, FormRef } from './internal/formRef';
import { useControl } from './useControl';

export const useControlState = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
) => {
  const { subscribe, ...control } = useControl(formRef, options);
  const [state, setState] = useState<T>(options.initialValue);

  useEffect(() => subscribe(setState), []);

  return {
    ...control,
    value: state,
  };
};
