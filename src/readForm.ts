import { FormRef } from './internal/formRef';

export const readForm = <T>(formRef: FormRef<T>): T =>
  formRef.values$.getValue();
