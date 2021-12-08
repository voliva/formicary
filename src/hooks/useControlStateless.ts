import { useEffect } from "react";
import { FormRef, getControlState } from "../internal/formRef";
import {
  getKey,
  getMapValue,
  Key,
  KeySelector,
  Paths,
  ValueOfPath,
} from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { Validator } from "../validators";

export interface ControlStatelessOptions<K, TValues, T> {
  key: K;
  initialValue?: T;
  validator?: Validator<T, TValues>;
}

export interface ControlStateless<T> {
  getValue: () => T | undefined;
  setValue: (value: T | undefined) => void;
  subscribe: (cb: (value: T | undefined) => void) => () => void;
  touch: () => void;
}

/// With formRef ///
// string path
export function useControlStateless<
  TValues,
  P extends Paths<TValues>,
  V extends ValueOfPath<TValues, P>
>(
  formRef: FormRef<TValues>,
  options: ControlStatelessOptions<P, TValues, V>
): ControlStateless<V>;

// key selector
export function useControlStateless<TValues, V>(
  formRef: FormRef<TValues>,
  options: ControlStatelessOptions<KeySelector<TValues, V>, TValues, V>
): ControlStateless<V>;

/// Without formRef ///
// untyped string
export function useControlStateless<TValues, T>(
  options: ControlStatelessOptions<string, TValues, T>
): ControlStateless<T>;

// string path through keyFn
export function useControlStateless<TValues, T>(
  options: ControlStatelessOptions<Key<any, any, T>, TValues, T>
): ControlStateless<T>;

// key selector
export function useControlStateless<TValues, T>(
  options: ControlStatelessOptions<KeySelector<TValues, T>, TValues, T>
): ControlStateless<T>;

export function useControlStateless<TValues, T>(
  ...args: any[]
): ControlStateless<T> {
  const [formRef, options] = useHookParams<
    TValues,
    [ControlStatelessOptions<any, TValues, T>]
  >(args);
  const key = getKey(options.key);

  useEffect(() => {
    formRef.registerControl({
      key,
      initialValue: options.initialValue ?? undefined,
      validator: options.validator,
    });
  }, [formRef, options]);

  return {
    getValue: () => {
      const state = getMapValue(key, formRef.values);
      return state.hasValue() ? state.getValue() : options.initialValue;
    },
    setValue: (value: T | undefined) =>
      getMapValue(key, formRef.values).setValue(value),
    subscribe: (cb: (value: T | undefined) => void) =>
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
