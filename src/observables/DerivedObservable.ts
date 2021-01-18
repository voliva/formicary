import { ObservableValue } from './ObservableValue';

export class DerivedObservable<T> implements ObservableValue<T> {
  private observers = new Set<(value: T) => void>();
  private state: T | typeof EMPTY = EMPTY;

  constructor(derive: (next: (value: T) => void) => void) {
    derive(next => {
      this.state = next;
      this.observers.forEach(observer => observer(next));
    });
  }

  subscribe(callback: (value: T) => void) {
    this.observers.add(callback);
    if (this.state !== EMPTY) callback(this.state);
    return () => {
      this.observers.delete(callback);
    };
  }
  hasValue() {
    return this.state !== EMPTY;
  }
  getState() {
    if (this.state === EMPTY) {
      throw new Error('Empty value');
    }
    return this.state;
  }
}

const EMPTY = Symbol('empty');
