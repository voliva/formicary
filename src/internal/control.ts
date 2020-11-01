import { shareLatest } from '@react-rxjs/core';
import { createListener } from '@react-rxjs/utils';
import {
  asapScheduler,
  combineLatest,
  concat,
  merge,
  Observable,
  of,
  Subject,
} from 'rxjs';
import {
  distinctUntilChanged,
  map,
  mapTo,
  mergeMap,
  skip,
  startWith,
  subscribeOn,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { getKey, KeySelector } from '../path';
import { noopValidator, Validator } from '../validators';
import { filterSeenValues, getSyncValue } from './util';

export interface ControlOptions<TValues, T> {
  key: KeySelector<TValues, T>;
  initialValue: T;
  validator?: Validator<T, TValues>;
}

export type SyncObservable<T> = Observable<T> & {
  getLatest: () => T;
};

export interface Control<TValues, T> {
  setValue: (value: T) => void;
  reset: () => void;
  replaceValidator: (validator?: Validator<T, TValues>) => void;
  replaceInitialValue: (initialValue: T) => void;
  touch: () => void;
  dispose: () => void;
  value$: SyncObservable<T>;
  isPristine$: Observable<boolean>;
  error$: Observable<boolean | string[] | 'pending'>;
  isTouched$: Observable<boolean>;
}

export const createControl = <TValues, T>(
  options: Omit<ControlOptions<TValues, T>, 'key'> & { key: string },
  getControl: (key: string) => Control<TValues, any> | undefined
): Control<TValues, T> => {
  const {
    initialValue,
    key,
    validator: initialValidator = noopValidator as Validator<T, TValues>,
  } = options;
  const [newValidator$, replaceValidator] = createListener<
    Validator<T, TValues> | undefined
  >();
  const [newInitialValue$, replaceInitialValue] = createListener<T>();
  const [newValue$, setValue] = createListener<T>();
  const [reset$, reset] = createListener();

  const initialValue$ = newInitialValue$.pipe(
    startWith(initialValue),
    shareLatest()
  );
  const validator$ = newValidator$.pipe(
    map(validator => validator || (noopValidator as Validator<T, TValues>)),
    startWith(initialValidator),
    shareLatest()
  );

  const valueObs$ = merge(
    newValue$,
    reset$.pipe(
      withLatestFrom(initialValue$),
      map(([, initialValue]) => initialValue)
    )
  ).pipe(startWith(initialValue), shareLatest());
  const value$ = Object.assign(valueObs$, {
    getLatest: () => {
      try {
        return getSyncValue(valueObs$);
      } catch (ex) {
        throw new Error(`Control ${key} doesn't have any value yet`); // This shouldn't ever happen.
      }
    },
  });

  const isPristine$ = combineLatest([value$, initialValue$]).pipe(
    map(([value, initialValue]) => value === initialValue),
    distinctUntilChanged()
  );

  const dependency$ = new Subject<Observable<any>>();

  const error$ = combineLatest([
    // Subscribe on asapScheduler to let react run through all useEffects and register
    // all the fields before subscribing.
    value$.pipe(subscribeOn(asapScheduler)),
    dependency$.pipe(
      filterSeenValues(),
      mergeMap(subject => subject.pipe(skip(1))),
      startWith(null)
    ),
  ]).pipe(
    map(([value]) => value),
    withLatestFrom(validator$), // Validator can't be put in `combineLatest` unless we force useMemo on validators
    switchMap(([value, latestValidator]) => {
      try {
        const result = latestValidator(value, keySelector => {
          const key = getKey(keySelector);
          const targetControl = getControl(key);
          if (!targetControl) {
            throw new ControlNotRegisteredError(key);
          }
          dependency$.next(targetControl.value$);
          return targetControl.value$.getLatest();
        });
        if (typeof result === 'boolean' || Array.isArray(result)) {
          return of(result);
        }
        return concat(of('pending' as const), result);
      } catch (ex) {
        if (ex instanceof ControlNotRegisteredError) {
          console.warn(
            `Setting control ${key} error to pending, as the validation depends on a field that hasn't been registered yet`,
            ex
          );
          // TODO but the dependency is lost! i.e. when the dependency comes live, we won't re-evaluate.
        } else {
          console.error(ex); // TODO how to propagate into an error boundary? :|
        }
        return of('pending' as const);
      }
    }),
    shareLatest()
  );
  const sub = error$.subscribe();

  const [touches$, touch] = createListener();
  const isTouched$ = merge(
    reset$.pipe(mapTo(false)),
    touches$.pipe(mapTo(true))
  ).pipe(startWith(false), distinctUntilChanged(), shareLatest());
  sub.add(isTouched$.subscribe());

  return {
    error$,
    replaceInitialValue,
    replaceValidator,
    reset,
    setValue,
    value$,
    isPristine$,
    dispose: () => sub.unsubscribe(),
    touch,
    isTouched$,
  };
};

class ControlNotRegisteredError extends Error {
  constructor(key: string) {
    super(`Control ${key} doesn't have any value yet`);
    this.name = 'ControlNotRegisteredError';

    Object.setPrototypeOf(this, ControlNotRegisteredError.prototype);
  }
}
