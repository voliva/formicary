import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const combine = <T>(input: { [K in keyof T]: ObservableEvent<T[K]> }) =>
  new DerivedObservable<T>(next => {
    let active = false;
    let value: any = Array.isArray(input) ? [] : {};
    const entries = Object.entries<ObservableEvent<unknown>>(input);
    entries.forEach(([key, observable]) =>
      observable.subscribe(subvalue => {
        value[key] = subvalue;
        if (active || Object.keys(value).length === entries.length) {
          active = true;
          next(value);
        }
      })
    );
  });
