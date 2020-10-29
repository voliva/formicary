import { useEffect, useRef, useState } from 'react';
import {
  BehaviorSubject,
  concat,
  merge,
  Observable,
  of,
  Subject,
  Subscription,
} from 'rxjs';
import {
  mergeMap,
  skip,
  map,
  switchMap,
  scan,
  filter,
  distinctUntilChanged,
} from 'rxjs/operators';
import {
  buildObject,
  getKey,
  getKeys,
  KeySelector,
  KeysSelector,
} from './path';
import { Validator } from './validators';

export interface FormRef<T extends Record<string, any>> {
  registeredControls: Map<
    string,
    {
      subject: BehaviorSubject<any>;
      error$: Observable<boolean | string[] | 'pending'>;
      subscriptions: Set<Subscription>;
    }
  >;
}

export const useForm = <
  T extends Record<string, any> = Record<string, any>
>() => {
  const ref = useRef<FormRef<T>>({
    registeredControls: new Map(),
  });
  return ref.current;
};

export interface ControlledFieldOptions<TValues, T> {
  key: KeySelector<TValues, T>;
  initialValue: T;
  validator?: Validator<T, TValues>;
}

const noopValidator: Validator<any> = () => true;
export const useControlledField = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlledFieldOptions<TValues, T>
) => {
  const key = getKey(options.key);
  const {
    initialValue,
    validator = noopValidator as Validator<T, TValues>,
  } = options;
  const latestValidator = useLatestRef(validator);

  // TODO move to useEffect
  if (!formRef.registeredControls.has(key)) {
    const subject = new BehaviorSubject(initialValue);
    const dependency$ = new Subject<BehaviorSubject<any>>();

    const error$ = merge(
      dependency$.pipe(
        filterSeenValues(),
        mergeMap(subject => subject.pipe(skip(1))),
        map(() => subject.getValue())
      ),
      subject
    ).pipe(
      switchMap(value => {
        const result = latestValidator.current(value, keySelector => {
          const key = getKey(keySelector);
          const targetControl = formRef.registeredControls.get(key);
          if (!targetControl) {
            throw new Error(`Control "${key}" hasn't been registered yet`);
          }
          dependency$.next(targetControl.subject);
          return targetControl.subject.getValue();
        });
        if (typeof result === 'boolean' || Array.isArray(result)) {
          return of(result);
        }
        return concat(of('pending' as const), result);
      })
    );
    formRef.registeredControls.set(key, {
      subject,
      error$,
      subscriptions: new Set(),
    });
  }
  const control = formRef.registeredControls.get(key)!;

  return {
    setValue: (value: T) => control.subject.next(value),
    subscribe: (cb: (value: T) => void) => {
      const subscription = control.subject.subscribe(cb);
      control.subscriptions.add(subscription);
      return () => {
        subscription.unsubscribe();
        control.subscriptions.delete(subscription);
      };
    },
  };
};

export const useField = <TValues, T>(
  formRef: FormRef<TValues>,
  options: ControlledFieldOptions<TValues, T> & {
    elementProp?: string;
    eventType?: 'input' | 'onChange';
  }
) => {
  const { eventType = 'input', elementProp = 'value' } = options;
  const { setValue, subscribe } = useControlledField(formRef, options);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const listener = (event: any) => setValue(event.target[elementProp]);
    const unsubscribe = subscribe(
      value => ((element as any)[elementProp] = value)
    );
    element.addEventListener(eventType, listener);
    return () => {
      unsubscribe();
      element.removeEventListener(eventType, listener);
    };
  });

  return ref;
};

export const readForm = <T>(formRef: FormRef<T>): T => {
  const controls = formRef.registeredControls;
  const propValues = Object.fromEntries(
    Array.from(controls.entries()).map(
      ([key, control]) => [key, control.subject.getValue()] as const
    )
  );
  return buildObject(propValues);
};

export function useWatch<TValues, T>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, T>
): T | undefined;
export function useWatch<TValues, T>(
  formRef: FormRef<TValues>,
  key: KeySelector<TValues, T>,
  defaultValue: T
): T;
export function useWatch<TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  defaultValue?: T
): T | undefined {
  const [value, setValue] = useState<T | typeof empty>(empty);
  const key = getKey(keySelector);

  useEffect(() => {
    const control = formRef.registeredControls.get(key);
    if (!control) {
      console.warn(`useWatch: no control registered with key "${key}"`);
      return;
    }

    const sub = control.subject.subscribe(setValue);
    return () => sub.unsubscribe();
  }, [key]);

  return value !== empty ? (value as T) : defaultValue;
}

const ALL_KEYS = Symbol('all');
export const useErrors = <TValues>(
  formRef: FormRef<TValues>,
  keysSelector?: KeysSelector<TValues>
) => {
  const [errors, setErrors] = useState<Record<string, 'pending' | string[]>>(
    {}
  );
  const keys = keysSelector ? getKeys(keysSelector) : [ALL_KEYS];

  useEffect(() => {
    const keysToSubscribe =
      keys[0] === ALL_KEYS
        ? Array.from(formRef.registeredControls.keys())
        : keys.filter(key => formRef.registeredControls.has(key));
    // TODO updating keys when new components become used/unsued
    // TODO think how to do a global isValid (only rerender if it changes global valid.... with same keysSelector API)
    //// |-> In that case, maybe add an optional parameter for a global validation? This way the consumer won't need
    //// |   to use `useWatch` and re-render on every single keystroke.
    // TODO (cont) or as a separate hook: `useValidation` for global validations. Then consumer can combine useIsValid + useValidation if needed
    //    (This is so the consumer can enable/disable button)
    const result$ = merge(
      ...keysToSubscribe.map(key =>
        formRef.registeredControls.get(key)!.error$.pipe(
          map(errorResult => ({
            key,
            errorResult,
          }))
        )
      )
    ).pipe(
      scan((prevErrors, { key, errorResult }) => {
        switch (errorResult) {
          case true:
            if (key in prevErrors) {
              const { [key]: _, ...newErrors } = prevErrors;
              return newErrors;
            }
            return prevErrors;
          case 'pending':
            return {
              ...prevErrors,
              [key]: 'pending',
            };
        }
        if (
          !(key in prevErrors) ||
          prevErrors[key] === 'pending' ||
          (typeof errorResult === 'object' &&
            !arrayEquals(prevErrors[key] as string[], errorResult))
        ) {
          const errorValue =
            typeof errorResult === 'boolean' ? [] : errorResult;
          return {
            ...prevErrors,
            [key]: errorValue,
          };
        }
        return prevErrors;
      }, errors),
      distinctUntilChanged()
    );
    const subscription = result$.subscribe(setErrors);
    return () => subscription.unsubscribe();
  }, keys);

  return errors;
};

const empty = Symbol('empty');
const filterSeenValues = () => <T>(source$: Observable<T>) =>
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

const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

const arrayEquals = <T>(a: T[], b: T[]) =>
  a.length === b.length && a.every((v, i) => b[i] === v);
