import { FormRef } from '../internal/formRef';

export const readForm = <T>(formRef: FormRef<T>): T => {
  try {
    return formRef.values$.getValue();
  } catch (ex) {
    return {} as T;
  }
};
