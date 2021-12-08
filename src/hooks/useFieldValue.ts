import { useEffect, useState } from "react";
import { FormRef } from "../internal/formRef";
import {
  getKey,
  getMapValue,
  Key,
  KeySelector,
  Paths,
  ValueOfPath,
} from "../internal/path";
import { useHookParams } from "../internal/useHookParams";

type SomeValue = string | number | boolean | symbol | object;

/// With formRef ///
// string path
export function useFieldValue<TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  path: P
): ValueOfPath<TValues, P> | undefined;

// key selector
export function useFieldValue<TValues, V>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, V>
): V | undefined;

/// Without formRef ///
// untyped string
export function useFieldValue<T = SomeValue>(path: string): T | undefined;

// string path through keyFn
export function useFieldValue<T>(key: Key<any, any, T>): T | undefined;

// key selector
export function useFieldValue<T>(
  keySelector: KeySelector<any, T>
): T | undefined;

export function useFieldValue<TValues, P extends Paths<TValues>>(
  ...args: any[]
): ValueOfPath<TValues, P> | undefined {
  const [formRef, key] = useHookParams<TValues, [P]>(args);

  const value$ = getMapValue(getKey(key), formRef.values);
  const [value, setValue] = useState<ValueOfPath<TValues, P> | undefined>(
    () => {
      if (value$.hasValue()) {
        return value$.getValue();
      }
      return undefined;
    }
  );

  useEffect(() => value$.subscribe(setValue), [value$]);

  return value;
}
