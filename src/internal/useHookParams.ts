import { useFormRef } from "../context";
import { FormRef, isFormRef } from "./formRef";

export function useHookParams<TValues, TParams extends unknown[] = []>(
  args: unknown[]
): [FormRef<TValues>, ...TParams] {
  if (isFormRef(args[0])) {
    return args as any;
  }
  return [useFormRef(), ...(args as TParams)];
}
