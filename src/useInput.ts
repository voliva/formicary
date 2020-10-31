import { useRef, useEffect, useState } from 'react';
import { ControlOptions } from './internal/control';
import { useControl } from './useControl';
import { FormRef } from './internal/formRef';
import { useErrors } from './useErrors';
import { getKey } from './path';

export const useInput = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T> & {
    elementProp?: string;
    eventType?: 'input' | 'onChange';
  }
) => {
  const { eventType = 'input', elementProp = 'value' } = options;
  const { setValue, subscribe } = useControl(formRef, options);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  const key = getKey(options.key);
  const errors = useErrors(formRef, [key]);
  const error = touched ? errors[key] : null;

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const unsubscribe = subscribe(
      value => ((element as any)[elementProp] = value)
    );
    const blurListener = () => setTouched(true);
    element.addEventListener('blur', blurListener);
    const valueListener = (event: any) => setValue(event.target[elementProp]);
    element.addEventListener(eventType, valueListener);
    return () => {
      unsubscribe();
      element.removeEventListener('blur', blurListener);
      element.removeEventListener(eventType, valueListener);
    };
  });

  return [ref, error] as const;
};
