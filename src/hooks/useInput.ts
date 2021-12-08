import { MutableRefObject, useEffect, useRef } from "react";
import { useControlStateless } from ".";
import { FormRef } from "../internal/formRef";
import { Key, KeySelector, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { Validator } from "../validators";

export type InputOptions<TValues, V> = {
  elementProp?: string;
  eventType?: "input" | "onChange";
  validator?: Validator<V, TValues>;
  initialValue?: string | boolean;
};

/// With formRef ///
// string path
export function useInput<
  TValues,
  P extends Paths<TValues>,
  V extends ValueOfPath<TValues, P>
>(
  formRef: FormRef<TValues>,
  key: P,
  options?: InputOptions<TValues, V>
): MutableRefObject<HTMLInputElement | null>;

// key selector
export function useInput<TValues, V>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, V>,
  options?: InputOptions<TValues, V>
): MutableRefObject<HTMLInputElement | null>;

/// Without formRef ///
// untyped string
export function useInput<TValues, T>(
  key: string,
  options?: InputOptions<TValues, T>
): MutableRefObject<HTMLInputElement | null>;

// string path through keyFn
export function useInput<TValues, T>(
  key: Key<TValues, any, T>,
  options?: InputOptions<TValues, T>
): MutableRefObject<HTMLInputElement | null>;

// key selector
export function useInput<TValues, T>(
  key: KeySelector<TValues, T>,
  options?: InputOptions<TValues, T>
): MutableRefObject<HTMLInputElement | null>;

export function useInput<TValues, P extends Paths<TValues>>(...args: any[]) {
  const [formRef, keySelector, options = {}] = useHookParams<
    TValues,
    [any, InputOptions<TValues, P> | undefined]
  >(args);
  const { eventType = "input", elementProp = "value" } = options;
  const ref = useRef<HTMLInputElement | null>(null);

  const control = useControlStateless(formRef, {
    key: keySelector,
    initialValue: (options.initialValue as any) ?? "",
    validator: options.validator,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const valueUnsub = control.subscribe((value) => {
      if ((element as any)[elementProp] !== value) {
        (element as any)[elementProp] = value;
      }
    });

    const blurListener = () => {
      control.touch();
    };
    element.addEventListener("blur", blurListener);
    const valueListener = (event: any) =>
      control.setValue(event.target[elementProp]);
    element.addEventListener(eventType, valueListener);

    return () => {
      valueUnsub();
      element.removeEventListener("blur", blurListener);
      element.removeEventListener(eventType, valueListener);
    };
  }, [ref.current]);

  return ref;
}
