import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const withDefault = <T>(value: T) => <S>(source: ObservableEvent<S>) =>
  new DerivedObservable<S | T>(next => {
    next(value);
    return source.subscribe(next);
  });
