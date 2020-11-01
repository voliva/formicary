import { useEffect, useRef, useState } from 'react';
import { FormRef } from './internal/formRef';
import { getError$ } from './internal/useErrorsCb';
import { getKey, KeySelector } from './path';
import { Validator } from './validators';

export const useInput = <TValues, T>(
  formRef: FormRef<TValues>,
  options: {
    elementProp?: string;
    eventType?: 'input' | 'onChange';
    key?: KeySelector<TValues, T>;
    validator?: Validator<T, TValues>;
    initialValue?: string | boolean;
  } = {}
) => {
  const { eventType = 'input', elementProp = 'value' } = options;
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState<string[] | null>(null);
  const publicError = touched ? error : null;

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const { initialValue = '', validator } = options;
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

    const unsubscribe = formRef
      .getControl(key)
      .subscribe(value => ((element as any)[elementProp] = value));
    const errorSub = getError$(formRef, [key]).subscribe(({ [key]: value }) =>
      setError(value === 'pending' ? null : value)
    );

    const blurListener = () => setTouched(true);
    element.addEventListener('blur', blurListener);
    const valueListener = (event: any) =>
      formRef.getControl(key).setValue(event.target[elementProp]);
    element.addEventListener(eventType, valueListener);

    return () => {
      unsubscribe();
      errorSub.unsubscribe();
      element.removeEventListener('blur', blurListener);
      element.removeEventListener(eventType, valueListener);
    };
  });

  return [ref, publicError] as const;
};
