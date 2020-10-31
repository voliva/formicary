import { useRef, useEffect } from 'react';
import { ControlOptions } from './internal/control';
import { useControl } from './useControl';
import { FormRef } from './internal/formRef';

export const useInput = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T> & {
    elementProp?: string;
    eventType?: 'input' | 'onChange';
  }
) => {
  const { eventType = 'input', elementProp = 'value' } = options;
  const { setValue, subscribe } = useControl(formRef, options);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const listener = (event: any) => setValue(event.target[elementProp]);
    const unsubscribe = subscribe(
      value => ((element as any)[elementProp] = value)
    );
    element.addEventListener(eventType, listener);
    return () => {
      unsubscribe();
      element.removeEventListener(eventType, listener);
    };
  });

  return ref;
};
