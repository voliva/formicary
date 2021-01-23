import { ObservableValue } from './ObservableValue';

export class ObservableState<T> implements ObservableValue<T> {
  private observers = new Set<(value: T) => void>();
  private state: T | typeof EMPTY;

  constructor(initialValue?: T) {
    this.state = arguments.length >= 1 ? initialValue! : EMPTY;
  }

  subscribe(callback: (value: T) => void) {
    this.observers.add(callback);
    if (this.state !== EMPTY) callback(this.state);
    return () => {
      this.observers.delete(callback);
    };
  }

  setState(newState: T) {
    this.state = newState;
    this.observers.forEach(observer => observer(newState));
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
