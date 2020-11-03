import { FormRef } from './internal/formRef';
import { KeySelector, navigateDeepSubject } from './path';

export const setFieldValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) => navigateDeepSubject(keySelector, formRef.values$).next(value);
