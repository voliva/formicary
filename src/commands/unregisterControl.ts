import { FormRef } from "../internal/formRef";
import { Paths } from "../internal/path";

export const unregisterControl = <TValues, P extends Paths<TValues>>(
  ref: FormRef<TValues>,
  key: P
) => ref.unregisterControl(key);
