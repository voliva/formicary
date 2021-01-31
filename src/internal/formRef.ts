import {
  asStateless,
  combine,
  DerivedState,
  distinctUntilChanged,
  map,
  Observable,
  ObservableState,
  pipe,
  skipSynchronous,
  State,
  Stateless,
  take,
  withDefault,
} from 'derive-state';
import { FieldValidator, noopValidator } from '../validators';
import { getKey, getKeyValues, getMapValue, KeySelector } from './path';

export interface ControlOptions<TValues, T> {
  key: KeySelector<TValues, T>;
  initialValue: T;
  validator?: FieldValidator<T, TValues>;
}

export interface FormRef<TValues extends Record<string, any>> {
  registeredKeys: State<Set<string>>;
  registerControl: (options: ControlOptions<TValues, any>) => void;
  initialValues: Map<string, State<any>>;
  values: Map<string, State<any>>;
  controlStates: Map<string, State<ControlState<any>>>;
  dispose: () => void;
}

export interface FormRefOptions<TValue> {
  initialValue?: TValue;
}

export type ErrorResult = string[] | 'pending' | false;
export interface ControlState<T> {
  touched: boolean;
  validator: FieldValidator<T>;
  manualError: Stateless<ErrorResult>;
  error$: ObservableState<ErrorResult>;
}

export const createFormRef = <
  TValues extends Record<string, any> = Record<string, any>
>(
  options: {
    initialValue?: TValues;
  } = {}
): FormRef<TValues> => {
  const initialValues = new Map<string, State<any>>();
  Object.entries(getKeyValues(options.initialValue || {})).forEach(
    ([key, value]) => {
      initialValues.set(key, new State(value));
    }
  );

  const values = new Map(
    Array.from(initialValues.entries()).map(
      ([key, subject]) => [key, new State(subject.getValue())] as const
    )
  );

  const registeredKeys = new State(new Set<string>(values.keys()));

  /**
   * Same structure as TValues, but every value is a ControlState
   */
  const controlStates = new Map<string, State<ControlState<any>>>();

  const getControlValue$ = (key: string) => getMapValue(key, values);

  const registerControl = ({
    initialValue,
    key: keySelector,
    validator = noopValidator,
  }: ControlOptions<TValues, any>) => {
    const key = getKey(keySelector);
    const value$ = getControlValue$(key);
    const control$: State<ControlState<any>> = getMapValue(key, controlStates);
    if (!control$.hasValue()) {
      const keys = registeredKeys.getValue();
      keys.add(key);
      registeredKeys.setValue(keys);
      const manualError = new Stateless<ErrorResult>();
      control$.setValue({
        touched: false,
        validator,
        manualError,
        error$: createError$({
          key,
          validator$: pipe(
            control$,
            map(control => control.validator),
            withDefault(validator),
            distinctUntilChanged()
          ),
          value$,
          manualError$: manualError,
          getControlValue$,
        }),
      });
    }

    // Update validator
    if (validator !== control$.getValue().validator) {
      control$.setValue({
        ...control$.getValue(),
        validator,
      });
    }

    // Update initial value
    const initialValue$ = getMapValue(key, initialValues);
    if (
      !initialValue$.hasValue() ||
      initialValue$.getValue() !== initialValue
    ) {
      initialValue$.setValue(initialValue);
    }

    // If it doesn't have value, set it to initial value
    const valueSource$ = getMapValue(key, values);
    if (!valueSource$.hasValue()) {
      valueSource$.setValue(initialValue);
    }
  };

  return {
    registeredKeys,
    registerControl,
    initialValues,
    controlStates,
    values,
    dispose: () => {
      // [...initialValues.values()].forEach(subject => subject.complete());
      // [...values.values()].forEach(subject => subject.complete());
      // [...controlStates.values()].forEach(subject => subject.complete());
      initialValues.clear();
      values.clear();
      controlStates.clear();
    },
  };
};

export const getControlState = <TValues, T>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, T>
) => getMapValue(key, formRef.controlStates) as State<ControlState<T>>;

const createError$ = <T>(params: {
  key: string;
  validator$: ObservableState<FieldValidator<T>>;
  value$: ObservableState<T>;
  manualError$: Observable<ErrorResult>;
  getControlValue$: (key: string) => ObservableState<any>;
}): ObservableState<ErrorResult> => {
  const { key, validator$, value$, getControlValue$ } = params;

  const validationError$ = new DerivedState<ErrorResult>(obs => {
    const dependenciesObserved = new Set<ObservableState<any>>();

    let latestValidator: FieldValidator<T> | typeof EMPTY = EMPTY;
    validator$.subscribe(v => (latestValidator = v));

    let latestValue: T | typeof EMPTY = EMPTY;
    value$.subscribe(v => {
      latestValue = v;
      runValidator();
    });

    function runValidator() {
      if (latestValidator === EMPTY) {
        throw new Error('No validator defined'); // TODO shouldn't ever happen
      }
      if (latestValue === EMPTY) {
        throw new Error('No validator defined'); // TODO shouldn't ever happen
      }
      try {
        const result = latestValidator(latestValue, keySelector => {
          const key = getKey(keySelector);
          const targetControlValue$ = getControlValue$(key);

          if (!dependenciesObserved.has(targetControlValue$)) {
            dependenciesObserved.add(targetControlValue$);
            asStateless(targetControlValue$).subscribe(runValidator);
          }
          if (!targetControlValue$.hasValue()) {
            throw new ValueNotThereYetError(key);
          }
          return targetControlValue$.getValue();
        });
        if (typeof result === 'boolean') {
          return obs.next(result === true ? false : []);
        }
        if (Array.isArray(result)) {
          return obs.next(result);
        }
        obs.next('pending');
        result.then(result =>
          obs.next(result === true ? false : result === false ? [] : result)
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
        return obs.next('pending' as const);
      }
    }
  });

  const manualError$ = new DerivedState<ErrorResult>(obs => {
    obs.next(false);
    let innerUnsub = (): void => void 0;
    const outerUnsub = params.manualError$.subscribe(error => {
      obs.next(error);
      innerUnsub();
      innerUnsub = pipe(
        value$,
        skipSynchronous(),
        take(1),
        map(() => false as false)
      ).subscribe(obs.next);
    });
    return () => {
      innerUnsub();
      outerUnsub();
    };
  });

  const errors = combine({
    validatorResult: validationError$,
    manualResult: manualError$,
  });

  return pipe(
    errors,
    map(({ validatorResult, manualResult }) => {
      if (manualResult === false || manualResult === 'pending')
        return validatorResult;
      if (validatorResult === false || validatorResult === 'pending')
        return manualResult;
      return [...manualResult, ...validatorResult];
    })
  );
};

class ValueNotThereYetError extends Error {
  constructor(key: string) {
    super(`Control ${key} doesn't have any value yet`);
    this.name = 'ValueNotThereYetError';

    Object.setPrototypeOf(this, ValueNotThereYetError.prototype);
  }
}

const EMPTY = Symbol('empty');
