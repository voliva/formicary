import { FormRef } from '../internal/formRef';
import { getMapValue } from '../internal/path';

export function getFieldChanges<TValues>(
  formRef: FormRef<TValues>
): Array<{ key: string; initial: any; value: any }> {
  const keys = formRef.registeredKeys.getValue();

  return Array.from(keys)
    .map(key => {
      const initialValue$ = getMapValue(key, formRef.initialValues);
      const value$ = getMapValue(key, formRef.values);
      if (!initialValue$.hasValue() || !value$.hasValue()) {
        return null!;
      }

      const initial = initialValue$.getValue();
      const value = value$.getValue();

      return { key, initial, value };
    })
    .filter(change => change && change.initial !== change.value);
}
