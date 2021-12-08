import { useEffect } from "react";
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
import { useLatestRef } from "../internal/useLatestRef";

type OnChange<V> = (value: V, isInitial: boolean) => void;

/// With formRef ///
// string path
export function useFieldChanges<TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  path: P,
  onChange: OnChange<ValueOfPath<TValues, P>>
): void;

// key selector
export function useFieldChanges<TValues, V>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, V>,
  onChange: OnChange<V>
): void;

/// Without formRef ///
// untyped string
export function useFieldChanges(path: string, onChange: OnChange<any>): void;

// string path through keyFn
export function useFieldChanges<T>(
  key: Key<any, any, T>,
  onChange: OnChange<T>
): void;

// key selector
export function useFieldChanges<T>(
  keySelector: KeySelector<any, T>,
  onChange: OnChange<T>
): void;

export function useFieldChanges<TValues, P extends Paths<TValues>>(
  ...args: any[]
): void {
  const [formRef, keySelector, onChange] = useHookParams<
    TValues,
    [
      string | Key<any, any, any> | KeySelector<any, any>,
      (value: ValueOfPath<TValues, P>, isInitial: boolean) => void
    ]
  >(args);
  const onChangeRef = useLatestRef(onChange);

  const value$ = getMapValue(getKey(keySelector), formRef.values);

  useEffect(() => {
    let isInitial = true;
    return value$.subscribe((value) => {
      onChangeRef.current(value, isInitial);
      isInitial = false;
    });
  }, [value$]);
}
