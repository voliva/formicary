import { useEffect, useRef, useState } from 'react';
import { Validator } from './validators';
import {
  BehaviorSubject,
  merge,
  Observable,
  of,
  Subject,
  Subscription,
} from 'rxjs';
import {
  filter,
  map,
  mergeAll,
  mergeMap,
  scan,
  skip,
  switchMap,
} from 'rxjs/operators';

type SetPropTypes<O, T> = {
  [K in keyof O]: T;
};

export interface UseFormOptions<TValues extends Record<string, any>> {
  default: TValues;
  onSubmit: (
    values: TValues
  ) => void | Promise<void | {
    errors: string[];
    fieldErrors: Partial<SetPropTypes<TValues, string[]>>;
  }>;
}

interface Control<T> {
  setValue: (value: T) => void;
  setSubscriptor: (cb: (value: T) => void) => void;
}

export const useForm = <TValues extends Record<string, any>>(
  options: UseFormOptions<TValues>
) => {
  const registeredControls = useRef(
    new Map<
      string,
      {
        subject: BehaviorSubject<any>;
        error$: Observable<boolean | string[]>;
      }
    >()
  );

  const registerControl = <T = any>({
    key,
    validator = () => true,
  }: {
    key: string;
    validator?: Validator<T>;
  }): Control<T> => {
    if (!registeredControls.current.has(key)) {
      const subject = new BehaviorSubject(options.default[key]);
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
          const result = validator(value, key => {
            const targetControl = registeredControls.current.get(key)!; // TODO undefined?
            dependency$.next(targetControl.subject);
            return targetControl.subject.getValue();
          });
          if (typeof result === 'boolean' || Array.isArray(result)) {
            return of(result);
          }
          return result;
        })
      );
      registeredControls.current.set(key, {
        subject,
        error$,
      });
    }
    const control = registeredControls.current.get(key)!;

    return {
      setSubscriptor: cb => control.subject.subscribe(cb),
      setValue: value => control.subject.next(value),
    };
  };

  const [errors, setErrors] = useState<
    Partial<SetPropTypes<TValues, string[]>>
  >({});
  const activeSubscriptions = useRef(new Map<string, Subscription>());
  useEffect(() => {
    for (let key of registeredControls.current.keys()) {
      if (!activeSubscriptions.current.has(key)) {
        activeSubscriptions.current.set(
          key,
          registeredControls.current.get(key)!.error$.subscribe(errorResult =>
            setErrors(errors => {
              if (key in errors && errorResult === true) {
                const { [key]: _, ...newErrors } = errors;
                return newErrors as any;
              }
              if (!(key in errors) && errorResult !== true) {
                const errorValue =
                  typeof errorResult === 'boolean' ? [] : errorResult;
                return {
                  ...errors,
                  [key]: errorValue,
                };
              }
              return errors;
            })
          )
        );
      }
    }
  });
  useEffect(
    () => () => {
      activeSubscriptions.current.forEach(subscription =>
        subscription.unsubscribe()
      );
    },
    []
  );

  const { hasListener, createListener, activateKey } = useAutopruneListeners();
  const register = <T = any>(controlOptions: {
    key: string;
    validator?: Validator<T>;
  }) => {
    const { key } = controlOptions;
    activateKey(key);
    const control = registerControl(controlOptions);

    return (element: HTMLInputElement | null) => {
      if (!element) {
        return;
      }

      // TODO only can do one now :/
      if (hasListener(key)) {
        return;
      }

      createListener(key, element, 'input', evt =>
        control.setValue(evt.target.value)
      );
      control.setSubscriptor(value => (element.value = String(value)));
    };
  };

  return {
    errors,
    registerControl,
    register,
  };
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

const useAutopruneListeners = () => {
  const attachedListeners = useRef<
    Record<string, { element: HTMLElement; type: string; listener: any }[]>
  >({});
  const lastActiveKeys = useRef<Set<string>>(new Set());
  lastActiveKeys.current.clear();

  useEffect(() => {
    const registeredKeys = Object.keys(attachedListeners.current);
    registeredKeys.forEach(key => {
      if (!lastActiveKeys.current.has(key)) {
        attachedListeners.current[key].forEach(({ element, type, listener }) =>
          element.removeEventListener(type, listener)
        );
        delete attachedListeners.current[key];
      }
    });
  });

  return {
    activateKey: (key: string) => lastActiveKeys.current.add(key),
    hasListener: (key: string) => attachedListeners.current[key]?.length > 0,
    createListener: (
      key: string,
      element: HTMLElement,
      type: string,
      listener: (event: any) => void
    ) => {
      element.addEventListener(type, listener);
      attachedListeners.current[key] = attachedListeners.current[key] || [];
      attachedListeners.current[key].push({ element, type, listener });
    },
  };
};
