import { FormRef } from './internal/formRef';
import { KeySelector, navigateDeepSubject } from './path';

export const setInitialValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) => navigateDeepSubject(keySelector, formRef.initialValues$).next(value);
