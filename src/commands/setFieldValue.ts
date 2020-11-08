import { FormRef } from '../internal/formRef';
import { KeySelector, navigateDeepSubject } from '../internal/path';

export const setFieldValue = <TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  value: T
) => {
  const value$ = navigateDeepSubject(keySelector, formRef.values$);

  if (
    value$ === formRef.values$ &&
    typeof value === 'object' &&
    value !== null
  ) {
    const keys = value$.getKeys();
    const autofill = {} as any;
    keys.forEach(key => {
      if (value$.getChild(key).hasValue())
        autofill[key] = value$.getChild(key).getValue();
    });
    value$.next({
      ...autofill,
      ...value,
    });
    return;
  }

  value$.next(value);
};
