import { RefCallback, useEffect, useRef } from "react";
import { useControlStateless } from ".";
import { FormRef } from "../internal/formRef";
import { Key, KeySelector, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { Validator } from "../validators";

export type InputOptions<TValues, V> = {
  elementProp?: "value" | "checked";
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
): RefCallback<HTMLInputElement>;

// key selector
export function useInput<TValues, V>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, V>,
  options?: InputOptions<TValues, V>
): RefCallback<HTMLInputElement>;

/// Without formRef ///
// untyped string
export function useInput<TValues, T>(
  key: string,
  options?: InputOptions<TValues, T>
): RefCallback<HTMLInputElement>;

// string path through keyFn
export function useInput<TValues, T>(
  key: Key<TValues, any, T>,
  options?: InputOptions<TValues, T>
): RefCallback<HTMLInputElement>;

// key selector
export function useInput<TValues, T>(
  key: KeySelector<TValues, T>,
  options?: InputOptions<TValues, T>
): RefCallback<HTMLInputElement>;

export function useInput<TValues, P extends Paths<TValues>>(...args: any[]) {
  const [formRef, keySelector, options = {}] = useHookParams<
    TValues,
    [any, InputOptions<TValues, P> | undefined]
  >(args);
  const { eventType = "input", elementProp = "value" } = options;

  const control = useControlStateless(formRef, {
    key: keySelector,
    initialValue: (options.initialValue as any) ?? "",
    validator: options.validator,
  });

  const activeListener = useRef<{
    element: HTMLInputElement;
    cleanup: () => void;
  } | null>(null);

  useEffect(
    () => () => {
      activeListener.current?.cleanup();
      activeListener.current = null;
    },
    []
  );

  const ref: RefCallback<HTMLInputElement> = (element) => {
    if (!element) {
      activeListener.current?.cleanup();
      activeListener.current = null;
      return;
    }
    if (element === activeListener.current?.element) {
      return;
    }
    activeListener.current?.cleanup();

    const valueUnsub = control.subscribe((value) => {
      if (element[elementProp] !== value) {
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

    const cleanup = () => {
      valueUnsub();
      element.removeEventListener("blur", blurListener);
      element.removeEventListener(eventType, valueListener);
    };
    activeListener.current = {
      element, cleanup
    };
  };

  return ref;
}
