import { useEffect, useState } from "react";
import { ControlOptions, FormRef } from "../internal/formRef";
import { useHookParams } from "../internal/useHookParams";
import { ControlStateless, useControlStateless } from "./useControlStateless";

export type Control<T> = Omit<ControlStateless<T>, "subscribe"> & {
  value: T;
};

export function useControl<TValues, T>(
  options: ControlOptions<TValues, T>
): Control<T>;
export function useControl<TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
): Control<T>;
export function useControl<TValues, T>(...args: any[]): Control<T> {
  const [formRef, options] = useHookParams<
    TValues,
    [ControlOptions<TValues, T>]
  >(args);
  const { subscribe, ...control } = useControlStateless(formRef, options);
  const [state, setState] = useState<T>(control.getValue);

  useEffect(() => subscribe(setState), []);

  return {
    ...control,
    value: state,
  };
}
