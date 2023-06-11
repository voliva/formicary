import { useCallback, useEffect } from "react";
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

export interface ControlStatelessOptions<TValues, T> {
  initialValue?: T;
  validator?: Validator<T, TValues>;
  unregisterOnUnmount?: boolean;
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
  key: P,
  options?: ControlStatelessOptions<TValues, V>
): ControlStateless<V>;

// key selector
export function useControlStateless<TValues, V>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, V>,
  options?: ControlStatelessOptions<TValues, V>
): ControlStateless<V>;

/// Without formRef ///
// untyped string
export function useControlStateless<TValues, T>(
  key: string,
  options?: ControlStatelessOptions<TValues, T>
): ControlStateless<T>;

// string path through keyFn
export function useControlStateless<TValues, T>(
  key: Key<any, any, T>,
  options?: ControlStatelessOptions<TValues, T>
): ControlStateless<T>;

// key selector
export function useControlStateless<TValues, T>(
  key: KeySelector<TValues, T>,
  options?: ControlStatelessOptions<TValues, T>
): ControlStateless<T>;

export function useControlStateless<TValues, T>(
  ...args: any[]
): ControlStateless<T> {
  const [formRef, keySelector, options = {}] = useHookParams<
    TValues,
    [any, ControlStatelessOptions<TValues, T> | undefined]
  >(args);
  const key = getKey(keySelector);

  useEffect(() => {
    formRef.registerControl({
      key,
      initialValue: options.initialValue ?? undefined,
      validator: options.validator,
    });
  }, [formRef, options]);

  useEffect(
    () => () => {
      if (options.unregisterOnUnmount) {
        formRef.unregisterControl(key);
      }
    },
    []
  );

  return {
    getValue: () => {
      const state = getMapValue(key, formRef.values);
      return state.hasValue() ? state.getValue() : options.initialValue;
    },
    setValue: (value: T | undefined) =>
      getMapValue(key, formRef.values).setValue(value),
    subscribe: useCallback(
      (cb: (value: T | undefined) => void) =>
        getMapValue(key, formRef.values).subscribe(cb),
      [formRef]
    ),
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
