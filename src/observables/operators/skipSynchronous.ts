import { DerivedObservable } from '../DerivedObservable';
import { ObservableEvent } from '../ObservableEvent';

export const skipSynchronous = () => <T>(source: ObservableEvent<T>) =>
  new DerivedObservable<T>(next => {
    const state = {
      skip: true,
    };
    const sub = source.subscribe(v => (state.skip ? void 0 : next(v)));
    state.skip = false;
    return sub;
  });
