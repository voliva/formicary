import { useEffect } from 'react';
import { FormRef, getControlState, ControlOptions } from '../internal/formRef';
import { getKey, getMapValue } from '../internal/path';

export const useControlSubscription = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
) => {
  const key = getKey(options.key);

  useEffect(() => {
    formRef.registerControl(options);
  }, [formRef, options]);

  return {
    getValue: () => {
      const state = getMapValue(key, formRef.values);
      return state.hasValue() ? state.getValue() : options.initialValue;
    },
    setValue: (value: T) => getMapValue(key, formRef.values).setValue(value),
    subscribe: (cb: (value: T) => void) =>
      getMapValue(key, formRef.values).subscribe(cb),
    touch: () => {
      const state$ = getControlState(formRef, key);
      state$.value.then(
        value => {
          if (value.touched || state$.closed) return;
          state$.setValue({
            ...value,
            touched: true,
          });
        },
        () => {}
      );
    },
  };
};
