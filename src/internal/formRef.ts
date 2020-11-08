import {
  BehaviorSubject,
  combineLatest,
  concat,
  Observable,
  of,
  Subject,
} from 'rxjs';
import { deepSubject, DeepSubject } from 'rxjs-deep-subject';
import {
  map,
  mapTo,
  mergeMap,
  shareReplay,
  skip,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { getKey, KeySelector, navigateDeepSubject } from './path';
import { FieldValidator, noopValidator } from '../validators';
import { filterSeenValues } from './util';

export interface ControlOptions<TValues, T> {
  key: KeySelector<TValues, T>;
  initialValue: T;
  validator?: FieldValidator<T, TValues>;
}

export interface FormRef<TValues extends Record<string, any>> {
  registeredKeys: BehaviorSubject<Set<string>>;
  registerControl: (options: ControlOptions<TValues, any>) => void;
  initialValues$: DeepSubject<TValues>;
  values$: DeepSubject<TValues>;
  /**
   * Same structure as TValues, but every value is:
   * {
   *   touched: boolean,
   *   errors: string[] | 'pending' | false
   * }
   */
  controlStates$: DeepSubject<any>;
  dispose: () => void;
}

export interface FormRefOptions<TValue> {
  initialValue?: TValue;
}

export type ErrorResult = string[] | 'pending' | false;
export interface ControlState<T> {
  touched: boolean;
  validator: FieldValidator<T>;
  manualError: Subject<ErrorResult>;
  error$: Observable<ErrorResult>;
}

export const createFormRef = <
  TValues extends Record<string, any> = Record<string, any>
>(
  options: {
    initialValue?: TValues;
  } = {}
): FormRef<TValues> => {
  const registeredKeys = new BehaviorSubject(new Set<string>());
  const initialValues$ = deepSubject<TValues>(options.initialValue);
  const values$ = deepSubject<TValues>(options.initialValue);
  /**
   * Same structure as TValues, but every value is a ControlState
   */
  const controlStates$ = deepSubject<any>();

  const registerControl = ({
    initialValue,
    key: keySelector,
    validator = noopValidator,
  }: ControlOptions<TValues, any>) => {
    const key = getKey(keySelector);
    const control$ = navigateDeepSubject(key, controlStates$) as DeepSubject<
      ControlState<any>
    >;
    const value$ = navigateDeepSubject(key, values$);
    if (!control$.hasValue()) {
      const keys = registeredKeys.getValue();
      keys.add(key);
      registeredKeys.next(keys);
      const manualError = new Subject<ErrorResult>();
      control$.next({
        touched: false,
        validator,
        manualError,
        error$: createError$({
          key,
          validator$: control$.getChild('validator'),
          value$,
          manualError$: manualError.asObservable(),
          getControlValue$: key => navigateDeepSubject(key, values$),
        }),
      });
    }

    // Update validator
    const validator$ = control$.getChild('validator');
    if (validator !== validator$.getValue()) {
      validator$.next(validator);
    }

    // Update initial value
    const initialValue$ = navigateDeepSubject(key, initialValues$);
    if (
      !initialValue$.hasValue() ||
      initialValue$.getValue() !== initialValue
    ) {
      initialValue$.next(initialValue);
    }

    // If it doesn't have value, set it to initial value
    if (!value$.hasValue()) {
      value$.next(initialValue);
    }
  };

  return {
    registeredKeys,
    registerControl,
    initialValues$,
    controlStates$,
    values$,
    dispose: () => {
      initialValues$.complete();
      values$.complete();
      controlStates$.complete();
    },
  };
};

export const getControlState = <TValues, T>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, T>
): DeepSubject<ControlState<T>> =>
  navigateDeepSubject(key, formRef.controlStates$);

const createError$ = <T>(params: {
  key: string;
  validator$: Observable<FieldValidator<T>>;
  value$: Observable<T>;
  manualError$: Observable<ErrorResult>; // Assuming hot observable
  getControlValue$: (key: string) => DeepSubject<any>;
}): Observable<ErrorResult> => {
  const { key, validator$, value$, getControlValue$ } = params;
  const dependency$ = new Subject<DeepSubject<any>>();

  const validatorError$ = combineLatest([
    value$,
    dependency$.pipe(
      filterSeenValues(),
      mergeMap(subject => subject.pipe(skipSynchronous())),
      deferredStartWith(null)
    ),
  ]).pipe(
    map(([value]) => value),
    withLatestFrom(validator$), // Validator can't be put in `combineLatest` unless we force useMemo on validators
    switchMap(([value, latestValidator]) => {
      try {
        const result = latestValidator(value, keySelector => {
          const key = getKey(keySelector);
          const targetControlValue$ = getControlValue$(key);

          dependency$.next(targetControlValue$);
          if (!targetControlValue$.hasValue()) {
            throw new ValueNotThereYetError(key);
          }
          return targetControlValue$.getValue();
        });
        if (typeof result === 'boolean') {
          return of<false | string[]>(result === true ? false : []);
        }
        if (Array.isArray(result)) {
          return of(result);
        }
        return concat(
          of('pending' as const),
          result.then<false | string[]>(result =>
            result === true ? false : result === false ? [] : result
          )
        );
      } catch (ex) {
        if (ex instanceof ValueNotThereYetError) {
          console.warn(
            `Setting control ${key} error to pending, as the validation depends on a field that hasn't been registered yet`,
            ex
          );
        } else {
          console.error(ex); // TODO how to propagate into an error boundary? :|
        }
        return of('pending' as const);
      }
    })
  );

  const manualError$ = params.manualError$.pipe(
    switchMap(v =>
      concat(of(v), value$.pipe(skipSynchronous(), mapTo(false as const)))
    ),
    startWith(false as const)
  );

  return combineLatest([validatorError$, manualError$]).pipe(
    map(
      ([validatorResult, manualResult]): ErrorResult => {
        if (manualResult === false || manualResult === 'pending')
          return validatorResult;
        if (validatorResult === false || validatorResult === 'pending')
          return manualResult;
        return [...manualResult, ...validatorResult];
      }
    ),
    shareReplay(1) // TODO doesnt work with shareLatest - It receives many unsubscriptions+resubscriptions
  );
};

class ValueNotThereYetError extends Error {
  constructor(key: string) {
    super(`Control ${key} doesn't have any value yet`);
    this.name = 'ValueNotThereYetError';

    Object.setPrototypeOf(this, ValueNotThereYetError.prototype);
  }
}

const deferredStartWith = <T>(value: T) => (source: Observable<T>) =>
  new Observable(subscriber => {
    const initialSent = {
      value: false,
    };
    const buffer: T[] = [];
    const sub = source.subscribe({
      next: v => {
        if (initialSent.value) {
          subscriber.next(v);
        } else {
          buffer.push(v);
        }
      },
      error: e => subscriber.error(e),
      complete: () => subscriber.complete(),
    });
    initialSent.value = true;

    if (!subscriber.closed) {
      subscriber.next(value);
      for (let i = 0; i < buffer.length && !subscriber.closed; i++)
        subscriber.next(buffer[i]);
    }

    return sub;
  });

const skipSynchronous = () => <T>(source: Observable<T>) =>
  new Observable<T>(subscriber => {
    const state = {
      skip: true,
    };
    const sub = source.subscribe({
      next: v => (state.skip ? void 0 : subscriber.next(v)),
      error: e => subscriber.error(e),
      complete: () => subscriber.complete(),
    });
    state.skip = false;
    return sub;
  });
