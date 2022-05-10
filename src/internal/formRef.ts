import {
  asStateless,
  combine,
  distinctUntilChanged,
  map,
  Observable,
  StateObservable,
  skipSynchronous,
  State,
  Stateless,
  take,
  withDefault,
  StatelessObservable,
} from "derive-state";
import { Validator, noopValidator } from "../validators";
import { getKeyValues, getMapValue, Paths, ValueOfPath } from "./path";
import type {
  ControlOptions,
  FormRef,
  FormRefOptions,
  ControlState,
  ErrorResult,
} from "./formRef.type";

export { ControlOptions, FormRef, FormRefOptions, ControlState, ErrorResult };
export { FormRef as FakeFormRef } from "./formRef.fake-type";

export const createFormRef = <
  TValues extends Record<string, any> = Record<string, any>
>(
  options: {
    initialValue?: TValues;
  } = {}
): FormRef<TValues> => {
  const initialValues = new Map<Paths<TValues>, State<any>>();
  Object.entries(getKeyValues(options.initialValue || {})).forEach(
    ([key, value]) => {
      initialValues.set(key as Paths<TValues>, new State(value));
    }
  );

  const values = new Map(
    Array.from(initialValues.entries()).map(
      ([key, subject]) => [key, new State(subject.getValue())] as const
    )
  );

  const registeredKeys = new State(new Set<Paths<TValues>>(values.keys()));

  /**
   * Same structure as TValues, but every value is a ControlState
   */
  const controlStates = new Map<string, State<ControlState<any>>>();

  const getControlValue$ = (key: string) => getMapValue(key, values);

  const registerControl = ({
    initialValue,
    key,
    validator = noopValidator,
  }: ControlOptions<TValues, any>) => {
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
          validator$: control$.pipe(
            map((control) => control.validator),
            withDefault(validator),
            distinctUntilChanged()
          ),
          value$,
          manualError$: manualError,
          getControlValue$,
        }).capture(),
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
    if (!initialValue$.hasValue()) {
      initialValue$.setValue(initialValue);
    }

    // If it doesn't have value, set it to initial value
    const valueSource$ = getMapValue(key, values);
    if (!valueSource$.hasValue()) {
      valueSource$.setValue(initialValue$.getValue());
    }
  };

  return {
    registeredKeys,
    registerControl,
    initialValues,
    controlStates,
    values,
    dispose: () => {
      Array.from(initialValues.values()).forEach((state) => state.close());
      Array.from(values.values()).forEach((state) => state.close());
      Array.from(controlStates.values()).forEach((state) => {
        if (state.hasValue()) {
          state.getValue().error$.close();
        }
        state.close();
      });
      registeredKeys.close();
      initialValues.clear();
      values.clear();
      controlStates.clear();
    },
  };
};

export function isFormRef(value: unknown): value is FormRef<any> {
  return !!(
    typeof value === "object" &&
    value &&
    "registeredKeys" in value &&
    "registerControl" in value
  );
}

export const getControlState = <TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  key: P
) =>
  getMapValue(key, formRef.controlStates) as State<
    ControlState<ValueOfPath<TValues, P>>
  >;

const createError$ = <T>(params: {
  key: string;
  validator$: Observable<Validator<T>>;
  value$: Observable<T>;
  manualError$: Observable<ErrorResult>;
  getControlValue$: (key: string) => StateObservable<any>;
}): StatelessObservable<ErrorResult> => {
  const { key, validator$, value$, getControlValue$ } = params;

  const validationError$ = new Stateless<ErrorResult>((obs) => {
    const dependenciesObserved = new Set<StateObservable<any>>();

    let latestValidator: Validator<T> | typeof EMPTY = EMPTY;
    let latestValue: T | typeof EMPTY = EMPTY;
    validator$.subscribe((v) => {
      latestValidator = v;
      if (latestValue !== EMPTY) runValidator();
    });

    value$.subscribe((v) => {
      latestValue = v;
      runValidator();
    });

    function runValidator() {
      if (latestValidator === EMPTY) {
        throw new Error("No validator defined"); // TODO shouldn't ever happen
      }
      if (latestValue === EMPTY) {
        throw new Error("No value defined"); // TODO shouldn't ever happen
      }
      try {
        const result = latestValidator(latestValue, (key) => {
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
        if (typeof result === "boolean") {
          return obs.next(result === true ? false : []);
        }
        if (Array.isArray(result)) {
          return obs.next(result);
        }
        obs.next("pending");
        result.then((result) => obs.next(result === true ? false : result));
      } catch (ex) {
        if (ex instanceof ValueNotThereYetError) {
          console.warn(
            `Setting control ${key} error to pending, as the validation depends on a field that hasn't been registered yet`,
            ex
          );
        } else {
          console.error(ex); // TODO how to propagate into an error boundary? :|
        }
        return obs.next("pending" as const);
      }
    }
  });

  const manualError$ = new Stateless<ErrorResult>((obs) => {
    obs.next(false);
    let innerUnsub = (): void => void 0;
    const outerUnsub = params.manualError$.subscribe((error) => {
      obs.next(error);
      innerUnsub();
      innerUnsub = value$
        .pipe(
          skipSynchronous(),
          take(1),
          map(() => false as const)
        )
        .subscribe(obs.next);
    });
    return () => {
      innerUnsub();
      outerUnsub();
    };
  });

  const errors = combine({
    validatorResult: validationError$.pipe(
      distinctUntilChanged((a, b) => {
        if (Array.isArray(a) && Array.isArray(b)) {
          return a.length === b.length && a.every((v, i) => b[i] === v);
        }
        return a === b;
      })
    ),
    manualResult: manualError$,
  });

  return errors.pipe(
    map(({ validatorResult, manualResult }) => {
      if (manualResult === false || manualResult === "pending")
        return validatorResult;
      if (validatorResult === false || validatorResult === "pending")
        return manualResult;
      return [...manualResult, ...validatorResult];
    })
  );
};

class ValueNotThereYetError extends Error {
  constructor(key: string) {
    super(`Control ${key} doesn't have any value yet`);
    this.name = "ValueNotThereYetError";

    Object.setPrototypeOf(this, ValueNotThereYetError.prototype);
  }
}

const EMPTY = Symbol("empty");
