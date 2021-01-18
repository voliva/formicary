import { FormRef, getControlState } from '../internal/formRef';
import { getKeys, KeysSelector } from '../internal/path';

export const touchFields = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>,
  touch: boolean = true
) => {
  const keys = keysSelector
    ? getKeys(keysSelector)
    : formRef.registeredKeys.getState();
  keys.forEach((key: string) => {
    const control$ = getControlState(formRef, key);
    if (control$.getState().touched !== touch) {
      control$.setState({
        ...control$.getState(),
        touched: touch,
      });
    }
  });
};
