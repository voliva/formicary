import { useEffect, useState } from "react";
import { FormRef } from "../internal/formRef";
import { Key, KeySelector, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { Validator } from "../validators";
import { ControlStateless, useControlStateless } from "./useControlStateless";

export interface ControlHookOptions<K, TValues, T> {
  key: K;
  initialValue?: T;
  validator?: Validator<T, TValues>;
}

export type Control<T> = Omit<ControlStateless<T>, "subscribe"> & {
  value: T | undefined;
};

/// With formRef ///
// string path
export function useControl<
  TValues,
  P extends Paths<TValues>,
  V extends ValueOfPath<TValues, P>
>(
  formRef: FormRef<TValues>,
  options: ControlHookOptions<P, TValues, V>
): Control<V>;

// key selector
export function useControl<TValues, V>(
  formRef: FormRef<TValues>,
  options: ControlHookOptions<KeySelector<TValues, V>, TValues, V>
): Control<V>;

/// Without formRef ///
// untyped string
export function useControl<TValues, T>(
  options: ControlHookOptions<string, TValues, T>
): Control<T>;

// string path through keyFn
export function useControl<TValues, T>(
  options: ControlHookOptions<Key<any, any, T>, TValues, T>
): Control<T>;

// key selector
export function useControl<TValues, T>(
  options: ControlHookOptions<KeySelector<TValues, T>, TValues, T>
): Control<T>;

export function useControl<TValues, P extends Paths<TValues>>(
  ...args: any[]
): Control<ValueOfPath<TValues, P>> {
  const [formRef, options] = useHookParams<
    TValues,
    [ControlHookOptions<any, TValues, ValueOfPath<TValues, P>>]
  >(args);
  const { subscribe, ...control } = useControlStateless(formRef, options);
  const [state, setState] = useState<ValueOfPath<TValues, P> | undefined>(
    control.getValue
  );

  useEffect(() => subscribe(setState), []);

  return {
    ...control,
    value: state,
  };
}
