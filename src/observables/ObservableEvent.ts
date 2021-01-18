import { ObservableValue } from './ObservableValue';
import { skipSynchronous } from './operators';

export interface ObservableEvent<T> {
  subscribe(callback: (value: T) => void): () => void;
}

export class DerivedObservableEvent<T> implements ObservableEvent<T> {
  private observers = new Set<(value: T) => void>();

  constructor(derive: (next: (value: T) => void) => void) {
    derive(next => {
      this.observers.forEach(observer => observer(next));
    });
  }

  subscribe(callback: (value: T) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }
}

export const asEvent = <T>(observable: ObservableValue<T>) =>
  new DerivedObservableEvent(next =>
    skipSynchronous()(observable).subscribe(next)
  );

export class EventSubject<T> implements ObservableEvent<T> {
  private observers = new Set<(value: T) => void>();

  emit(value: T) {
    this.observers.forEach(observer => observer(value));
  }

  subscribe(callback: (value: T) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }
}
