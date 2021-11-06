import { useEffect } from "react";
import { FormRef } from "../internal/formRef";
import { getMapValue, KeySelector } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { useLatestRef } from "../internal/useLatestRef";

export function useFieldChanges<TValues, T>(
  keySelector: KeySelector<TValues, T>,
  onChange: (value: T, isInitial: boolean) => void
): void;
export function useFieldChanges<TValues, T>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, T>,
  onChange: (value: T, isInitial: boolean) => void
): void;
export function useFieldChanges<TValues, T>(...args: any[]): void {
  const [formRef, keySelector, onChange] = useHookParams<
    TValues,
    [KeySelector<TValues, T>, (value: T, isInitial: boolean) => void]
  >(args);
  const onChangeRef = useLatestRef(onChange);

  const value$ = getMapValue(keySelector, formRef.values);
  useEffect(() => {
    let isInitial = true;
    return value$.subscribe((value) => {
      onChangeRef.current(value, isInitial);
      isInitial = false;
    });
  }, [value$]);
}
