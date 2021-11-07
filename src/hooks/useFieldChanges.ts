import { useEffect } from "react";
import { FormRef } from "../internal/formRef";
import { getMapValue, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";
import { useLatestRef } from "../internal/useLatestRef";

export function useFieldChanges<TValues, P extends Paths<TValues>>(
  key: P,
  onChange: (value: ValueOfPath<TValues, P>, isInitial: boolean) => void
): void;
export function useFieldChanges<TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  key: P,
  onChange: (value: ValueOfPath<TValues, P>, isInitial: boolean) => void
): void;
export function useFieldChanges<TValues, P extends Paths<TValues>>(
  ...args: any[]
): void {
  const [formRef, keySelector, onChange] = useHookParams<
    TValues,
    [
      Paths<TValues>,
      (value: ValueOfPath<TValues, P>, isInitial: boolean) => void
    ]
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
