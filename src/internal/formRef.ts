import { shareLatest } from '@react-rxjs/core';
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
  mergeMap,
  skip,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { getKey, KeySelector, navigateDeepSubject } from '../path';
import { FieldValidator, noopValidator, PureValidator } from '../validators';
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
  validator?: PureValidator<TValue>;
}

export type ErrorResult = string[] | 'pending' | false;
export interface ControlState<T> {
  touched: boolean;
  validator: FieldValidator<T>;
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
    const control$ = navigateDeepSubject(key, controlStates$);
    const value$ = navigateDeepSubject(key, values$);
    if (!control$.hasValue()) {
      const keys = registeredKeys.getValue();
      keys.add(key);
      registeredKeys.next(keys);
      control$.next({
        touched: true,
        validator,
        error$: createError$({
          key,
          validator$: control$.getChild('validator'),
          value$,
          getControlValue$: key => navigateDeepSubject(key, value$),
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
  getControlValue$: (key: string) => DeepSubject<any>;
}): Observable<ErrorResult> => {
  const { key, validator$, value$, getControlValue$ } = params;
  const dependency$ = new Subject<DeepSubject<any>>();

  return combineLatest([
    value$,
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
          // TODO but the dependency is lost! i.e. when the dependency comes live, we won't re-evaluate.
        } else {
          console.error(ex); // TODO how to propagate into an error boundary? :|
        }
        return of('pending' as const);
      }
    }),
    shareLatest()
  );
};

class ValueNotThereYetError extends Error {
  constructor(key: string) {
    super(`Control ${key} doesn't have any value yet`);
    this.name = 'ValueNotThereYetError';

    Object.setPrototypeOf(this, ValueNotThereYetError.prototype);
  }
}
