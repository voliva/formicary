import { Observable } from 'rxjs';
import { filter, map, scan } from 'rxjs/operators';

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
