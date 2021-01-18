import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const merge = <T>(observables: ObservableEvent<T>[]) =>
  new DerivedObservable<T>(next => {
    observables.forEach(observable => {
      observable.subscribe(next);
    });
  });
