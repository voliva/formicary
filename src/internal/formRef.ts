import {
  asEvent,
  combine,
  DerivedObservable,
  distinctUntilChanged,
  EventSubject,
  map,
  ObservableEvent,
  ObservableState,
  ObservableValue,
  pipe,
  skipSynchronous,
  take,
  withDefault,
} from '../observables';
import { FieldValidator, noopValidator } from '../validators';
import { getKey, getKeyValues, getMapValue, KeySelector } from './path';

export interface ControlOptions<TValues, T> {
  key: KeySelector<TValues, T>;
  initialValue: T;
  validator?: FieldValidator<T, TValues>;
}

export interface FormRef<TValues extends Record<string, any>> {
  registeredKeys: ObservableState<Set<string>>;
  registerControl: (options: ControlOptions<TValues, any>) => void;
  initialValues: Map<string, ObservableState<any>>;
  values: Map<string, ObservableState<any>>;
  controlStates: Map<string, ObservableState<ControlState<any>>>;
  dispose: () => void;
}

export interface FormRefOptions<TValue> {
  initialValue?: TValue;
}

export type ErrorResult = string[] | 'pending' | false;
export interface ControlState<T> {
  touched: boolean;
  validator: FieldValidator<T>;
  manualError: EventSubject<ErrorResult>;
  error$: ObservableValue<ErrorResult>;
}

export const createFormRef = <
  TValues extends Record<string, any> = Record<string, any>
>(
  options: {
    initialValue?: TValues;
  } = {}
): FormRef<TValues> => {
  const registeredKeys = new ObservableState(new Set<string>());
  const initialValues = new Map<string, ObservableState<any>>();
  Object.entries(getKeyValues(options.initialValue || {})).forEach(
    ([key, value]) => {
      initialValues.set(key, new ObservableState(value));
    }
  );

  const values = new Map(
    Array.from(initialValues.entries()).map(
      ([key, subject]) =>
        [key, new ObservableState(subject.getState())] as const
    )
  );
  /**
   * Same structure as TValues, but every value is a ControlState
   */
  const controlStates = new Map<string, ObservableState<ControlState<any>>>();

  const getControlValue$ = (key: string) =>
    getMapValue(key, values, () => new ObservableState());

  const registerControl = ({
    initialValue,
    key: keySelector,
    validator = noopValidator,
  }: ControlOptions<TValues, any>) => {
    const key = getKey(keySelector);
    const value$ = getControlValue$(key);
    const control$: ObservableState<ControlState<any>> = getMapValue(
      key,
      controlStates,
      () => new ObservableState()
    );
    if (!control$.hasValue()) {
      const keys = registeredKeys.getState();
      keys.add(key);
      registeredKeys.setState(keys);
      const manualError = new EventSubject<ErrorResult>();
      control$.setState({
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
    if (validator !== control$.getState().validator) {
      control$.setState({
        ...control$.getState(),
        validator,
      });
    }

    // Update initial value
    const initialValue$ = getMapValue(
      key,
      initialValues,
      () => new ObservableState(initialValue)
    );
    if (
      !initialValue$.hasValue() ||
      initialValue$.getState() !== initialValue
    ) {
      initialValue$.setState(initialValue);
    }

    // If it doesn't have value, set it to initial value
    const valueSource$ = getMapValue(key, values, () => new ObservableState());
    if (!valueSource$.hasValue()) {
      valueSource$.setState(initialValue);
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
) =>
  getMapValue(
    key,
    formRef.controlStates,
    () => new ObservableState()
  ) as ObservableState<ControlState<T>>;

const createError$ = <T>(params: {
  key: string;
  validator$: ObservableValue<FieldValidator<T>>;
  value$: ObservableValue<T>;
  manualError$: ObservableEvent<ErrorResult>;
  getControlValue$: (key: string) => ObservableValue<any>;
}): ObservableValue<ErrorResult> => {
  const { key, validator$, value$, getControlValue$ } = params;

  const validationError$ = new DerivedObservable<ErrorResult>(next => {
    const dependenciesObserved = new Set<ObservableValue<any>>();

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
            asEvent(targetControlValue$).subscribe(runValidator);
          }
          if (!targetControlValue$.hasValue()) {
            throw new ValueNotThereYetError(key);
          }
          return targetControlValue$.getState();
        });
        if (typeof result === 'boolean') {
          return next(result === true ? false : []);
        }
        if (Array.isArray(result)) {
          return next(result);
        }
        next('pending');
        result.then(result =>
          next(result === true ? false : result === false ? [] : result)
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
        return next('pending' as const);
      }
    }
  });

  const manualError$ = new DerivedObservable<ErrorResult>(next => {
    next(false);
    let innerUnsub = (): void => void 0;
    return params.manualError$.subscribe(error => {
      next(error);
      innerUnsub();
      innerUnsub = pipe(
        value$,
        skipSynchronous(),
        take(1),
        map(() => false as false)
      ).subscribe(next);
    });
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
