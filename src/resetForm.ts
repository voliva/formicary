import { FormRef, getControlState } from './internal/formRef';
import { getKeys, KeysSelector, navigateDeepSubject } from './path';

export const resetForm = <T>(
  formRef: FormRef<T>,
  keysSelector?: KeysSelector<T>
): void => {
  const { values$, initialValues$, registeredKeys } = formRef;
  if (!keysSelector) {
    values$.next(initialValues$.getValue());
    registeredKeys.getValue().forEach(key => {
      getControlState(formRef, key)
        .getChild('touched')
        .next(false);
    });
    return;
  }

  const keys = getKeys(keysSelector);
  keys.forEach(key => {
    const value$ = navigateDeepSubject(key, values$);
    const initialValue$ = navigateDeepSubject(key, initialValues$);
    value$.next(initialValue$.getValue());

    getControlState(formRef, key)
      .getChild('touched')
      .next(false);
  });
};
