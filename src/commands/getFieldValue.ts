import { FormRef } from "../internal/formRef";
import {
  getKey,
  getMapValue,
  KeySelector,
  Paths,
  ValueOfPath,
} from "../internal/path";

// string path
export function getFieldValue<TValues, P extends Paths<TValues>>(
  formRef: FormRef<TValues>,
  path: P
): ValueOfPath<TValues, P> | undefined;

// key selector
export function getFieldValue<TValues, V>(
  formRef: FormRef<TValues>,
  keySelector: KeySelector<TValues, V>
): V | undefined;

export function getFieldValue<T, P extends Paths<T>>(
  formRef: FormRef<T>,
  key: P
): ValueOfPath<T, P> | undefined {
  try {
    return getMapValue(getKey(key), formRef.values).getValue();
  } catch (ex) {
    return undefined;
  }
}
