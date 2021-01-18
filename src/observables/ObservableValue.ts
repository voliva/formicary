import { ObservableEvent } from './ObservableEvent';

export interface ObservableValue<T> extends ObservableEvent<T> {
  hasValue(): boolean;
  getState(): T;
}

export const getValue = <T>(source: ObservableValue<T>) =>
  new Promise<T>(resolve => {
    if (source.hasValue()) return resolve(source.getState());
    const unsub = source.subscribe(v => {
      unsub();
      resolve(v);
    });
  });
