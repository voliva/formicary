import { useEffect, useState } from "react";
import { ControlOptions, FormRef } from "../internal/formRef";
import { Key, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { Validator } from "../validators";
import { ControlStateless, useControlStateless } from "./useControlStateless";

export type Control<T> = Omit<ControlStateless<T>, "subscribe"> & {
  value: T;
};

export function useControl<TValues, P extends Paths<TValues>>(options: {
  key: Key<TValues, P>;
  initialValue: ValueOfPath<TValues, P>;
  validator?: Validator<ValueOfPath<TValues, P>, TValues>;
}): Control<ValueOfPath<TValues, P>>;
export function useControl<T>(options: {
  key: string;
  initialValue: T;
  validator?: Validator<T, any>;
}): Control<T>;
export function useControl<TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  options: {
    key: P;
    initialValue: ValueOfPath<TValues, P>;
    validator?: Validator<ValueOfPath<TValues, P>, TValues>;
  }
): Control<ValueOfPath<TValues, P>>;
export function useControl<TValues, P extends Paths<TValues>>(
  ...args: any[]
): Control<ValueOfPath<TValues, P>> {
  const [formRef, options] = useHookParams<
    TValues,
    [ControlOptions<TValues, ValueOfPath<TValues, P>>]
  >(args);
  const { subscribe, ...control } = useControlStateless(formRef, options);
  const [state, setState] = useState<ValueOfPath<TValues, P>>(control.getValue);

  useEffect(() => subscribe(setState), []);

  return {
    ...control,
    value: state,
  };
}

/*
  interface FormValue {
    subcontrol: {
      foo: string;
      bar: unknown;
    };
  }
  const form = useForm<FormValue>();

  // Control<{foo: string; bar: unknown; }>
  const control = useControl(form, {
    key: "subcontrol",
    initialValue: {
      foo: "asdf",
      bar: "haha",
    },
  });

  // null is not asignable to type {foo: string; bar: unknown; }
  const control = useControl(form, {
    key: "subcontrol",
    initialValue: null,
  });

  // asdf is not asignable to Paths<FormValue>
  const control = useControl(form, {
    key: "asdf",
    initialValue: {
      foo: "asdf",
      bar: "haha",
    },
  });

  // Intellisense works with key.

  const key = createKeyFn<FormValue>();

  // Control<{foo: string; bar: unknown; }>
  const control = useControl({
    key: key("subcontrol"),
    initialValue: {
      foo: "asdf",
      bar: "haha",
    },
  });

  // Control<null>      <======= Unwanted :(
  const control = useControl({
    key: key("subcontrol"),
    initialValue: null,
  });

  // Control<null>      <======= OK
  const control = useControl({
    key: "asdf",
    initialValue: null
  });

  // This is for the permissive second overload. Without it
  // the "Unwanted" result will become type safe (can't assign null to blah)
  // but then the next one (marked with OK) gets a nasty `can't assign to never` error.
*/
