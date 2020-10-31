import { FormRef } from './internal/formRef';

export function useIsPristine<TValues>(formRef: FormRef<TValues>): boolean {
  return formRef.useIsPristine();
}
