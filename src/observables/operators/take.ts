import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const take = (n: number) => <T>(source: ObservableEvent<T>) =>
  new DerivedObservable<T>(next => {
    let i = 0;
    const unsub = source.subscribe(v => {
      if (i < n) {
        next(v);
      }
      i++;
      if (i >= n) {
        if (unsub) unsub();
      }
    });
    if (i >= n) {
      unsub();
    }
  });
