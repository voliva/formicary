import { useRef } from 'react';
import { Observable } from 'rxjs';
import { scan, filter, map, take } from 'rxjs/operators';

const empty = Symbol('empty');
export const filterSeenValues = () => <T>(source$: Observable<T>) =>
  source$.pipe(
    scan(
      (acc, value) => {
        if (acc.seen.has(value)) {
          return {
            seen: acc.seen,
            lastValue: empty as typeof empty,
          };
        }
        acc.seen.add(value);
        return {
          seen: acc.seen,
          lastValue: value,
        };
      },
      {
        seen: new Set<T>(),
        lastValue: empty as T | typeof empty,
      }
    ),
    filter(v => v.lastValue !== empty),
    map(v => v.lastValue as T)
  );

export const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

export const arrayEquals = <T>(a: T[], b: T[]) =>
  a.length === b.length && a.every((v, i) => b[i] === v);

export const getSyncValue = <T>(value$: Observable<T>) => {
  let result: T = empty as any;
  value$
    .pipe(take(1))
    .subscribe(res => (result = res))
    .unsubscribe();
  if ((result as any) === empty) {
    throw new Error(`Observable didn't emit synchronously`);
  }
  return result;
};
