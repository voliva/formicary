import { map } from 'rxjs/operators';
import { FormRef } from './internal/formRef';
import { getSyncValue } from './internal/util';
import { buildObject } from './path';

export const readForm = <T>(formRef: FormRef<T>): T => {
  const formValue$ = formRef.value$.pipe(
    map(values =>
      Object.fromEntries(
        Array.from(values.entries()).map(
          ([key, value]) => [key, value.getLatest()] as const
        )
      )
    )
  );
  return buildObject(getSyncValue(formValue$));
};
