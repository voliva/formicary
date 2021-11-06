import { createContext, useContext } from 'react';
import { FormRef } from './internal/formRef';

export const FormicaryContext = createContext<FormRef<any> | null>(null);
export const useFormRef = <T>(): FormRef<T> => {
  const formRef = useContext(FormicaryContext);
  if (!formRef) {
    throw new Error('Form Provider not found in component tree');
  }
  return formRef;
};
