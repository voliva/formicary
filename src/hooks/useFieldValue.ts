import { useEffect, useState } from "react";
import { FormRef } from "../internal/formRef";
import { getMapValue, Paths, ValueOfPath } from "../internal/path";
import { useHookParams } from "../internal/useHookParams";

export function useFieldValue<TValues, P extends Paths<TValues>>(
  key: P
): ValueOfPath<TValues, P> | undefined;
export function useFieldValue<TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  key: P
): ValueOfPath<TValues, P> | undefined;
export function useFieldValue<TValues, P extends Paths<TValues>>(
  ...args: any[]
): ValueOfPath<TValues, P> | undefined {
  const [formRef, key] = useHookParams<TValues, [P]>(args);

  const value$ = getMapValue(key, formRef.values);
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
