import { FormRef } from "../internal/formRef";
import { buildObject, getMapValue, Paths, ValueOfPath } from "../internal/path";

export const getInitialValue = <TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  key: P
): ValueOfPath<TValues, P> | undefined =>
  getMapValue(key, formRef.initialValues).getValue();

export const getFormInitialValue = <TValues, T>(
  formRef: FormRef<TValues>
): Partial<T> =>
  buildObject(
    Object.fromEntries(
      Array.from(formRef.initialValues.entries()).map(([key, value]) => [
        key,
        value.hasValue() ? value.getValue() : undefined,
      ])
    )
  );
