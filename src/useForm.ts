import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BehaviorSubject,
  concat,
  merge,
  Observable,
  of,
  Subject,
  Subscription,
} from 'rxjs';
import { filter, map, mergeMap, scan, skip, switchMap } from 'rxjs/operators';
import {
  Control,
  KeySelector,
  RegisterControlOptions,
  RegisterOptions,
  UseForm,
  UseFormOptions,
  UseWatch,
} from './useForm.types';

export const useForm: UseForm = <TValues>(options: UseFormOptions<TValues>) => {
  const registeredControls = useRef(
    new Map<
      string,
      {
        subject: BehaviorSubject<any>;
        error$: Observable<boolean | string[] | 'pending'>;
        subscriptions: Set<Subscription>;
      }
    >()
  );

  const registerControl = <T>(
    options: RegisterControlOptions<TValues, T>
  ): Control<T> => {
    const key = getKey(options.key);
    const { initialValue, validator = () => true } = options;

    if (!registeredControls.current.has(key)) {
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
          const result = validator(value, keySelector => {
            const key = getKey(keySelector);
            const targetControl = registeredControls.current.get(key);
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
      registeredControls.current.set(key, {
        subject,
        error$,
        subscriptions: new Set(),
      });
    }
    const control = registeredControls.current.get(key)!;

    return {
      subscribe: cb => {
        const subscription = control.subject.subscribe(cb);
        control.subscriptions.add(subscription);
        return () => {
          subscription.unsubscribe();
          control.subscriptions.delete(subscription);
        };
      },
      setValue: value => control.subject.next(value),
    };
  };

  const { setListener, activateKey } = useAutopruneListeners();
  const register = <T>(options: RegisterOptions<TValues, T>) => {
    const {
      validator,
      initialValue,
      eventType = 'input',
      elementProp = 'value',
    } = options;
    const serializer =
      'serializer' in options ? options.serializer : (v: any) => v;
    const deserializer =
      'deserializer' in options ? options.deserializer : (v: any) => v;
    const key = getKey(options.key);
    const control = registerControl<T>({
      key,
      initialValue,
      validator,
    });
    activateKey(key);

    return (element: HTMLInputElement | null) => {
      if (!element) {
        return;
      }

      setListener(
        key,
        element,
        eventType,
        evt => control.setValue(deserializer(evt.target[elementProp])),
        control.subscribe(
          value => ((element as any)[elementProp] = serializer(value))
        )
      );
    };
  };

  const [errors, setErrors] = useState<Record<string, 'pending' | string[]>>(
    {}
  );
  const activeSubscriptions = useRef(new Map<string, Subscription>());
  useEffect(() => {
    for (let key of registeredControls.current.keys()) {
      if (activeSubscriptions.current.has(key)) {
        continue;
      }

      const control = registeredControls.current.get(key)!;
      const subscription = control.error$.subscribe(errorResult =>
        setErrors(prevErrors => {
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
        })
      );

      activeSubscriptions.current.set(key, subscription);
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

  const publicErrors = useMemo(() => {
    const ret: Record<string, string[]> = {};
    for (let key in errors) {
      if (errors[key] === 'pending') {
        continue;
      }
      ret[key] = errors[key] as string[];
    }
    return ret;
  }, [errors]);

  const isValid = useMemo(() => {
    const errorValues = Object.values(errors);
    let hasPending = false;
    const hasError = errorValues.some(error => {
      if (error === 'pending') {
        hasPending = true;
        return false;
      }
      return true;
    });
    if (hasError) {
      return false;
    }
    if (hasPending) {
      return 'pending' as const;
    }
    return true;
  }, [errors]);

  const useWatch: UseWatch<TValues> = <T>(
    keySelector: KeySelector<TValues, T>,
    defaultValue?: T
  ): T => {
    const [update, setUpdate] = useState(true);
    const forceUpdate = () => setUpdate(!update);
    const key = getKey(keySelector);
    const control = registeredControls.current.get(key);

    useEffect(() => {
      if (!control) {
        return;
      }
      const sub = control.subject.subscribe(forceUpdate);
      return () => sub.unsubscribe();
    }, [control]);

    return control ? control.subject.getValue() : defaultValue;
  };

  const onSubmit = (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    const controls = registeredControls.current;
    const propValues = Object.fromEntries(
      Array.from(controls.entries()).map(
        ([key, control]) => [key, control.subject.getValue()] as const
      )
    );
    const formValue = buildObject(propValues);
    const result = options.onSubmit(formValue, isValid);
    if (typeof result === 'object') {
      result
        .then(validationResult => {
          if (validationResult) {
            setErrors(validationResult);
          }
        })
        .catch(() => {});
    }
  };

  return {
    registerControl,
    register,
    errors: publicErrors,
    isValid,
    useWatch,
    onSubmit,
  };
};

const path = Symbol('path');
const getKey = (keySelector: KeySelector<any, any>) => {
  if (typeof keySelector === 'string') return keySelector;
  const proxy = new Proxy(
    { path: '' },
    {
      get: (target, prop, receiver) => {
        if (prop === path) {
          return target.path;
        }
        if (typeof prop === 'symbol') {
          throw new Error(`Can't serialize symbols to keys`);
        }
        if (typeof prop === 'number') {
          target.path = `${target.path}[${prop}]`;
        } else {
          target.path = target.path.length ? `${target.path}.${prop}` : prop;
        }
        return receiver;
      },
    }
  );
  const result = keySelector(proxy);
  if (result !== proxy) {
    throw new Error(
      `You must return a value from the argument in the selector function`
    );
  }
  return result[path];
};

const buildObject = (propValues: Record<string, any>) => {
  let ret: any = {};
  for (let key in propValues) {
    setProp(ret, key, propValues[key]);
  }
  return ret;
};
const setProp = (obj: any, key: string, value: any): void => {
  if (key.startsWith('[')) {
    const end = key.indexOf(']');
    const num = Number(key.substring(1, end));
    const remaining = key.substring(end + 1);
    if (remaining.length) {
      if (remaining.startsWith('.')) {
        obj[num] = obj[num] || {};
        return setProp(obj[num], remaining.slice(1), value);
      }
      obj[num] = obj[num] || [];
      return setProp(obj[num], remaining, value);
    }
    obj[num] = value;
    return;
  }

  const propType = getPropType(key);
  switch (propType) {
    case 'array': {
      const firstBracket = key.indexOf('[');
      const prop = key.substring(0, firstBracket);
      const remaining = key.substring(firstBracket);
      obj[prop] = obj[prop] || [];
      return setProp(obj[prop], remaining, value);
    }
    case 'object': {
      const firstDot = key.indexOf('.');
      const prop = key.substring(0, firstDot);
      const remaining = key.substring(firstDot + 1);
      obj[prop] = obj[prop] || {};
      return setProp(obj[prop], remaining, value);
    }
    case 'terminal': {
      obj[key] = value;
      return;
    }
  }
};
const getPropType = (key: string) => {
  const firstDot = key.indexOf('.');
  const firstBracket = key.indexOf('[');
  if (firstDot < 0 && firstBracket < 0) {
    return 'terminal' as const;
  }

  if (firstDot > 0 && firstDot < firstBracket) {
    return 'object' as const;
  }
  return 'array' as const;
};

const arrayEquals = <T>(a: T[], b: T[]) =>
  a.length === b.length && a.every((v, i) => b[i] === v);

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
    Map<
      string,
      Map<Element, { type: string; listener: any; cleanup: () => void }>
    >
  >(new Map());
  const lastActiveKeys = new Set<string>();

  useEffect(() => {
    for (let key of attachedListeners.current.keys()) {
      if (lastActiveKeys.has(key)) {
        continue;
      }
      const keyElements = attachedListeners.current.get(key)!;
      for (let element of keyElements.keys()) {
        const { type, listener, cleanup } = keyElements.get(element)!;
        element.removeEventListener(type, listener);
        cleanup();
        keyElements.delete(element);
      }
      attachedListeners.current.delete(key);
    }
  });

  useEffect(
    () => () => {
      for (let key of attachedListeners.current.keys()) {
        const keyElements = attachedListeners.current.get(key)!;
        for (let element of keyElements.keys()) {
          const { type, listener, cleanup } = keyElements.get(element)!;
          element.removeEventListener(type, listener);
          cleanup();
          keyElements.delete(element);
        }
        attachedListeners.current.delete(key);
      }
    },
    []
  );

  return {
    activateKey: (key: string) => lastActiveKeys.add(key),
    setListener: (
      key: string,
      element: HTMLElement,
      type: string,
      listener: (event: any) => void,
      cleanup: () => void
    ) => {
      if (!attachedListeners.current.has(key)) {
        attachedListeners.current.set(key, new Map());
      }
      const keyElements = attachedListeners.current.get(key)!;

      if (keyElements.has(element)) {
        const { type, listener, cleanup } = keyElements.get(element)!;
        element.removeEventListener(type, listener);
        cleanup();
      }
      element.addEventListener(type, listener);
      keyElements.set(element, { type, listener, cleanup });
    },
  };
};
