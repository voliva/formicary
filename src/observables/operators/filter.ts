import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const filter = <T>(filterFn: (value: T) => boolean) => (
  source: ObservableEvent<T>
) =>
  new DerivedObservable<T>(next =>
    source.subscribe(value => (filterFn(value) ? next(value) : void 0))
  );
