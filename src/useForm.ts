import { useEffect, useRef } from 'react';
import { createFormRef, FormRef } from './internal/formRef';

export const useForm = <
  TValues extends Record<string, any> = Record<string, any>
>() => {
  const ref = useRef<FormRef<TValues> | null>(null);
  if (!ref.current) {
    ref.current = createFormRef<TValues>();
  }

  useEffect(() => () => ref.current!.dispose(), []);

  return ref.current;
};
