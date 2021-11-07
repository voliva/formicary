import { FormRef } from "../internal/formRef";
import { getMapValue, Paths, ValueOfPath } from "../internal/path";

export const readField = <T, P extends Paths<T>>(
  formRef: FormRef<T>,
  key: P
): ValueOfPath<T, P> | undefined => {
  try {
    return getMapValue(key, formRef.values).getValue();
  } catch (ex) {
    return undefined;
  }
};
