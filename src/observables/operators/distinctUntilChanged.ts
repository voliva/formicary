import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const distinctUntilChanged = <T>() => (source: ObservableEvent<T>) =>
  new DerivedObservable<T>(next => {
    let lastValue: T | typeof EMPTY = EMPTY;
    source.subscribe(value => {
      if (value !== lastValue) {
        next(value);
      }
      lastValue = value;
    });
  });

const EMPTY = Symbol('empty');
