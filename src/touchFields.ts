import { map, take } from 'rxjs/operators';
import { FormRef } from './internal/formRef';
import { getKeys, KeysSelector } from './path';

export const touchFields = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>
) => {
  if (keysSelector) {
    const keys = getKeys(keysSelector);
    return keys.forEach(key => formRef.getControl(key).touch());
  }
  formRef.value$
    .pipe(
      take(1),
      map(values => Array.from(values.keys()))
    )
    .subscribe(keys => keys.forEach(key => formRef.getControl(key).touch()));
};
