import { MutableRefObject, useEffect, useRef } from "react";
import { FormRef, getControlState } from "../internal/formRef";
import { getMapValue, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { FieldValidator } from "../validators";

export type InputOptions<TValues, P extends Paths<TValues>> = {
  elementProp?: string;
  eventType?: "input" | "onChange";
  key?: P;
  validator?: FieldValidator<ValueOfPath<TValues, P>, TValues>;
  initialValue?: string | boolean;
};

export function useInput<TValues, P extends Paths<TValues>>(
  options?: InputOptions<TValues, P>
): MutableRefObject<HTMLInputElement | null>;
export function useInput<TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  options?: InputOptions<TValues, P>
): MutableRefObject<HTMLInputElement | null>;
export function useInput<TValues, P extends Paths<TValues>>(...args: any[]) {
  const [formRef, options = {}] = useHookParams<
    TValues,
    [InputOptions<TValues, P> | undefined]
  >(args);
  const { eventType = "input", elementProp = "value" } = options;
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const { initialValue = "", validator } = options;
    const key = options.key ?? (element.name as Paths<TValues>);
    if (!key) {
      console.error(
        "An input is missing its key. Either supply it through useInput `key` option or through the input's name",
        element,
        { options }
      );
      return;
    }
    formRef.registerControl({
      initialValue,
      key,
      validator,
    });

    const value$ = getMapValue(key, formRef.values);
    const valueUnsub = value$.subscribe((value) => {
      if ((element as any)[elementProp] !== value) {
        (element as any)[elementProp] = value;
      }
    });

    const blurListener = () => {
      const control$ = getControlState(formRef, key);
      if (control$.getValue().touched) return;
      control$.setValue({
        ...control$.getValue(),
        touched: true,
      });
    };
    element.addEventListener("blur", blurListener);
    const valueListener = (event: any) =>
      value$.setValue(event.target[elementProp]);
    element.addEventListener(eventType, valueListener);

    return () => {
      valueUnsub();
      element.removeEventListener("blur", blurListener);
      element.removeEventListener(eventType, valueListener);
    };
  });

  return ref;
}
