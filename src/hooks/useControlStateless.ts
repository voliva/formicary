import { useEffect } from "react";
import { FormRef, getControlState, ControlOptions } from "../internal/formRef";
import { getMapValue, Paths } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";

export interface ControlStateless<T> {
  getValue: () => T;
  setValue: (value: T) => void;
  subscribe: (cb: (value: T) => void) => void;
  touch: () => void;
}

export function useControlStateless<TValues, T>(
  options: ControlOptions<TValues, T>
): ControlStateless<T>;
export function useControlStateless<TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
): ControlStateless<T>;
export function useControlStateless<TValues, T>(
  ...args: any[]
): ControlStateless<T> {
  const [formRef, options] = useHookParams<
    TValues,
    [ControlOptions<TValues, T>]
  >(args);
  const { key } = options;

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
      const state$ = getControlState(formRef, key as Paths<TValues>);
      state$.value.then(
        (value) => {
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
}
