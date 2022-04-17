import { useEffect, useState } from "react";
import { FormRef } from "../internal/formRef";
import { Key, KeySelector, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { Validator } from "../validators";
import { ControlStateless, useControlStateless } from "./useControlStateless";

export interface ControlHookOptions<TValues, T> {
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
  key: P,
  options?: ControlHookOptions<TValues, V>
): Control<V>;

// key selector
export function useControl<TValues, V>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, V>,
  options?: ControlHookOptions<TValues, V>
): Control<V>;

/// Without formRef ///
// untyped string
export function useControl<TValues, T>(
  key: string,
  options?: ControlHookOptions<TValues, T>
): Control<T>;

// string path through keyFn
export function useControl<TValues, T>(
  key: Key<any, any, T>,
  options?: ControlHookOptions<TValues, T>
): Control<T>;

// key selector
export function useControl<TValues, T>(
  key: KeySelector<TValues, T>,
  options?: ControlHookOptions<TValues, T>
): Control<T>;

export function useControl<TValues, P extends Paths<TValues>>(
  ...args: any[]
): Control<ValueOfPath<TValues, P>> {
  const [formRef, key, options] = useHookParams<
    TValues,
    [any, ControlHookOptions<TValues, ValueOfPath<TValues, P>> | undefined]
  >(args);
  const { subscribe, ...control } = useControlStateless(formRef, key, {
    ...options,
  });
  const [state, setState] = useState<ValueOfPath<TValues, P> | undefined>(
    control.getValue
  );

  useEffect(() => subscribe(setState), []);

  return {
    ...control,
    value: state,
  };
}
