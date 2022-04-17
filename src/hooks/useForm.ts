import { useEffect, useRef } from "react";
import { createFormRef, FormRef, FormRefOptions } from "../internal/formRef";

export const useForm = <
  TValues extends Record<string, any> = Record<string, any>
>(
  options?: FormRefOptions<TValues>
) => {
  const ref = useRef<FormRef<TValues> | null>(null);
  if (!ref.current) {
    ref.current = createFormRef<TValues>(options);
  }

  useEffect(
    () => () => {
      ref.current?.dispose();
      ref.current = null;
    },
    []
  );

  return ref.current;
};
