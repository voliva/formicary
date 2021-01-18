import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const switchMap = <T, R>(mapFn: (value: T) => ObservableEvent<R>) => (
  source: ObservableEvent<T>
) =>
  new DerivedObservable<R>(next => {
    let innerUnsub = (): void => void 0;
    const unsub = source.subscribe(value => {
      innerUnsub();
      innerUnsub = mapFn(value).subscribe(v => next(v));
    });
    return () => {
      innerUnsub();
      unsub();
    };
  });
