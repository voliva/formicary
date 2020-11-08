import { FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';

export const touchFields = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>,
  touch: boolean = true
) => {
  const keys = keysSelector
    ? getKeys(keysSelector)
    : formRef.registeredKeys.getValue();
  keys.forEach((key: string) =>
    getControlState(formRef, key)
      .getChild('touched')
      .next(touch)
  );
};
