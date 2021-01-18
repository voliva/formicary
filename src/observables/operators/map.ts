import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const map = <T, R>(mapFn: (value: T) => R) => (
  source: ObservableEvent<T>
) =>
  new DerivedObservable<R>(next =>
    source.subscribe(value => next(mapFn(value)))
  );
