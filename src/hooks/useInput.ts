import { useEffect, useRef } from 'react';
import { FormRef, getControlState } from '../internal/formRef';
import { getKey, getMapValue, KeySelector } from '../internal/path';
import { FieldValidator } from '../validators';

type ValueOptions<TField, TValue extends string | boolean> =
  | {
      initialValue?: TValue;
    }
  | {
      initialValue?: TField;
      getInputValue: (fieldValue: TField) => TValue;
      getFieldValue: (
        value: TValue,
        oldFieldValue: TField | undefined
      ) => TField;
    };

export const useInput = <TValues, TField, TValue extends string | boolean>(
  formRef: FormRef<TValues>,
  options: {
    elementProp?: string;
    eventType?: 'input' | 'onChange';
    key?: KeySelector<TValues, TField>;
    validator?: FieldValidator<TField, TValues>;
  } & ValueOptions<TField, TValue> = {}
) => {
  const { eventType = 'input', elementProp = 'value' } = options;
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const { validator } = options;

    const { initialValue, getInputValue, getFieldValue } = (() => {
      if ('getInputValue' in options) {
        return {
          initialValue: options.initialValue || '',
          getInputValue: options.getInputValue,
          getFieldValue: options.getFieldValue,
        };
      }
      return {
        initialValue: options.initialValue || '',
        getInputValue: (v: any) => v,
        getFieldValue: (v: any) => v,
      };
    })();

    const key: string = options.key ? getKey(options.key) : element.name;
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
    const valueUnsub = value$.subscribe(value => {
      if ((element as any)[elementProp] !== value) {
        (element as any)[elementProp] = getInputValue(value);
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
    element.addEventListener('blur', blurListener);
    const valueListener = (event: any) =>
      value$.setValue(
        getFieldValue(
          event.target[elementProp],
          value$.hasValue() ? value$.getValue() : undefined
        )
      );
    element.addEventListener(eventType, valueListener);

    return () => {
      valueUnsub();
      element.removeEventListener('blur', blurListener);
      element.removeEventListener(eventType, valueListener);
    };
  });

  return ref;
};
