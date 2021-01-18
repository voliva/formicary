import { ObservableEvent } from '../ObservableEvent';
import { ObservableValue } from '../ObservableValue';

export interface Operator<T, R> {
  (source: ObservableEvent<T>): ObservableValue<R>;
}

export function pipe<T, R>(
  source: ObservableEvent<T>,
  op: Operator<T, R>
): ObservableValue<R>;
export function pipe<T, S1, R>(
  source: ObservableEvent<T>,
  op0: Operator<T, S1>,
  opN: Operator<S1, R>
): ObservableValue<R>;
export function pipe<T, S1, S2, R>(
  source: ObservableEvent<T>,
  op0: Operator<T, S1>,
  op1: Operator<S1, S2>,
  opN: Operator<S2, R>
): ObservableValue<R>;
export function pipe<T, S1, S2, S3, R>(
  source: ObservableEvent<T>,
  op0: Operator<T, S1>,
  op1: Operator<S1, S2>,
  op2: Operator<S2, S3>,
  opN: Operator<S3, R>
): ObservableValue<R>;
export function pipe<T, S1, S2, S3, S4, R>(
  source: ObservableEvent<T>,
  op0: Operator<T, S1>,
  op1: Operator<S1, S2>,
  op2: Operator<S2, S3>,
  op3: Operator<S3, S4>,
  opN: Operator<S4, R>
): ObservableValue<R>;
export function pipe<T>(
  source: ObservableEvent<T>,
  ...operators: Operator<any, any>[]
) {
  let current = source;
  operators.forEach(operator => {
    current = operator(current);
  });
  return current;
}
