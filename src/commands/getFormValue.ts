import { FormRef } from "../internal/formRef";
import { buildObject } from "../internal/path";

export const getFormValue = <T>(formRef: FormRef<T>): T =>
  buildObject(
    Object.fromEntries(
      Array.from(formRef.values.entries()).map(([key, value]) => [
        key,
        value.hasValue() ? value.getValue() : undefined,
      ])
    )
  );
