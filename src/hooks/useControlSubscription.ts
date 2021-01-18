import { FormRef, getControlState, ControlOptions } from '../internal/formRef';
import { getKey, getMapValue } from '../internal/path';
import { getValue, ObservableState } from '../observables';

export const useControlSubscription = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlOptions<TValues, T>
) => {
  const key = getKey(options.key);
  formRef.registerControl(options);

  return {
    getValue: () =>
      getMapValue(key, formRef.values, () => new ObservableState()).getState(),
    setValue: (value: T) =>
      getMapValue(key, formRef.values, () => new ObservableState()).setState(
        value
      ),
    subscribe: (cb: (value: T) => void) =>
      getMapValue(key, formRef.values, () => new ObservableState()).subscribe(
        cb
      ),
    touch: async () => {
      const state$ = getControlState(formRef, key);
      await getValue(state$);
      if (state$.getState().touched) return;
      state$.setState({
        ...state$.getState(),
        touched: true,
      });
    },
  };
};
